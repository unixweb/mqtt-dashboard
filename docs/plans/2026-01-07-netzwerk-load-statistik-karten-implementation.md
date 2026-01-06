# Netzwerk-Load Statistik-Karten Implementierungsplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Zweite Sektion von Statistik-Karten im Monitor-Tab hinzufügen, die Netzwerk-Load-Metriken mit formatierter Byte-Anzeige zeigen.

**Architecture:** Bestehende Client-Karten werden in Sektionen mit Überschriften organisiert. Neue Load-Sektion wird mit blauem Farbschema hinzugefügt. formatBytes() Hilfsfunktion konvertiert Byte-Werte in lesbare Einheiten (KB, MB, GB). Beide Sektionen nutzen die gleiche monitorData Map und Update-Mechanismen.

**Tech Stack:** Vanilla JavaScript, CSS Flexbox, HTML5, bestehende MQTT/WebSocket Infrastruktur

---

## Task 1: HTML-Refactoring - Client-Karten in Sektion wrappen

**Files:**
- Modify: `public/index.html:83-108`

**Step 1: Bestehende Client-Karten lokalisieren**

Die aktuellen Client-Karten beginnen bei Zeile 83:
```html
<!-- Client-Statistik-Karten -->
<div class="monitor-stats">
    <div class="stat-card">
        <div class="stat-icon">🟢</div>
        <div class="stat-content">
            <div class="stat-value" id="stat-active">-</div>
            <div class="stat-label">Aktive Clients</div>
        </div>
    </div>
    <!-- ... weitere Karten -->
</div>
```

**Step 2: In .stats-section Wrapper einpacken**

Ersetze die Struktur durch:
```html
<!-- Client-Statistiken Sektion -->
<div class="stats-section">
    <div class="stats-header client-header">
        Client-Statistiken
    </div>
    <div class="stats-cards client-stats">
        <div class="stat-card">
            <div class="stat-icon">🟢</div>
            <div class="stat-content">
                <div class="stat-value" id="stat-active">-</div>
                <div class="stat-label">Aktive Clients</div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">🔗</div>
            <div class="stat-content">
                <div class="stat-value" id="stat-connected">-</div>
                <div class="stat-label">Verbundene Clients</div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
                <div class="stat-value" id="stat-total">-</div>
                <div class="stat-label">Gesamt Clients</div>
            </div>
        </div>
    </div>
</div>
```

**Step 3: Änderung verifizieren**

Überprüfe:
- ✓ Neuer Wrapper `.stats-section` umschließt alles
- ✓ Überschrift `.stats-header.client-header` mit Text "Client-Statistiken"
- ✓ `.monitor-stats` → `.stats-cards.client-stats` umbenannt
- ✓ Alle 3 Client-Karten unverändert (IDs bleiben gleich)
- ✓ Deutscher Kommentar "Client-Statistiken Sektion"

**Step 4: Commit**

```bash
git add public/index.html
git commit -m "refactor: wrappe Client-Karten in Sektion mit Überschrift

Bereitet Struktur für mehrere Statistik-Sektionen vor.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: HTML-Erweiterung - Load-Sektion hinzufügen

**Files:**
- Modify: `public/index.html:110-135`

**Step 1: Einfügeposition bestimmen**

Nach der Client-Sektion (die bei ca. Zeile 108 endet) und vor `<div id="monitorMessages">`.

**Step 2: Load-Sektion HTML einfügen**

Füge nach dem schließenden `</div>` der Client-Sektion ein:

```html
<!-- Netzwerk-Load Sektion -->
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

**Step 3: Änderung verifizieren**

Überprüfe:
- ✓ `.stats-section` Wrapper vorhanden
- ✓ Überschrift `.stats-header.load-header` mit "Netzwerk-Load (Bytes empfangen)"
- ✓ 3 Load-Karten mit Klasse `.load-card`
- ✓ Alle Karten haben Emoji 📥
- ✓ IDs: `stat-load-1min`, `stat-load-5min`, `stat-load-15min`
- ✓ Subvalue-IDs: `stat-load-1min-raw`, `stat-load-5min-raw`, `stat-load-15min-raw`
- ✓ Labels: "1min", "5min", "15min"
- ✓ Platziert VOR `<div id="monitorMessages">`

**Step 4: Commit**

