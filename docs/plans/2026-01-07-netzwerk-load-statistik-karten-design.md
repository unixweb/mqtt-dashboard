# Netzwerk-Load Statistik-Karten Design

**Datum:** 2026-01-07
**Status:** Design validiert, bereit für Implementierung

## Ziel

Zweite Sektion von Statistik-Karten im Monitor-Tab hinzufügen, die Netzwerk-Load-Metriken vom MQTT-Broker anzeigt. Die Karten zeigen empfangene Bytes über verschiedene Zeiträume (1min, 5min, 15min) mit automatischer Formatierung und Rohwert-Anzeige.

## Anforderungen

- **Position:** Unterhalb der Client-Statistiken, oberhalb der Topic-Liste
- **Anzahl:** 3 Load-Karten nebeneinander (horizontal)
- **Layout:** Emoji links, formatierter Wert, Rohwert in Bytes, Label rechts
- **Sprache:** Komplett auf Deutsch
- **Farbschema:** Blau (Unterscheidung von Client-Karten in Grau)
- **Metriken:**
  - `$SYS/broker/load/bytes/received/1min` → 📥 1min
  - `$SYS/broker/load/bytes/received/5min` → 📥 5min
  - `$SYS/broker/load/bytes/received/15min` → 📥 15min

## Design-Entscheidungen

### Visuelle Struktur

**Zwei Sektionen mit Überschriften:**

```
┌─────────────────────────────────────┐
│ Client-Statistiken         (grau)   │
├─────────────────────────────────────┤
│ 🟢 Aktive  🔗 Verbundene  📊 Gesamt │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Netzwerk-Load (Bytes empfangen) (blau) │
├─────────────────────────────────────┤
│ 📥 1min    📥 5min       📥 15min   │
└─────────────────────────────────────┘

Topic-Liste
```

**Begründung:**
- Klare visuelle Trennung durch Überschriften
- Farbcodierung: Grau = Clients, Blau = Netzwerk
- Konsistente Struktur für zukünftige Erweiterungen

### Werte-Formatierung

**Zwei Zeilen pro Karte:**
```
📥 1.45 MB          ← Formatiert, lesbar
   (1524387 bytes)  ← Rohwert, genau
   1min             ← Zeitraum-Label
```

**Begründung:**
- Formatierung (KB, MB, GB) für schnelle Lesbarkeit
- Rohwert für genaue Analyse und Debugging
- Kompakte Darstellung in einer Karte

## HTML-Struktur

### Änderungen an existierender Struktur

**Umbenennung für Konsistenz:**
- `.monitor-stats` → `.stats-cards` (allgemeiner Name)
- Wrapper `.stats-section` + `.stats-header` hinzufügen

**Client-Statistiken Sektion:**
```html
<div class="stats-section">
    <div class="stats-header client-header">
        Client-Statistiken
    </div>
    <div class="stats-cards client-stats">
        <!-- Existierende 3 Client-Karten unverändert -->
        <div class="stat-card">
            <div class="stat-icon">🟢</div>
            <div class="stat-content">
                <div class="stat-value" id="stat-active">-</div>
                <div class="stat-label">Aktive Clients</div>
            </div>
        </div>
        <!-- ... Verbundene, Gesamt -->
    </div>
</div>
```

**Neue Netzwerk-Load Sektion:**
```html
<div class="stats-section">
    <div class="stats-header load-header">
        Netzwerk-Load (Bytes empfangen)
    </div>
    <div class="stats-cards load-stats">
        <div class="stat-card load-card">
            <div class="stat-icon">📥</div>
            <div class="stat-content">
                <div class="stat-value" id="stat-load-1min">-</div>
                <div class="stat-subvalue" id="stat-load-1min-raw">-</div>
                <div class="stat-label">1min</div>
            </div>
        </div>

        <div class="stat-card load-card">
            <div class="stat-icon">📥</div>
            <div class="stat-content">
                <div class="stat-value" id="stat-load-5min">-</div>
                <div class="stat-subvalue" id="stat-load-5min-raw">-</div>
                <div class="stat-label">5min</div>
            </div>
        </div>

        <div class="stat-card load-card">
            <div class="stat-icon">📥</div>
            <div class="stat-content">
                <div class="stat-value" id="stat-load-15min">-</div>
                <div class="stat-subvalue" id="stat-load-15min-raw">-</div>
                <div class="stat-label">15min</div>
            </div>
        </div>
    </div>
</div>
```

**Neue Elemente:**
- `.stats-section` - Container für Überschrift + Karten
- `.stats-header` - Überschrift mit Hintergrundfarbe
- `.client-header` / `.load-header` - Spezifische Farben
- `.load-card` - Modifikator für blaues Styling
- `.stat-subvalue` - Rohwert in Bytes (neue Zeile)

