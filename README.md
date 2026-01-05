# MQTT Dashboard

Web-basiertes Dashboard zur Überwachung und Interaktion mit einem MQTT-Broker.

## Features

- Echtzeit-Anzeige von MQTT-Nachrichten
- Topic-Abonnement mit Wildcard-Unterstützung (#, +)
- Nachrichtenveröffentlichung auf beliebige Topics
- WebSocket-basierte Live-Updates
- Responsive Design

## Voraussetzungen

- Node.js 18 oder höher
- Laufender MQTT-Broker auf localhost:1883

## Installation

```bash
npm install
```

## Konfiguration

Standardmäßig verbindet sich das Dashboard mit `mqtt://localhost:1883`.

Um einen anderen Broker zu verwenden:

```bash
MQTT_BROKER=mqtt://andere-adresse:1883 npm start
```

Um einen anderen Port zu verwenden:

```bash
PORT=8080 npm start
```

## Starten

```bash
npm start
```

Dann öffnen Sie http://localhost:3000 im Browser.

## Entwicklung

Mit Auto-Reload während der Entwicklung:

```bash
npm run dev
```

## Tests

```bash
npm test
```

## MQTT-Broker lokal starten (optional)

Wenn Sie keinen MQTT-Broker haben, können Sie Mosquitto verwenden:

### Mit Docker:

```bash
docker run -it -p 1883:1883 eclipse-mosquitto:latest
```

### Mit apt (Ubuntu/Debian):

```bash
sudo apt-get install mosquitto
sudo systemctl start mosquitto
```

## Verwendung

1. **Topics abonnieren**: Geben Sie ein Topic ein (z.B. `sensors/#` für alle Sensor-Topics oder `#` für alle Topics)
2. **Nachrichten empfangen**: Abonnierte Nachrichten erscheinen automatisch im Nachrichten-Bereich
3. **Nachrichten veröffentlichen**: Topic und Nachricht eingeben und auf "Veröffentlichen" klicken

## Architektur

- **Backend**: Express.js Server mit WebSocket-Unterstützung
- **MQTT Client**: mqtt.js für Broker-Kommunikation
- **Frontend**: Vanilla JavaScript mit WebSocket-Client
- **Echtzeitübertragung**: WebSocket-Verbindung zwischen Browser und Server

## Lizenz

MIT