```bash
git add public/index.html
git commit -m "feat: füge Load-Statistik-Karten Sektion hinzu

Drei Karten für Bytes empfangen über 1min, 5min, 15min.
Jede Karte zeigt formatierte und Rohwerte.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: CSS-Refactoring - Klassenumbenennung

**Files:**
- Modify: `public/styles.css:318-322`

**Step 1: Bestehende .monitor-stats Regel finden**

Suche nach:
```css
/* Client-Statistik-Karten */
.monitor-stats {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}
```

**Step 2: In .stats-cards umbenennen**

Ersetze durch:
```css
/* Statistik-Karten Container */
.stats-cards {
    display: flex;
    gap: 15px;
}
```

**Step 3: Responsive-Design Regel aktualisieren**

Finde die Media Query (ca. Zeile 420):
```css
@media (max-width: 768px) {
    .monitor-stats {
        flex-direction: column;
    }
}
```

Ersetze durch:
```css
@media (max-width: 768px) {
    .stats-cards {
        flex-direction: column;
    }
}
```

**Step 4: Änderung verifizieren**

Überprüfe:
- ✓ `.monitor-stats` → `.stats-cards` umbenannt (2 Stellen)
- ✓ Kommentar angepasst auf "Statistik-Karten Container"
- ✓ `margin-bottom` entfernt (wird von `.stats-section` übernommen)

**Step 5: Commit**

```bash
git add public/styles.css
git commit -m "refactor: benenne .monitor-stats in .stats-cards um

Allgemeiner Name für wiederverwendbare Karten-Container.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: CSS-Erweiterung - Sektionen und Load-Karten Styling

**Files:**
- Modify: `public/styles.css:318-365`

**Step 1: Sektions-Styling vor .stats-cards einfügen**

Füge VOR `.stats-cards` ein:

```css
/* Statistik-Sektionen */
.stats-section {
    margin-bottom: 20px;
}

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

**Step 2: Load-Karten Styling nach .stat-label einfügen**

Füge nach `.stat-label` ein:

```css
/* Load-Karten (blaues Farbschema) */
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

**Step 3: Änderung verifizieren**