## CSS-Styling

### Sektions-Container

```css
.stats-section {
    margin-bottom: 20px;
}
```

### Überschriften

```css
.stats-header {
    padding: 10px 15px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px 6px 0 0;
    margin-bottom: 10px;
}

.client-header {
    background: #f3f4f6;
    color: #374151;
    border-left: 4px solid #667eea;
}

.load-header {
    background: #eff6ff;
    color: #1e40af;
    border-left: 4px solid #3b82f6;
}
```

**Design-Entscheidungen:**
- Abgerundete obere Ecken für sanften Übergang
- Linker Border als Akzent in Sektionsfarbe
- Client: Grautöne (#f3f4f6, #667eea)
- Load: Blautöne (#eff6ff, #3b82f6)

### Umbenennung existierende Klasse

```css
/* Alt: .monitor-stats → Neu: .stats-cards */
.stats-cards {
    display: flex;
    gap: 15px;
}
```

### Load-Karten Styling

```css
.load-card {
    background: #f0f9ff;
    border: 2px solid #bfdbfe;
}

.load-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.stat-subvalue {
    font-size: 10px;
    color: #6b7280;
    margin-top: 2px;
    font-style: italic;
}
```

**Farbschema Vergleich:**

| Element | Client-Karten | Load-Karten |
|---------|---------------|-------------|
| Background | #f9fafb (hellgrau) | #f0f9ff (hellblau) |
| Border | #e5e7eb (grau) | #bfdbfe (blau) |
| Hover | #667eea (lila) | #3b82f6 (blau) |
| Überschrift | #f3f4f6 (grau) | #eff6ff (blau) |

### Responsive Design

```css
@media (max-width: 768px) {
    .stats-cards {
        flex-direction: column;
    }

    .stat-card {
        width: 100%;
    }
}
```

**Verhalten:** Beide Sektionen stapeln Karten vertikal auf mobilen Geräten.

## JavaScript-Logik

### Neue Hilfsfunktion: formatBytes()

```javascript
formatBytes(bytes) {
    if (!bytes || bytes === '-') {
        return { formatted: '-', raw: '-' };
    }

    const num = parseFloat(bytes);
    if (isNaN(num)) {
        return { formatted: '-', raw: '-' };
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let value = num;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return {
        formatted: `${value.toFixed(2)} ${units[unitIndex]}`,
        raw: `(${num.toLocaleString('de-DE')} bytes)`
    };
}
```

**Beispiele:**
- Input: `"1524387"` → Output: `{ formatted: "1.45 MB", raw: "(1.524.387 bytes)" }`
- Input: `"512"` → Output: `{ formatted: "512.00 B", raw: "(512 bytes)" }`
- Input: `"-"` → Output: `{ formatted: "-", raw: "-" }`

### Element-Referenzen in initElements()

```javascript
// Nach den existierenden statActive/Connected/Total
// Load-Karten
this.statLoad1min = document.getElementById('stat-load-1min');
this.statLoad1minRaw = document.getElementById('stat-load-1min-raw');
this.statLoad5min = document.getElementById('stat-load-5min');
this.statLoad5minRaw = document.getElementById('stat-load-5min-raw');
this.statLoad15min = document.getElementById('stat-load-15min');
this.statLoad15minRaw = document.getElementById('stat-load-15min-raw');
```

### Neue Methode: updateLoadCards()

```javascript
updateLoadCards() {
    // Null-Safety Check
    if (!this.statLoad1min || !this.statLoad5min || !this.statLoad15min) {
        return;
    }

    // Daten aus monitorData Map extrahieren
    const load1min = this.monitorData.get('$SYS/broker/load/bytes/received/1min');
    const load5min = this.monitorData.get('$SYS/broker/load/bytes/received/5min');
    const load15min = this.monitorData.get('$SYS/broker/load/bytes/received/15min');

    // Bytes formatieren
    const formatted1min = this.formatBytes(load1min ? load1min.message : '-');
    const formatted5min = this.formatBytes(load5min ? load5min.message : '-');
    const formatted15min = this.formatBytes(load15min ? load15min.message : '-');

    // DOM aktualisieren
    this.statLoad1min.textContent = formatted1min.formatted;
    this.statLoad1minRaw.textContent = formatted1min.raw;
    this.statLoad5min.textContent = formatted5min.formatted;
    this.statLoad5minRaw.textContent = formatted5min.raw;
    this.statLoad15min.textContent = formatted15min.formatted;
    this.statLoad15minRaw.textContent = formatted15min.raw;
}
```

### Integration in updateMonitorDisplay()

```javascript
updateMonitorDisplay() {
    // Statistik-Karten zuerst aktualisieren
    this.updateStatCards();      // Existierend
    this.updateLoadCards();       // NEU

    this.monitorMessages.innerHTML = '';

    // ... rest bleibt unverändert
}
```

## Datenfluss

1. MQTT-Broker sendet `$SYS/broker/load/bytes/received/*` Topics
2. Server empfängt via MQTT und broadcastet via WebSocket
3. Client empfängt in `handleMessage()` → routet zu `addMonitorMessage()`
4. `addMonitorMessage()` speichert in `monitorData` Map (gleicher Mechanismus wie Client-Karten)
5. `updateMonitorDisplay()` wird aufgerufen
6. **NEU:** `updateLoadCards()` extrahiert Load-Daten, formatiert Bytes, aktualisiert DOM
7. Danach: `updateStatCards()` für Client-Karten
8. Danach: Vollständige Topic-Liste rendern

**Wiederverwendung:** Nutzt die existierende `monitorData` Map-Struktur ohne Änderungen.

## Fallback-Verhalten

- Wenn Topic noch nicht empfangen: Anzeige von "-" (formatiert und raw)
- Ungültige Werte (NaN): Fallback auf "-"
- Fehlende DOM-Elemente: Null-Safety verhindert Fehler
- Werte werden automatisch aktualisiert sobald Topics eintreffen

## Testing

### Manuelle Tests

1. **Initiale Anzeige:**
   - Monitor-Tab öffnen → Beide Sektionen erscheinen mit "-" Werten
   - Überschriften sind sichtbar und farblich unterscheidbar

2. **Werte-Update:**
   - Nach 2-3 Sekunden → Formatierte Werte erscheinen (z.B. "1.45 MB")
   - Rohwerte in Bytes darunter sichtbar (z.B. "(1524387 bytes)")

3. **Formatierung:**
   - Kleine Werte: "512.00 B"
   - Mittlere Werte: "1.45 MB"
   - Große Werte: "2.31 GB"

4. **Hover-Effekt:**
   - Client-Karten: Lila Border (#667eea)
   - Load-Karten: Blau Border (#3b82f6)

5. **Responsive Design:**
   - Browser < 768px → Beide Sektionen stapeln vertikal
   - Überschriften bleiben sichtbar

6. **Tab-Wechsel:**
   - Dashboard-Tab → Monitor-Tab → Beide Sektionen korrekt angezeigt

### Unit Tests (optional)

```javascript
describe('formatBytes', () => {
    test('formats bytes correctly', () => {
        expect(formatBytes('1524387')).toEqual({
            formatted: '1.45 MB',
            raw: '(1.524.387 bytes)'
        });
    });

    test('handles missing data', () => {
        expect(formatBytes('-')).toEqual({
            formatted: '-',
            raw: '-'
        });
    });
});
```

## Implementierungs-Schritte

1. **HTML-Refactoring:** Existierende Client-Karten in `.stats-section` wrappen
2. **HTML-Erweiterung:** Neue Load-Sektion hinzufügen
3. **CSS-Refactoring:** `.monitor-stats` → `.stats-cards` umbenennen
4. **CSS-Erweiterung:** Überschriften, Load-Karten, `.stat-subvalue` Styles
5. **JavaScript:** `formatBytes()` Hilfsfunktion implementieren
6. **JavaScript:** Element-Referenzen in `initElements()` hinzufügen
7. **JavaScript:** `updateLoadCards()` Methode implementieren
8. **JavaScript:** Integration in `updateMonitorDisplay()`
9. **Testing:** Manuelle Tests durchführen
10. **Commit:** Feature-Commit mit deutscher Nachricht

## Zukünftige Erweiterungen

Weitere mögliche Load-Metriken:
- `$SYS/broker/load/bytes/sent/*` - Gesendete Bytes
- `$SYS/broker/load/messages/received/*` - Nachrichten pro Zeitraum
- `$SYS/broker/load/connections/*` - Verbindungen pro Zeitraum

Diese könnten als zusätzliche Sektionen oder als umschaltbare Views implementiert werden.

## Kompatibilität

**Keine Breaking Changes:**
- Existierende Client-Karten bleiben funktional
- Nur CSS-Klassenumbenennung (intern)
- Keine Änderungen an Datenstrukturen
- Abwärtskompatibel mit bestehendem JavaScript

**Browser-Kompatibilität:**
- Alle modernen Browser (Chrome, Firefox, Safari, Edge)
- Emojis werden korrekt angezeigt
- Flexbox wird unterstützt
