# Monitor Client-Statistik-Karten Design

**Datum:** 2026-01-06
**Status:** Design validiert, bereit für Implementierung

## Ziel

Hinzufügen einer visuellen Übersicht der wichtigsten Client-Metriken im Monitor-Tab. Drei horizontale Karten zeigen die Anzahl aktiver, verbundener und gesamt Clients mit Emojis als visuelle Symbole.

## Anforderungen

- **Position:** Oberhalb der vollständigen Topic-Liste im Monitor-Tab
- **Anzahl:** 3 Karten nebeneinander (horizontal)
- **Layout:** Emoji links, Wert und Beschreibung rechts
- **Sprache:** Komplett auf Deutsch
- **Metriken:**
  - `$SYS/broker/clients/active` → 🟢 Aktive Clients
  - `$SYS/broker/clients/connected` → 🔗 Verbundene Clients
  - `$SYS/broker/clients/total` → 📊 Gesamt Clients

## HTML-Struktur

```html
<!-- In monitor-tab, nach monitor-status, vor monitor-container -->
<div class="monitor-stats">
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
```

**Klassenstruktur:**
- `.monitor-stats` - Container für alle 3 Karten (Flexbox)
- `.stat-card` - Einzelne Karte
- `.stat-icon` - Emoji-Symbol
- `.stat-content` - Container für Wert + Label
- `.stat-value` - Numerischer Wert (ID für JavaScript-Update)
- `.stat-label` - Textbeschreibung

## CSS-Styling

```css
.monitor-stats {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.stat-card {
    flex: 1;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s;
}

.stat-card:hover {
    border-color: #667eea;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.stat-icon {
    font-size: 32px;
    line-height: 1;
}

.stat-content {
    flex: 1;
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #333;
    line-height: 1.2;
}

.stat-label {
    font-size: 12px;
    color: #666;
    margin-top: 2px;
}
```

**Design-Entscheidungen:**
- Hellgrauer Hintergrund (#f9fafb) mit grauem Border (#e5e7eb)
- Hover-Effekt mit Theme-Farbe (#667eea) und subtiler Shadow
- Emoji 32px groß, prominent sichtbar
- Wert groß und fett (24px, 700) für Lesbarkeit
- Label klein und dezent (12px, #666)
- Gleichmäßige Breite durch `flex: 1`

## JavaScript-Logik

### Element-Referenzen

In `initElements()` hinzufügen:

```javascript
// Stat cards
this.statActive = document.getElementById('stat-active');
this.statConnected = document.getElementById('stat-connected');
this.statTotal = document.getElementById('stat-total');
```

### Update-Logik

**Neue Methode `updateStatCards()`:**

```javascript
updateStatCards() {
    const active = this.monitorData.get('$SYS/broker/clients/active');
    const connected = this.monitorData.get('$SYS/broker/clients/connected');
    const total = this.monitorData.get('$SYS/broker/clients/total');

    this.statActive.textContent = active ? active.message : '-';
    this.statConnected.textContent = connected ? connected.message : '-';
    this.statTotal.textContent = total ? total.message : '-';
}
```

**Anpassung in `updateMonitorDisplay()`:**

```javascript
updateMonitorDisplay() {
    // Update stat cards first
    this.updateStatCards();

    // Then update the full list (existing code)
    this.monitorMessages.innerHTML = '';

    if (this.monitorData.size === 0) {
        this.monitorMessages.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">Warte auf System-Metriken...</div>';
        return;
    }

    // ... rest of existing code
}
```

## Datenfluss

1. MQTT-Broker sendet `$SYS/broker/clients/*` Topics
2. Server empfängt via MQTT und broadcastet via WebSocket
3. Client empfängt in `handleMessage()` → routet zu `addMonitorMessage()`
4. `addMonitorMessage()` speichert in `monitorData` Map
5. `updateMonitorDisplay()` wird aufgerufen
6. **NEU:** `updateStatCards()` aktualisiert die 3 Karten-Werte
7. Danach wird die vollständige Topic-Liste gerendert

## Fallback-Verhalten

- Wenn ein Topic noch nicht empfangen wurde: Anzeige von "-"
- Werte werden automatisch aktualisiert sobald Topics eintreffen
- Karten bleiben auch bei fehlenden Werten sichtbar

## Testing

**Manuelle Tests:**
1. Monitor-Tab öffnen → Karten mit "-" erscheinen
2. Nach wenigen Sekunden → Werte erscheinen
3. Werte sollten sich in Echtzeit aktualisieren
4. Hover-Effekt auf Karten testen
5. Dashboard-Tab wechseln → Monitor-Tab wieder öffnen → Karten sollten korrekt angezeigt werden

## Implementierungs-Schritte

1. HTML: `.monitor-stats` Container in `public/index.html` hinzufügen
2. CSS: Styling in `public/styles.css` einfügen
3. JavaScript: Element-Referenzen und Methoden in `public/app.js` hinzufügen
4. Test: Manueller Test mit laufendem MQTT-Broker
5. Commit: "feat: füge Client-Statistik-Karten zum Monitor-Tab hinzu"

## Zukünftige Erweiterungen

Mögliche weitere Metriken für zusätzliche Karten:
- `$SYS/broker/messages/received` - Empfangene Nachrichten
- `$SYS/broker/messages/sent` - Gesendete Nachrichten
- `$SYS/broker/uptime` - Broker-Laufzeit
- `$SYS/broker/subscriptions/count` - Anzahl Subscriptions

Diese könnten in einer zweiten Reihe oder als erweiterbare Ansicht hinzugefügt werden.
