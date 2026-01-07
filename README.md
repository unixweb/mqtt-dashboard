# MQTT Dashboard

Web-basiertes Dashboard zur Überwachung und Interaktion mit einem MQTT-Broker.

**Version:** 1.0.10 | [Changelog](CHANGELOG.md) | [Releases](https://github.com/unixweb/mqtt-dashboard/releases)

## Features

- 🔌 Echtzeit-MQTT-Messaging über WebSocket
- 📊 Abonnieren mehrerer Topics mit Wildcard-Unterstützung
- 📤 Veröffentlichen von Nachrichten auf beliebigen Topics
- 🗑️ Dynamisches Abmelden von Topics
- 📈 Monitor-Tab zur Anzeige von $SYS/#-Systemmetriken
- 💬 Live-Nachrichten-Feed mit Zeitstempeln
- 📝 **Automatische JSON-Formatierung** - JSON-Nachrichten werden automatisch erkannt und formatiert angezeigt
- 🎨 Übersichtliche, responsive Benutzeroberfläche
- ⚙️ Umgebungsbasierte Konfiguration

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

### Topics abonnieren

1. Geben Sie ein Topic-Muster in das Abonnieren-Feld ein (z.B. `sensors/#`, `home/+/temperature`)
2. Klicken Sie auf **Abonnieren**
3. Das Topic erscheint in der Liste der abonnierten Topics
4. Klicken Sie auf **Löschen** neben einem Topic, um es abzumelden

### Nachrichten veröffentlichen

1. Geben Sie das Topic im Veröffentlichen-Feld ein
2. Geben Sie Ihre Nachricht ein
3. Klicken Sie auf **Veröffentlichen**

### Nachrichten empfangen

Abonnierte Nachrichten erscheinen automatisch im Nachrichten-Bereich mit Zeitstempeln.

## Monitor-Tab

Der Monitor-Tab bietet Echtzeit-Einblick in MQTT-Broker-Systemmetriken:

1. Klicken Sie auf den **Monitor**-Tab im Dashboard
2. Das System abonniert automatisch `$SYS/#`-Topics
3. Sehen Sie Broker-Statistiken einschließlich:
   - Broker-Version und Betriebszeit
   - Verbundene Clients
   - Nachrichten-Raten und -Anzahl
   - Abonnement-Statistiken
4. Wechseln Sie zurück zum Dashboard-Tab für normale Operationen

**Hinweis:** Das `$SYS/#`-Abonnement wird automatisch verwaltet - es aktiviert sich beim Öffnen des Monitor-Tabs und deaktiviert sich beim Wegwechseln.

## Architektur

- **Backend**: Express.js Server mit WebSocket-Unterstützung
- **MQTT Client**: mqtt.js für Broker-Kommunikation
- **Frontend**: Vanilla JavaScript mit WebSocket-Client
- **Echtzeitübertragung**: WebSocket-Verbindung zwischen Browser und Server

## Lizenz

MIT
