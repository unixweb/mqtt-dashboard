# Graceful Shutdown Design

**Datum:** 2026-01-07
**Status:** Design validiert, bereit für Implementierung

## Problem

`npm run dev` verwendet `node --watch server.js`, was beim Beenden mit CTRL-C nicht korrekt terminiert. Der Prozess muss mit CTRL-Z gestoppt und dann mit `kill %%` beendet werden.

**Root Cause:**
- `--watch` Flag spawnt Child-Prozesse
- Signale (SIGINT von CTRL-C) werden nicht korrekt an Child-Prozesse weitergeleitet
- Server-Ressourcen (MQTT-Verbindung, WebSockets, HTTP-Server) werden nicht sauber geschlossen

## Lösung: Graceful Shutdown Handler

Implementiere Signal-Handler für `SIGINT` (CTRL-C) und `SIGTERM` (kill), die ein kontrolliertes Herunterfahren durchführen.

## Architektur

### Signal-Handler Flow

```
SIGINT/SIGTERM empfangen
    ↓
isShuttingDown Flag prüfen (prevent double shutdown)
    ↓
Timeout starten (5 Sekunden Force-Exit)
    ↓
1. HTTP Server schließen (keine neuen Verbindungen)
    ↓
2. Alle WebSocket-Clients schließen
    ↓
3. MQTT Client disconnect
    ↓
Timeout löschen → process.exit(0)
```

### Komponenten

**1. Shutdown Flag**
- `isShuttingDown` verhindert mehrfache Ausführung
- Wichtig bei gleichzeitigem SIGINT + SIGTERM

**2. Force-Exit Timeout**
- Nach 5 Sekunden: `process.exit(1)` erzwingen
- Schützt vor hängenden Verbindungen
- Verhindert, dass Server nicht beendet werden kann

**3. Cleanup-Sequenz**

**a) HTTP Server schließen:**
```javascript
server.close(() => {
  console.log('HTTP Server geschlossen');
  resolve();
});
```
- Stoppt Annahme neuer Verbindungen
- Wartet auf bestehende Requests (Promise-basiert)

**b) WebSocket-Verbindungen schließen:**
```javascript
wss.clients.forEach((client) => {
  if (client.readyState === WebSocket.OPEN) {
    client.close(1000, 'Server shutdown');
  }
});
```
- Close-Code `1000` = Normal Closure
- Nachricht: "Server shutdown"
- Verhindert ungültige Reconnect-Versuche

**c) MQTT Client disconnect:**
```javascript
await mqttClient.disconnect();
```
- Nutzt bestehende `disconnect()` Methode aus `src/mqtt-client.js`
- Sendet DISCONNECT Packet an Broker
- Schließt TCP-Verbindung sauber

## Code-Platzierung

**Datei:** `server.js`
**Position:** Am Ende der Datei (nach allen Event-Handlern)

```javascript
// ... existing code ...

// Graceful Shutdown Handler
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} empfangen. Fahre sauber herunter...`);

  const forceExitTimeout = setTimeout(() => {
    console.error('Shutdown dauert zu lange, erzwinge Beendigung');
    process.exit(1);
  }, 5000);

  try {
    // 1. HTTP Server schließen
    await new Promise((resolve) => {
      server.close(() => {
        console.log('HTTP Server geschlossen');
        resolve();
      });
    });

    // 2. WebSocket-Verbindungen schließen
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

## Error Handling

### Fehlerszenarien

**1. Server schon geschlossen:**
- `server.close()` callback wird sofort aufgerufen
- Kein Problem, Promise resolves normal

**2. MQTT disconnect fehlschlägt:**
- Try-Catch fängt Fehler
- Loggt Fehler, beendet trotzdem mit `exit(1)`

**3. Timeout erreicht:**
- Force-Exit nach 5 Sekunden
- Verhindert hängende Prozesse
- Exit-Code 1 signalisiert abnormale Beendigung

**4. Mehrfache Signale:**
- `isShuttingDown` Flag verhindert Re-Entry
- Erste Ausführung läuft bis zum Ende

## Deutsche Ausgaben

Alle Console-Ausgaben auf Deutsch (Projekt-Konvention):
- "SIGINT empfangen. Fahre sauber herunter..."
- "HTTP Server geschlossen"
- "WebSocket Verbindungen geschlossen"
- "MQTT Client getrennt"
- "Shutdown erfolgreich"
- "Fehler beim Shutdown: ..."

## Testing

### Manuelle Tests

**1. CTRL-C während normalem Betrieb:**
```bash
npm run dev
# Server läuft
# CTRL-C drücken
```
Expected:
- Signal empfangen
- Alle Ressourcen geschlossen
- Prozess beendet nach ~1 Sekunde

**2. CTRL-C mit aktiven WebSocket-Verbindungen:**
```bash
npm run dev
# Browser öffnen → http://localhost:3000
# Dashboard läuft (WebSocket verbunden)
# CTRL-C drücken
```
Expected:
- WebSocket Connection wird mit Code 1000 geschlossen
- Browser zeigt "Connection closed"
- Server beendet sauber

**3. CTRL-C während MQTT-Operationen:**
```bash
npm run dev
# Topics abonnieren
# Nachrichten publishen
# CTRL-C drücken
```
Expected:
- MQTT DISCONNECT wird gesendet
- Broker sieht saubere Trennung
- Server beendet ohne Fehler

**4. Force-Exit Timeout Test:**
```bash
# Simuliere hängende Verbindung (nur für Test)
# Normal nicht nötig
```
Expected:
- Nach 5 Sekunden: "Shutdown dauert zu lange, erzwinge Beendigung"
- Exit-Code 1

## Vorteile

**Für Entwicklung:**
- ✅ `npm run dev` kann mit CTRL-C beendet werden
- ✅ Kein CTRL-Z + kill%% mehr nötig
- ✅ Schnelleres Neustarten während Entwicklung

**Für Produktion:**
- ✅ Sauberes Herunterfahren bei Deployment
- ✅ Keine offenen Verbindungen zum MQTT-Broker
- ✅ Keine Zombie-Prozesse
- ✅ Docker/Systemd-kompatibel (SIGTERM)

**Code-Qualität:**
- ✅ Best Practice für Node.js Server
- ✅ Professionelles Error Handling
- ✅ Deutsche Ausgaben (Projekt-Konvention)

## Kompatibilität

**Funktioniert mit:**
- `npm run dev` (node --watch)
- `npm start` (node)
- Docker (SIGTERM)
- systemd (SIGTERM)
- Kubernetes (SIGTERM)

**Keine Breaking Changes:**
- Keine API-Änderungen
- Keine neuen Dependencies
- Nur zusätzlicher Code am Ende von server.js

## Zukünftige Erweiterungen

Optional, später:
- Drain Period für in-flight Requests
- Konfigurierbare Timeout-Dauer
- Metrics logging beim Shutdown
- Health-Check Endpoint deaktivieren
