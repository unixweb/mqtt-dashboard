# JSON Message Formatting Design

**Datum:** 2026-01-07
**Status:** Design validiert, bereit für Implementierung

## Problem

MQTT-Nachrichten die JSON enthalten werden aktuell als roher String angezeigt. Bei strukturierten Daten (z.B. Sensor-Daten) ist das schwer lesbar:

```
{"sensor":"temp01","value":21.7,"unit":"°C","timestamp":"2026-01-07T02:55:00Z"}
```

## Lösung: Automatische JSON-Erkennung und Formatierung

Das Dashboard erkennt automatisch ob eine MQTT-Nachricht valid JSON ist und zeigt sie formatiert an.

## Architektur

### Client-seitige Verarbeitung

Die JSON-Erkennung erfolgt **komplett im Browser** (JavaScript), nicht auf dem Server.

**Warum client-seitig?**
- ✅ Keine Server-Änderungen nötig
- ✅ Funktioniert mit bestehendem WebSocket-Protokoll
- ✅ Sehr performant (JSON.parse ist native im Browser)
- ✅ Kein Risiko für Server-Stabilität
- ✅ Keine Token-Kosten (keine LLM-Verarbeitung)

### Verarbeitungs-Flow

```
MQTT Nachricht empfangen
    ↓
Server sendet via WebSocket (unverändert)
    ↓
Browser: addMessage(data)
    ↓
Versuche JSON.parse(data.message)
    ↓
  ┌─────────────────┴─────────────────┐
  │                                   │
Valid JSON                      Kein JSON
  │                                   │
JSON.stringify(parsed, null, 2)   escapeHtml(message)
  │                                   │
<pre class="json-content">        <div class="message-content">
  │                                   │
  └─────────────────┬─────────────────┘
                    ↓
            Render in DOM
```

## Implementation

### Code-Änderungen

**Datei:** `public/app.js`
**Funktion:** `addMessage()` (Zeile 130-148)

**Vorher:**
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

**Nachher:**
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
  // ... rest bleibt gleich
}
```

### CSS-Änderungen

**Datei:** `public/styles.css`

Neue Klasse für JSON-Anzeige:

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
- Grauer Hintergrund (#f5f5f5) unterscheidet JSON von normalem Text
- Lila border-left (#667eea) matcht Theme-Farbe
- Monospace Font für bessere Lesbarkeit
- Horizontal scroll bei langen Zeilen (overflow-x: auto)
- 2 Spaces Einrückung (JSON.stringify second parameter)

## User Experience

### Beispiel: Sensor-Daten

**Input (MQTT Message):**
```
{"sensor":"temp01","value":21.7,"unit":"°C","timestamp":"2026-01-07T02:55:00Z"}
```

**Output (Dashboard Anzeige):**
```
Topic: sensors/temperature

{
  "sensor": "temp01",
  "value": 21.7,
  "unit": "°C",
  "timestamp": "2026-01-07T02:55:00Z"
}

07.01.2026, 02:55:00
```

### Fallback-Verhalten

**Normale Text-Nachricht:**
```
Hello World
```

Wird weiterhin normal als Text angezeigt (keine Änderung).

**Invalides JSON:**
```
{broken json
```

Wird als Text angezeigt, keine Fehlermeldung für User.

## Error Handling

### JSON.parse() Fehler

Try-Catch Block fängt alle Parse-Fehler ab:
- Kein Error-Log für User
- Nachricht wird einfach als Text angezeigt
- Keine Performance-Probleme durch Exception-Handling

### XSS-Schutz

**WICHTIG:** `escapeHtml()` wird NACH `JSON.stringify()` aufgerufen:

```javascript
this.escapeHtml(JSON.stringify(parsed, null, 2))
```

Dies verhindert XSS-Attacks auch bei JSON-Nachrichten.

### Edge Cases

**1. JSON-Arrays:**
```json
[1, 2, 3]
```
→ Funktioniert, wird formatiert angezeigt

**2. JSON-Primitives:**
```json
"just a string"
42
true
null
```
→ Valid JSON, wird formatiert (erscheint wie normaler Text)

**3. Sehr große JSON:**
- Horizontal scroll verhindert Layout-Probleme
- Keine Größen-Limitierung nötig (Browser handled das)

## Testing

### Manuelle Test-Cases

**1. JSON-Nachricht senden:**
```bash
mosquitto_pub \
  -h localhost \
  -t sensors/temperature \
  -m '{"sensor":"temp01","value":21.7,"unit":"°C"}'
```
Expected: Formatiert mit Einrückung angezeigt

**2. Text-Nachricht senden:**
```bash
mosquitto_pub \
  -h localhost \
  -t test/simple \
  -m 'Hello World'
```
Expected: Normal als Text angezeigt

**3. Invalides JSON senden:**
```bash
mosquitto_pub \
  -h localhost \
  -t test/broken \
  -m '{broken'
```
Expected: Als Text angezeigt, keine Fehler

**4. Nested JSON:**
```bash
mosquitto_pub \
  -h localhost \
  -t test/nested \
  -m '{"device":{"id":1,"sensors":[{"type":"temp","value":21.7}]}}'
```
Expected: Vollständig formatiert mit Nested-Struktur

### Automatisierte Tests

Keine neuen Tests nötig:
- Bestehende Tests testen WebSocket-Flow
- JSON-Formatierung ist rein UI-Layer
- Keine Breaking Changes am Protokoll

## Performance

### JSON.parse() Performance

- **Native Browser-API** (C++ implementiert)
- Durchsatz: ~100 MB/s für typical JSON
- Für MQTT-Nachrichten (<10 KB) negligible (<0.1ms)

### Rendering Performance

- `JSON.stringify()` ebenfalls native
- DOM-Manipulation identisch zu vorher
- Keine zusätzlichen Event-Listener
- Kein Memory-Leak Risiko

## Backwards Compatibility

**100% kompatibel:**
- Server unverändert
- WebSocket-Protokoll unverändert
- Bestehende nicht-JSON Nachrichten funktionieren wie vorher
- Keine Breaking Changes

## Future Enhancements

**Optional, nicht in diesem Design:**

1. **Syntax Highlighting:**
   - Farben für keys, values, strings
   - Library wie `highlight.js` oder `prism.js`

2. **Collapse/Expand:**
   - Große JSON-Objekte zusammenklappbar
   - Library: `json-formatter-js`

3. **Copy-Button:**
   - "Copy JSON" Button für jede Nachricht
   - Clipboard API verwenden

4. **JSON-Pfad anzeigen:**
   - Bei Nested Objects Pfad anzeigen (z.B. `device.sensors[0].value`)

5. **Filter nach JSON-Feldern:**
   - "Zeige nur Nachrichten mit field X"
   - Requires client-side indexing

**YAGNI:** Diese Features werden NICHT implementiert, außer explizit gewünscht.

## Zusammenfassung

**Änderungen:**
- `public/app.js`: ~15 Zeilen in `addMessage()`
- `public/styles.css`: ~10 Zeilen neue CSS-Klasse

**Vorteile:**
- ✅ Automatisch - kein User-Input nötig
- ✅ Sehr einfach zu implementieren
- ✅ Keine Server-Änderungen
- ✅ Performance-neutral
- ✅ XSS-sicher
- ✅ Backwards compatible

**Testing:**
- Manuell mit mosquitto_pub
- Bestehende Tests unverändert

**Nächste Schritte:**
1. Implementation in Git-Worktree
2. Manuelle Tests mit verschiedenen JSON-Formaten
3. Visual Review der Formatierung
4. Merge to master