Überprüfe:
- ✓ `.stats-section` mit `margin-bottom: 20px`
- ✓ `.stats-header` mit Padding, Border-Radius
- ✓ `.client-header` grau (#f3f4f6), lila Border (#667eea)
- ✓ `.load-header` blau (#eff6ff), blau Border (#3b82f6)
- ✓ `.load-card` hellblau (#f0f9ff), blau Border (#bfdbfe)
- ✓ `.load-card:hover` blau (#3b82f6)
- ✓ `.stat-subvalue` klein (10px), grau, kursiv

**Step 4: Commit**

```bash
git add public/styles.css
git commit -m "feat: füge Styling für Sektionen und Load-Karten hinzu

- Überschriften mit Farbcodierung (grau/blau)
- Load-Karten mit blauem Farbschema
- Subvalue-Styling für Rohwerte

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: JavaScript - formatBytes() Hilfsfunktion

**Files:**
- Modify: `public/app.js:151-175`

**Step 1: Einfügeposition finden**

Füge die Hilfsfunktion NACH `updateStatCards()` und VOR `updateMonitorDisplay()` ein (ca. nach Zeile 164).

**Step 2: formatBytes() Methode implementieren**

```javascript
formatBytes(bytes) {
    // Fallback für fehlende Daten
    if (!bytes || bytes === '-') {
        return { formatted: '-', raw: '-' };
    }

    // String zu Number konvertieren
    const num = parseFloat(bytes);
    if (isNaN(num)) {
        return { formatted: '-', raw: '-' };
    }

    // Byte-Einheiten
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let value = num;

    // In größere Einheit konvertieren bis < 1024
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

**Step 3: Methode verifizieren**

Teste mental:
- Input `"1524387"` → `{ formatted: "1.45 MB", raw: "(1.524.387 bytes)" }`
- Input `"512"` → `{ formatted: "512.00 B", raw: "(512 bytes)" }`
- Input `"-"` → `{ formatted: "-", raw: "-" }`
- Input `null` → `{ formatted: "-", raw: "-" }`

**Step 4: Commit**

```bash
git add public/app.js
git commit -m "feat: implementiere formatBytes() Hilfsfunktion

Konvertiert Byte-Zahlen in lesbare Einheiten (B, KB, MB, GB, TB)
mit deutschem Zahlenformat für Rohwerte.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: JavaScript - Element-Referenzen für Load-Karten

**Files:**
- Modify: `public/app.js:33-42`

**Step 1: initElements() Methode lokalisieren**

Finde die Stelle nach den Client-Karten Referenzen (ca. Zeile 36):
```javascript
// Statistik-Karten
this.statActive = document.getElementById('stat-active');
this.statConnected = document.getElementById('stat-connected');
this.statTotal = document.getElementById('stat-total');
```

**Step 2: Load-Karten Referenzen hinzufügen**

Füge direkt danach ein:

```javascript
// Load-Karten
this.statLoad1min = document.getElementById('stat-load-1min');
this.statLoad1minRaw = document.getElementById('stat-load-1min-raw');
this.statLoad5min = document.getElementById('stat-load-5min');
this.statLoad5minRaw = document.getElementById('stat-load-5min-raw');
this.statLoad15min = document.getElementById('stat-load-15min');
this.statLoad15minRaw = document.getElementById('stat-load-15min-raw');
```

**Step 3: Änderung verifizieren**

Überprüfe:
- ✓ 6 neue Zeilen nach den Client-Karten Referenzen
- ✓ IDs stimmen mit HTML überein
- ✓ Variablennamen sind camelCase
- ✓ Jeweils ein Paar für Wert + Rohwert (z.B. `statLoad1min` + `statLoad1minRaw`)

**Step 4: Commit**

```bash
git add public/app.js
git commit -m "feat: füge DOM-Referenzen für Load-Karten hinzu

Element-Referenzen für formatierte Werte und Rohwerte
der drei Load-Metriken (1min, 5min, 15min).

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: JavaScript - updateLoadCards() Methode

**Files:**
- Modify: `public/app.js:190-210`

**Step 1: Einfügeposition finden**

Füge die Methode NACH `formatBytes()` und VOR `updateMonitorDisplay()` ein.

**Step 2: updateLoadCards() Methode implementieren**

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

    // DOM aktualisieren - formatierte Werte
    this.statLoad1min.textContent = formatted1min.formatted;
    this.statLoad5min.textContent = formatted5min.formatted;
    this.statLoad15min.textContent = formatted15min.formatted;

    // DOM aktualisieren - Rohwerte
    this.statLoad1minRaw.textContent = formatted1min.raw;
    this.statLoad5minRaw.textContent = formatted5min.raw;
    this.statLoad15minRaw.textContent = formatted15min.raw;
}
```

**Step 3: Methode verifizieren**

Überprüfe:
- ✓ Null-Safety für DOM-Elemente
- ✓ Extrahiert 3 Topics aus `monitorData`
- ✓ Nutzt `formatBytes()` für Konvertierung
- ✓ Aktualisiert 6 DOM-Elemente (3x Wert, 3x Rohwert)
- ✓ Fallback auf "-" bei fehlenden Daten

**Step 4: Commit**

```bash
git add public/app.js
git commit -m "feat: implementiere updateLoadCards() Methode

Extrahiert Load-Metriken aus monitorData, formatiert Bytes
und aktualisiert DOM mit Werten und Rohwerten.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: JavaScript - Integration in updateMonitorDisplay()

**Files:**
- Modify: `public/app.js:166-170`

**Step 1: updateMonitorDisplay() Methode lokalisieren**

Finde die Methode (ca. Zeile 166):
```javascript
updateMonitorDisplay() {
    // Statistik-Karten zuerst aktualisieren
    this.updateStatCards();

    this.monitorMessages.innerHTML = '';
    // ... rest
}
```

**Step 2: updateLoadCards() Aufruf hinzufügen**

Ändere zu:
```javascript
updateMonitorDisplay() {
    // Statistik-Karten zuerst aktualisieren
    this.updateStatCards();
    this.updateLoadCards();

    this.monitorMessages.innerHTML = '';
    // ... rest bleibt unverändert
}
```

**Step 3: Änderung verifizieren**

Überprüfe:
- ✓ `this.updateLoadCards()` direkt nach `this.updateStatCards()`
- ✓ Rest der Methode unverändert
- ✓ Beide Update-Methoden VOR dem Löschen der Messages

**Step 4: Commit**

```bash
git add public/app.js
git commit -m "feat: integriere updateLoadCards in updateMonitorDisplay

Load-Karten werden jetzt automatisch bei jedem
Monitor-Update aktualisiert.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Manuelle End-to-End Tests

**Files:**
- None (manual testing)

**Step 1: Server starten**

```bash
npm start
```

Expected: Server läuft auf http://localhost:3000

**Step 2: Browser öffnen und Monitor-Tab aktivieren**

1. Öffne http://localhost:3000
2. Klicke auf "Monitor" Tab
3. Warte 2-3 Sekunden

Expected:
- ✓ Zwei Sektionen sichtbar
- ✓ "Client-Statistiken" Überschrift (grauer Hintergrund)
- ✓ 3 Client-Karten mit Werten
- ✓ "Netzwerk-Load (Bytes empfangen)" Überschrift (blauer Hintergrund)
- ✓ 3 Load-Karten mit 📥 Icon

**Step 3: Load-Werte prüfen**

Expected nach 2-3 Sekunden:
- ✓ Formatierte Werte erscheinen (z.B. "1.45 MB", "512.00 B")
- ✓ Rohwerte darunter in Klammern (z.B. "(1.524.387 bytes)")
- ✓ Labels "1min", "5min", "15min"

Falls "-" angezeigt wird:
- MQTT-Broker publisht möglicherweise diese Topics nicht
- Das ist OK - Fallback funktioniert

**Step 4: Farbschema verifizieren**

Client-Karten:
- ✓ Hellgrauer Hintergrund (#f9fafb)
- ✓ Hover: Lila Border (#667eea)

Load-Karten:
- ✓ Hellblauer Hintergrund (#f0f9ff)
- ✓ Hover: Blau Border (#3b82f6)

**Step 5: Responsive Design testen**

Browser-Fenster verkleinern auf < 768px:

Expected:
- ✓ Beide Sektionen stapeln Karten vertikal
- ✓ Karten nehmen volle Breite ein
- ✓ Überschriften bleiben sichtbar

**Step 6: Tab-Wechsel testen**

1. Wechsle zu "Dashboard" Tab
2. Warte 1 Sekunde
3. Wechsle zurück zu "Monitor" Tab

Expected:
- ✓ Beide Sektionen erscheinen wieder
- ✓ Werte werden neu geladen
- ✓ Keine JavaScript-Fehler in Konsole

**Step 7: Browser-Konsole prüfen**

Öffne Developer Tools (F12) → Console

Expected:
- ✓ Keine JavaScript-Fehler
- ✓ Keine fehlenden Element-IDs
- ✓ WebSocket-Verbindung aktiv

**Step 8: Verschiedene Broker-Werte simulieren (optional)**

Wenn Broker die Topics nicht publisht, kannst du mit mosquitto_pub testen:

```bash
# Kleine Werte
mosquitto_pub -h localhost -t '$SYS/broker/load/bytes/received/1min' -m '512'

# Mittlere Werte
mosquitto_pub -h localhost -t '$SYS/broker/load/bytes/received/5min' -m '1524387'

# Große Werte
mosquitto_pub -h localhost -t '$SYS/broker/load/bytes/received/15min' -m '2483027968'
```

Expected:
- ✓ Werte aktualisieren sich automatisch
- ✓ Formatierung korrekt: "512.00 B", "1.45 MB", "2.31 GB"
- ✓ Rohwerte mit Tausender-Trennung: "(512 bytes)", "(1.524.387 bytes)", "(2.483.027.968 bytes)"

**Step 9: Validierungs-Commit**

```bash
git commit --allow-empty -m "test: validiere Netzwerk-Load Statistik-Karten

Manuelle Tests erfolgreich:
✓ Zwei Sektionen mit Überschriften sichtbar
✓ Farbschema korrekt (grau/blau)
✓ Load-Werte werden formatiert angezeigt
✓ Rohwerte mit deutschem Zahlenformat
✓ Responsive Design funktioniert
✓ Tab-Wechsel funktioniert
✓ Keine JavaScript-Fehler

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Zusammenfassung

**Implementierte Features:**
- Zwei Statistik-Sektionen mit farbigen Überschriften
- 3 Load-Karten mit formatierter Byte-Anzeige + Rohwerten
- Blaues Farbschema zur Unterscheidung von Client-Karten
- Responsive Design für mobile Geräte
- Wiederverwendung der bestehenden monitorData-Infrastruktur

**Geänderte Dateien:**
- `public/index.html` - HTML-Refactoring + Load-Sektion
- `public/styles.css` - CSS-Refactoring + Sektionen-/Load-Styling
- `public/app.js` - formatBytes() + updateLoadCards() + Integration

**Commits:** 9 Commits
1. HTML-Refactoring (Client-Karten wrappen)
2. HTML-Erweiterung (Load-Sektion)
3. CSS-Refactoring (Klassenumbenennung)
4. CSS-Erweiterung (Sektionen + Load-Styling)
5. formatBytes() Hilfsfunktion
6. DOM-Referenzen für Load-Karten
7. updateLoadCards() Methode
8. Integration in updateMonitorDisplay()
9. Validierungs-Commit nach Tests

**Testing:** Manuelle End-to-End Tests mit Browser und MQTT-Broker

**Nächste Schritte:**
- Optional: Unit-Tests für formatBytes()
- Optional: Weitere Load-Metriken (bytes/sent, messages, connections)
- Optional: Animationen bei Wert-Änderungen
