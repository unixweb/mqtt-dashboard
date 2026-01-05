# MQTT Dashboard - Verwendungsanleitung

## Übersicht

Das MQTT Dashboard ermöglicht die Überwachung und Interaktion mit einem MQTT-Broker über eine benutzerfreundliche Weboberfläche.

## Verbindungsstatus

Oben rechts zeigt ein Indikator den Verbindungsstatus:
- **Grün**: Verbunden mit WebSocket und MQTT-Broker
- **Rot**: Getrennt

## Topics abonnieren

### Einzelnes Topic

Geben Sie den Topic-Namen ein, z.B.:
- `home/temperature`
- `sensors/living_room/humidity`

### Wildcards

MQTT unterstützt zwei Wildcard-Zeichen:

- **`#` (Multi-Level)**: Abonniert alle Subtopics
  - `sensors/#` → alle Topics unter sensors
  - `#` → ALLE Topics (Vorsicht bei vielen Nachrichten!)

- **`+` (Single-Level)**: Ersetzt genau eine Topic-Ebene
  - `home/+/temperature` → home/bedroom/temperature, home/kitchen/temperature

## Nachrichten veröffentlichen

1. Geben Sie das Ziel-Topic ein
2. Geben Sie die Nachricht ein (Text oder JSON)
3. Klicken Sie "Veröffentlichen"

### Beispiele

**Einfacher Text:**
- Topic: `home/alarm`
- Nachricht: `active`

**JSON-Daten:**
- Topic: `sensors/data`
- Nachricht: `{"temperature": 22.5, "humidity": 45}`

## Nachrichten anzeigen

Empfangene Nachrichten werden in Echtzeit angezeigt mit:
- Topic-Name
- Nachrichteninhalt
- Zeitstempel

Die letzten 100 Nachrichten werden gespeichert. Ältere Nachrichten werden automatisch entfernt.

## Tipps

- Starten Sie mit `#` um alle Topics zu sehen
- Verwenden Sie spezifischere Topics, um die Anzahl der Nachrichten zu reduzieren
- Nutzen Sie die Browser-Konsole für zusätzliche Debug-Informationen

## Fehlerbehebung

### "Nicht verbunden"

- Prüfen Sie, ob der MQTT-Broker läuft: `netstat -an | grep 1883`
- Prüfen Sie die Server-Konsole auf Fehler
- Starten Sie den Server neu: `npm start`

### Keine Nachrichten empfangen

- Prüfen Sie, ob das Topic korrekt abonniert ist
- Testen Sie die Veröffentlichung mit einem MQTT-Client wie `mosquitto_pub`
- Prüfen Sie die WebSocket-Verbindung in den Browser-Entwicklertools

### WebSocket-Verbindung schlägt fehl

- Prüfen Sie, ob der Server läuft
- Prüfen Sie auf Firewall-Blockierungen
- Prüfen Sie die Browser-Konsole auf Fehler
