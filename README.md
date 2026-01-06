# MQTT Dashboard

Web-basiertes Dashboard zur Überwachung und Interaktion mit einem MQTT-Broker.

## Features

- 🔌 Real-time MQTT messaging via WebSocket
- 📊 Subscribe to multiple topics with wildcard support
- 📤 Publish messages to any topic
- 🗑️ Unsubscribe from topics dynamically
- 📈 Monitor tab for viewing $SYS/# system metrics
- 💬 Live message feed with timestamps
- 🎨 Clean, responsive UI
- ⚙️ Environment-based configuration

## Voraussetzungen

- Node.js 18 oder höher
- Laufender MQTT-Broker auf localhost:1883

## Installation

```bash
npm install
```

## Konfiguration

### Umgebungsvariablen

Kopieren Sie `.env.example` zu `.env` und passen Sie die Werte an:

```bash
cp .env.example .env
```

Verfügbare Umgebungsvariablen:
- `MQTT_BROKER`: MQTT Broker Hostname (Standard: localhost)
- `MQTT_BROKER_PORT`: MQTT Broker Port (Standard: 1883)
- `PORT`: HTTP Server Port (Standard: 3000)

**Hinweis:** Die `.env` Datei wird nicht zu Git committed und ist nur für lokale Entwicklung.

### Alternative: Umgebungsvariablen direkt setzen

Um einen anderen Broker zu verwenden:

```bash
MQTT_BROKER=andere-adresse MQTT_BROKER_PORT=1883 npm start
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

### Subscribing to Topics

1. Enter a topic pattern in the subscribe field (e.g., `sensors/#`, `home/+/temperature`)
2. Click **Abonnieren** (Subscribe)
3. The topic appears in your subscribed topics list
4. Click **Löschen** (Delete) next to any topic to unsubscribe

### Publishing Messages

1. Enter the topic in the publish field
2. Enter your message
3. Click **Veröffentlichen** (Publish)

### Receiving Messages

Subscribed messages appear automatically in the messages section with timestamps.

## Monitor Tab

The Monitor tab provides real-time visibility into MQTT broker system metrics:

1. Click the **Monitor** tab in the dashboard
2. The system automatically subscribes to `$SYS/#` topics
3. View broker statistics including:
   - Broker version and uptime
   - Connected clients
   - Message rates and counts
   - Subscription statistics
4. Switch back to Dashboard tab to resume normal operations

**Note:** The `$SYS/#` subscription is automatically managed - it activates when you open the Monitor tab and deactivates when you switch away.

## Architektur

- **Backend**: Express.js Server mit WebSocket-Unterstützung
- **MQTT Client**: mqtt.js für Broker-Kommunikation
- **Frontend**: Vanilla JavaScript mit WebSocket-Client
- **Echtzeitübertragung**: WebSocket-Verbindung zwischen Browser und Server

## Lizenz

MIT
