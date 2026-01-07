# JSON Message Formatting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatisch JSON-Nachrichten erkennen und formatiert im Dashboard anzeigen.

**Architecture:** Client-seitige JSON-Erkennung mit `JSON.parse()` in der `addMessage()` Funktion. Bei valid JSON: formatierte Anzeige in `<pre>` Tag. Bei invalid JSON: Fallback zu normalem Text.

**Tech Stack:** Vanilla JavaScript (kein Framework), CSS für Styling

---

## Task 1: Implementiere JSON-Erkennung in addMessage()

**Files:**
- Modify: `public/app.js:130-148`

**Step 1: Öffne app.js und finde addMessage() Funktion**

Die Funktion beginnt bei Zeile 130:
```javascript
addMessage(data) {
  this.messages.unshift(data);

  const messageEl = document.createElement('div');
  messageEl.className = 'message-item';
  messageEl.innerHTML = `
    <div class="message-topic">${this.escapeHtml(data.topic)}</div>
    <div class="message-content">${this.escapeHtml(data.message)}</div>
    <div class="message-time">${new Date(data.timestamp).toLocaleString('de-DE')}</div>
  `;
  // ...
}
```

**Step 2: Füge JSON-Erkennung hinzu**

Ersetze die Funktion mit:

```javascript
addMessage(data) {
  this.messages.unshift(data);

  // Versuche JSON zu parsen
  let messageDisplay;

  try {
    const parsed = JSON.parse(data.message);
    // Valid JSON → formatiert anzeigen
    messageDisplay = `<pre class="json-content">${this.escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`;
  } catch {
    // Kein JSON → normaler Text
    messageDisplay = `<div class="message-content">${this.escapeHtml(data.message)}</div>`;
  }

  const messageEl = document.createElement('div');
  messageEl.className = 'message-item';
  messageEl.innerHTML = `
    <div class="message-topic">${this.escapeHtml(data.topic)}</div>
    ${messageDisplay}
    <div class="message-time">${new Date(data.timestamp).toLocaleString('de-DE')}</div>
  `;

  this.messagesContainer.insertBefore(messageEl, this.messagesContainer.firstChild);

  // Limit to 100 messages
  if (this.messages.length > 100) {
    this.messages.pop();
    this.messagesContainer.removeChild(this.messagesContainer.lastChild);
  }
}
```

**Wichtige Details:**
- `JSON.parse()` wird in try-catch Block aufgerufen
- `JSON.stringify(parsed, null, 2)` formatiert mit 2 Spaces Einrückung
- `escapeHtml()` wird NACH `JSON.stringify()` aufgerufen (XSS-Schutz)
- Fallback-Pfad ist identisch zu bisherigem Code

**Step 3: Verifiziere Syntax**

Run: `node -c public/app.js`
Expected: Keine Syntax-Fehler

**Step 4: Commit**

```bash
git add public/app.js
git commit -m "feat: füge automatische JSON-Erkennung und Formatierung hinzu

Erkennt valid JSON in MQTT-Nachrichten automatisch und zeigt es
formatiert mit Einrückung an. Fallback zu normalem Text bei invalid JSON.

- JSON.parse() in try-catch für sichere Erkennung
- JSON.stringify() mit 2 Spaces Einrückung
- XSS-sicher durch escapeHtml()

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Füge CSS-Styling für JSON-Anzeige hinzu

**Files:**
- Modify: `public/styles.css` (Ende der Datei)

**Step 1: Öffne styles.css**

Navigiere zum Ende der Datei (nach der letzten Regel).

**Step 2: Füge JSON-Content Styling hinzu**

Füge am Ende hinzu:

```css
.json-content {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #667eea;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  overflow-x: auto;
  margin: 5px 0;
  color: #333;
}
```

**Design-Entscheidungen:**
- `#f5f5f5` - Grauer Hintergrund unterscheidet JSON von Text
- `#667eea` - Lila border-left matcht Theme-Farbe (siehe `.tab-btn.active`)
- `monospace` - Courier New für Code-Lesbarkeit
- `overflow-x: auto` - Horizontal scroll bei langen Zeilen
- `margin: 5px 0` - Vertikaler Abstand zu Topic/Timestamp

**Step 3: Validate CSS**

Run: `npx stylelint public/styles.css --fix`
Expected: Keine Fehler (oder auto-fix formatting)

Alternativ (falls stylelint nicht installiert):
- Visuell prüfen dass keine Syntax-Fehler
- Öffne Datei im Browser DevTools

**Step 4: Commit**

```bash
git add public/styles.css
git commit -m "style: füge CSS für formatierte JSON-Anzeige hinzu

Grauer Hintergrund mit lila Border unterscheidet JSON von normalem Text.
Monospace Font für bessere Code-Lesbarkeit.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Manueller Test - JSON-Nachricht

**Files:**
- None (manual testing)

**Step 1: Server starten**

Terminal 1:
```bash
npm run dev
```

Expected:
- Server läuft auf http://localhost:3000
- "Connected to MQTT broker" erscheint

**Step 2: Browser öffnen**

Öffne http://localhost:3000 im Browser

Expected:
- Dashboard lädt
- WebSocket verbunden (grüner Indikator)

**Step 3: Abonniere Test-Topic**

Im Browser:
1. Gehe zu "Subscribe to Topic" Feld
2. Eingabe: `sensors/temperature`
3. Klicke "Abonnieren"

Expected:
- "Abonniert: sensors/temperature" Notification
- Topic erscheint in Topic-Liste

**Step 4: Sende JSON-Nachricht**

Terminal 2:
```bash
mosquitto_pub \
  -h localhost \
  -t sensors/temperature \
  -m '{"sensor":"temp01","value":21.7,"unit":"°C","timestamp":"2026-01-07T02:55:00Z"}'
```

Expected im Browser:
- Neue Nachricht erscheint in Messages-Container
- Topic: `sensors/temperature`
- Message wird formatiert angezeigt:
  ```
  {
    "sensor": "temp01",
    "value": 21.7,
    "unit": "°C",
    "timestamp": "2026-01-07T02:55:00Z"
  }
  ```
- Grauer Hintergrund
- Lila border-left
- Monospace Font
- Einrückung mit 2 Spaces

**Step 5: Verifiziere Styling**

Browser DevTools:
1. Öffne Inspector (F12)
2. Klicke auf die JSON-Nachricht
3. Prüfe dass `<pre class="json-content">` verwendet wird
4. Prüfe CSS-Properties:
   - background: #f5f5f5
   - border-left: 3px solid #667eea
   - font-family: monospace

---

## Task 4: Manueller Test - Normaler Text

**Files:**
- None (manual testing)

**Server läuft weiter aus Task 3**

**Step 1: Sende normale Text-Nachricht**

Terminal 2:
```bash
mosquitto_pub \
  -h localhost \
  -t sensors/temperature \
  -m 'Hello World'
```

Expected im Browser:
- Neue Nachricht erscheint
- Topic: `sensors/temperature`
- Message: `Hello World`
- **Kein** grauer Hintergrund (normales .message-content styling)
- Kein lila border-left
- Normale Font (nicht monospace)

**Step 2: Verifiziere DOM-Struktur**

Browser DevTools:
1. Inspiziere die "Hello World" Nachricht
2. Prüfe dass `<div class="message-content">` verwendet wird (NICHT `<pre>`)
3. Prüfe dass normales Styling angewendet wird

**Wichtig:** Bestätige dass nicht-JSON Nachrichten unverändert funktionieren.

---

## Task 5: Manueller Test - Invalid JSON

**Files:**
- None (manual testing)

**Server läuft weiter**

**Step 1: Sende invalides JSON**

Terminal 2:
```bash
mosquitto_pub \
  -h localhost \
  -t sensors/temperature \
  -m '{broken json'
```

Expected im Browser:
- Neue Nachricht erscheint
- Topic: `sensors/temperature`
- Message: `{broken json` (als normaler Text)
- **Kein** grauer Hintergrund
- Normales Styling
- **Keine** Error-Nachricht im Browser
- **Keine** Console-Error im Browser DevTools

**Step 2: Verifiziere Browser-Console**

Browser DevTools Console:
- Prüfe dass **keine** Fehler geloggt werden
- Try-catch hat Fehler abgefangen
- Fallback zu normalem Text funktioniert

---

## Task 6: Manueller Test - Nested JSON

**Files:**
- None (manual testing)

**Server läuft weiter**

**Step 1: Sende nested JSON-Struktur**

Terminal 2:
```bash
mosquitto_pub \
  -h localhost \
  -t sensors/multi \
  -m '{
    "device": {
      "id": "sensor-001",
      "location": "Living Room"
    },
    "sensors": [
      {
        "type": "temperature",
        "value": 21.7,
        "unit": "°C"
      },
      {
        "type": "humidity",
        "value": 45.2,
        "unit": "%"
      }
    ],
    "timestamp": "2026-01-07T03:00:00Z"
  }'
```

**Hinweis:** Multiline in Shell funktioniert mit Backslash oder direkt in Quotes.

Expected im Browser:
- Vollständig formatierte nested Struktur
- Einrückung zeigt Hierarchie korrekt:
  ```
  {
    "device": {
      "id": "sensor-001",
      "location": "Living Room"
    },
    "sensors": [
      {
        "type": "temperature",
        "value": 21.7,
        "unit": "°C"
      },
      {
        "type": "humidity",
        "value": 45.2,
        "unit": "%"
      }
    ],
    "timestamp": "2026-01-07T03:00:00Z"
  }
  ```
- Alle Nested Objects/Arrays korrekt formatiert
- Lesbar und übersichtlich

**Step 2: Verifiziere lange Zeilen**

Falls JSON sehr lange Keys/Values hat:
- Prüfe dass horizontal scroll erscheint
- Prüfe dass Layout nicht bricht
- `overflow-x: auto` in CSS sorgt dafür

---

## Task 7: Manueller Test - XSS-Schutz

**Files:**
- None (security testing)

**Server läuft weiter**

**Step 1: Sende JSON mit HTML-Tags**

Terminal 2:
```bash
mosquitto_pub \
  -h localhost \
  -t test/xss \
  -m '{"message":"<script>alert(\"XSS\")</script>","safe":true}'
```

Expected im Browser:
- JSON wird formatiert angezeigt
- `<script>` Tag wird **escaped** angezeigt als Text:
  ```
  {
    "message": "&lt;script&gt;alert(\"XSS\")&lt;/script&gt;",
    "safe": true
  }
  ```
- **Kein** Alert-Dialog erscheint
- Script wird **nicht** ausgeführt

**Step 2: Verifiziere HTML-Escape im DOM**

Browser DevTools:
1. Inspiziere die Nachricht
2. Prüfe dass `&lt;` und `&gt;` im HTML stehen (escaped)
3. Kein `<script>` Tag im DOM

**Wichtig:** `escapeHtml()` muss NACH `JSON.stringify()` aufgerufen werden, damit auch JSON-Inhalte escaped werden.

---

## Task 8: Automatisierte Tests verifizieren

**Files:**
- None (test verification)

**Step 1: Stoppe Dev-Server**

Terminal 1: CTRL-C (dank Graceful Shutdown von vorher funktioniert das jetzt! 🎉)

**Step 2: Führe alle Tests aus**

```bash
npm test
```

Expected:
- All test suites pass
- 3 test suites (mqtt-client, integration, server)
- 6 tests total
- 0 failures

**Wichtig:** Keine Regression durch JSON-Formatierung. Feature ist rein UI-Layer und ändert nichts an WebSocket/MQTT-Logik.

**Step 3: Verifiziere keine neuen Warnings**

Prüfe Test-Output:
- Nur bekanntes Warning: "Cannot log after tests are done" (pre-existing)
- Keine neuen Fehler oder Warnings

---

## Task 9: Validierungs-Commit

**Files:**
- None (empty commit for documentation)

**Step 1: Erstelle Validierungs-Commit**

```bash
git commit --allow-empty -m "test: validiere JSON-Formatierung Funktionalität

Manuelle Tests erfolgreich:
✓ JSON-Nachrichten werden automatisch erkannt
✓ Formatierung mit 2 Spaces Einrückung korrekt
✓ Grauer Hintergrund und lila Border sichtbar
✓ Monospace Font wird angewendet
✓ Normale Text-Nachrichten unverändert
✓ Invalid JSON fällt zurück zu Text (kein Error)
✓ Nested JSON wird vollständig formatiert
✓ XSS-Schutz funktioniert (HTML wird escaped)
✓ Alle automatisierten Tests passing (6/6)

Test-Cases:
- sensors/temperature: JSON-Objekt ✓
- sensors/temperature: Plain text ✓
- sensors/temperature: Invalid JSON ✓
- sensors/multi: Nested JSON mit Arrays ✓
- test/xss: HTML-Injection Prevention ✓

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Zusammenfassung

**Implementierte Features:**
- Automatische JSON-Erkennung mit `JSON.parse()`
- Formatierte Anzeige mit `JSON.stringify(parsed, null, 2)`
- CSS-Styling für JSON-Content (grau, monospace, lila border)
- XSS-Schutz durch `escapeHtml()` NACH Formatierung
- Fallback zu normalem Text bei invalid JSON
- Keine Error-Messages für User

**Geänderte Dateien:**
- `public/app.js` (~15 Zeilen in `addMessage()`)
- `public/styles.css` (~10 Zeilen neue CSS-Klasse)

**Commits:** 3 Commits
1. JavaScript-Implementation
2. CSS-Styling
3. Validierungs-Commit

**Testing:**
- Manuelle Tests mit mosquitto_pub
- Automatisierte Tests unverändert (6/6 passing)
- Security-Test (XSS-Prevention)

**Problem gelöst:**
✅ JSON-Nachrichten sind jetzt lesbar und übersichtlich formatiert
✅ Keine Breaking Changes für bestehende Funktionalität
✅ Performance-neutral (JSON.parse ist sehr schnell)

**Nächste Schritte:**
- Optional: Syntax Highlighting für JSON (future enhancement)
- Optional: Collapse/Expand für große JSON-Objekte
- Optional: Copy-Button für JSON-Nachrichten
