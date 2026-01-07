# Graceful Shutdown Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ersetze den rudimentären SIGINT Handler durch einen vollständigen Graceful Shutdown Mechanismus, der CTRL-C beim `npm run dev` korrekt verarbeitet.

**Architecture:** Signal-Handler (SIGINT/SIGTERM) triggern asynchrone Cleanup-Sequenz: HTTP Server schließen → WebSocket-Verbindungen trennen → MQTT Client disconnect → Process beenden. Force-Exit Timeout schützt vor hängenden Verbindungen.

**Tech Stack:** Node.js Process Events, Express Server API, WebSocket Server API, bestehender MqttClient

---

## Kontext

**Aktueller Code (server.js:128-135):**
```javascript
// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  mqttClient.disconnect();
  server.close(() => {
    process.exit(0);
  });
});
```

**Probleme:**
- ❌ Kein SIGTERM Handler (Docker/systemd)
- ❌ WebSocket-Verbindungen werden nicht geschlossen
- ❌ Kein Schutz vor mehrfacher Ausführung
- ❌ Kein Timeout bei hängenden Verbindungen
- ❌ Keine Fehlerbehandlung
- ❌ Englische Ausgaben statt Deutsch

---

## Task 1: Shutdown-Funktion implementieren

**Files:**
- Modify: `server.js:128-136` (existierenden Code ersetzen)

**Step 1: Existierenden Shutdown-Code entfernen**

Lösche die Zeilen 128-135:
```javascript
// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  mqttClient.disconnect();
  server.close(() => {
    process.exit(0);
  });
});
```

**Step 2: Neue Shutdown-Funktion schreiben**

Füge an der gleichen Stelle ein (Zeile 128):

```javascript
// Graceful Shutdown Handler
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return; // Verhindere doppelte Ausführung
  isShuttingDown = true;

  console.log(`\n${signal} empfangen. Fahre sauber herunter...`);

  // Timeout: Force-Exit nach 5 Sekunden
  const forceExitTimeout = setTimeout(() => {
    console.error('Shutdown dauert zu lange, erzwinge Beendigung');
    process.exit(1);
  }, 5000);

  try {
    // 1. HTTP Server schließen (keine neuen Verbindungen)
    await new Promise((resolve) => {
      server.close(() => {
        console.log('HTTP Server geschlossen');
        resolve();
      });
    });

    // 2. Alle WebSocket-Verbindungen schließen
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(1000, 'Server shutdown');
      }
    });
    console.log('WebSocket Verbindungen geschlossen');

    // 3. MQTT Client disconnect
    await mqttClient.disconnect();
    console.log('MQTT Client getrennt');

    clearTimeout(forceExitTimeout);
    console.log('Shutdown erfolgreich');
    process.exit(0);
  } catch (err) {
    console.error('Fehler beim Shutdown:', err);
    process.exit(1);
  }
}

// Signal-Handler registrieren
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
```

**Step 3: Code verifizieren**

Überprüfe:
- ✓ `isShuttingDown` Flag am Anfang
- ✓ `gracefulShutdown()` ist async function
- ✓ Force-Exit Timeout mit 5 Sekunden
- ✓ Try-Catch Block um Cleanup-Sequenz
- ✓ Server.close() mit Promise wrapper
- ✓ WebSocket forEach mit close(1000, 'Server shutdown')
- ✓ mqttClient.disconnect() mit await
- ✓ Deutsche Console-Ausgaben
- ✓ SIGINT und SIGTERM Handler

**Step 4: Commit**

```bash
git add server.js
git commit -m "feat: implementiere vollständigen Graceful Shutdown Handler

Ersetzt rudimentären SIGINT Handler durch vollständige Lösung:
- SIGINT + SIGTERM Handler
- Cleanup-Sequenz: HTTP → WebSocket → MQTT
- Force-Exit Timeout (5s)
- Fehlerbehandlung
- Deutsche Ausgaben

Löst Problem dass npm run dev nicht mit CTRL-C beendet werden kann.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Manueller Test - CTRL-C während normalem Betrieb

**Files:**
- None (manual testing)

**Step 1: Server im Dev-Modus starten**

```bash
npm run dev
```

Expected:
- Server startet auf Port 3000
- "Connected to MQTT broker" erscheint
- Keine Fehler

**Step 2: CTRL-C drücken**

Drücke CTRL-C im Terminal.

Expected:
```
SIGINT empfangen. Fahre sauber herunter...
HTTP Server geschlossen
WebSocket Verbindungen geschlossen
MQTT Client getrennt
Shutdown erfolgreich
```

- ✓ Prozess beendet nach ~1 Sekunde
- ✓ Keine Fehler
- ✓ Kein CTRL-Z + kill%% nötig

**Step 3: Verifiziere, dass Prozess wirklich beendet ist**

```bash
echo $?
```

Expected: `0` (Exit-Code 0 = erfolgreiche Beendigung)

---

## Task 3: Manueller Test - CTRL-C mit aktiven WebSocket-Verbindungen

**Files:**
- None (manual testing)

**Step 1: Server starten und Browser öffnen**

Terminal 1:
```bash
npm run dev
```

Browser:
- Öffne http://localhost:3000
- Monitor-Tab aktivieren (WebSocket-Verbindung wird hergestellt)
- Verifiziere: "New WebSocket client connected" im Terminal

**Step 2: CTRL-C drücken**

Im Terminal CTRL-C drücken.

Expected im Terminal:
```
SIGINT empfangen. Fahre sauber herunter...
HTTP Server geschlossen
WebSocket Verbindungen geschlossen
MQTT Client getrennt
Shutdown erfolgreich
```

Expected im Browser:
- WebSocket-Verbindung wird getrennt
- Connection-Lost Nachricht erscheint (falls implementiert)
- Keine JavaScript-Fehler in Browser-Konsole

**Step 3: Server neu starten**

```bash
npm run dev
```

Expected:
- Server startet normal
- Browser kann sich neu verbinden (Reload-Page)
- Keine Probleme durch vorherige Verbindung

---

## Task 4: Manueller Test - Force-Exit Timeout (optional)

**Files:**
- None (manual testing - nur für Verifikation)

**Hinweis:** Dieser Test ist optional und nur zur Verifikation, dass der Timeout funktioniert. Im normalen Betrieb sollte er NICHT auftreten.

**Step 1: Timeout temporär auf 1 Sekunde reduzieren**

In `server.js`:
```javascript
// Temporary für Test
const forceExitTimeout = setTimeout(() => {
  console.error('Shutdown dauert zu lange, erzwinge Beendigung');
  process.exit(1);
}, 1000); // <- Geändert von 5000 zu 1000
```

**Step 2: Server starten und CTRL-C drücken**

```bash
npm run dev
# CTRL-C drücken
```

Expected:
- Wenn Cleanup < 1 Sekunde: Normaler Shutdown
- Wenn Cleanup > 1 Sekunde: "Shutdown dauert zu lange..." + Exit-Code 1

**Step 3: Timeout zurücksetzen auf 5 Sekunden**

```javascript
const forceExitTimeout = setTimeout(() => {
  console.error('Shutdown dauert zu lange, erzwinge Beendigung');
  process.exit(1);
}, 5000); // <- Zurück auf 5000
```

**Step 4: Änderungen NICHT committen**

Dieser Test war nur zur Verifikation. Timeout bleibt bei 5 Sekunden.

---

## Task 5: Validierungs-Commit

**Files:**
- None (empty commit for documentation)

**Step 1: Validierungs-Commit erstellen**

```bash
git commit --allow-empty -m "test: validiere Graceful Shutdown Funktionalität

Manuelle Tests erfolgreich:
✓ CTRL-C beendet npm run dev sauber
✓ Kein CTRL-Z + kill%% mehr nötig
✓ HTTP Server wird geschlossen
✓ WebSocket-Verbindungen werden getrennt
✓ MQTT Client disconnect funktioniert
✓ Deutsche Ausgaben korrekt
✓ Exit-Code 0 bei erfolgreichem Shutdown
✓ WebSocket im Browser wird sauber getrennt

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Zusammenfassung

**Implementierte Features:**
- Vollständiger Graceful Shutdown Handler
- SIGINT (CTRL-C) und SIGTERM (kill/Docker) Support
- Cleanup-Sequenz: HTTP → WebSocket → MQTT
- Force-Exit Timeout (5 Sekunden)
- Fehlerbehandlung mit Try-Catch
- Deutsche Console-Ausgaben
- Schutz vor doppelter Ausführung

**Geänderte Dateien:**
- `server.js` (Zeilen 128-136 ersetzt durch 128-167)

**Commits:** 2 Commits
1. Feature-Implementation
2. Validierungs-Commit

**Testing:** Manuelle Tests mit `npm run dev` + CTRL-C

**Problem gelöst:**
✅ `npm run dev` kann jetzt mit CTRL-C beendet werden
✅ Kein CTRL-Z + kill%% mehr nötig
✅ Sauberes Herunterfahren aller Ressourcen

**Nächste Schritte:**
- Optional: Automatisierte Tests für Signal-Handling (schwierig zu testen)
- Optional: Konfigurierbare Timeout-Dauer via Env-Var
- Optional: Metrics/Logging beim Shutdown
