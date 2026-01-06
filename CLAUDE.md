# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

Web-basiertes MQTT Dashboard zur Überwachung und Interaktion mit einem MQTT-Broker. Das Projekt ist **komplett auf Deutsch** - alle UI-Texte, Kommentare und Dokumentation müssen auf Deutsch sein.

## Wichtige Befehle

### Entwicklung
```bash
npm start              # Server starten (Port 3000)
npm run dev            # Server mit Auto-Reload starten
PORT=8080 npm start    # Server auf anderem Port starten
```

### Tests
```bash
npm test                                    # Alle Tests ausführen
npm test -- tests/mqtt-client.test.js      # Einzelne Test-Datei
npm test -- --watch                         # Tests im Watch-Modus
```

### MQTT Broker (für Tests/Entwicklung)
```bash
# Mit Docker
docker run -it -p 1883:1883 eclipse-mosquitto:latest

# Oder lokal installiert
sudo systemctl start mosquitto
```

## Architektur

### Drei-Schicht-Architektur

```
Browser (public/app.js)
    ↕ WebSocket
Server (server.js)
    ↕ MQTT
MQTT Broker
```

### Nachrichtenfluss

**Browser → Server:**
- WebSocket-Nachrichten mit `type`: `subscribe`, `unsubscribe`, `publish`
- Server validiert und leitet an MQTT-Client weiter

**MQTT → Server → Browser:**
- MQTT-Nachrichten werden an **alle** verbundenen WebSocket-Clients gebroadcastet
- `$SYS/#` Topics werden nur an Monitor-Tab geroutet (wenn aktiv)
- Reguläre Topics gehen an Dashboard-Tab

### Wichtige Komponenten

**`src/mqtt-client.js`** - MQTT Client Wrapper
- Wraps mqtt.js mit Promise-basierter API
- Managed Verbindungsstatus und Error-Handling
- Callback → Promise Konvertierung für subscribe/unsubscribe/publish

**`server.js`** - Express + WebSocket + MQTT Bridge
- `subscribedTopics` Set: Shared State über alle Clients (broadcast-basiert)
- `mqttReady` Flag: Verhindert Operationen vor MQTT-Verbindung
- Alle WebSocket-Nachrichten werden an **alle Clients** gebroadcastet

**`public/app.js`** - Frontend Client (Vanilla JS)
- `MqttDashboard` Klasse verwaltet gesamten UI-State
- Auto-Reconnect nach 3 Sekunden bei WebSocket-Disconnect
- Zwei separate Datenstrukturen:
  - `subscribedTopics` (Set): Für Topic-Liste
  - `monitorData` (Map): Für $SYS Metriken (latest value per topic)

### State Management

**Server-seitig:**
- `subscribedTopics`: Globales Set (shared über alle Clients)
- Neue Clients erhalten aktuelle Subscriptions beim Connect

**Client-seitig:**
- `subscribedTopics`: Lokales Set, synchronisiert via WebSocket
- `monitorData`: Map für System-Metriken (nur latest value)
- `messages`: Array für reguläre Nachrichten (max 100, FIFO)

### Monitor-Tab Besonderheit

Der Monitor-Tab zeigt MQTT Broker System-Metriken (`$SYS/#`):
- Auto-Subscribe bei Tab-Aktivierung
- Auto-Unsubscribe beim Wegwechseln
- Nachrichten-Routing: `$SYS/` → Monitor, andere → Dashboard
- Map-basierte Speicherung (ein Eintrag pro Topic, automatisch updated)

## Test-Struktur

```
tests/
├── mqtt-client.test.js    # Unit-Tests für MqttClient
├── server.test.js         # Integration-Tests für WebSocket-Handler
└── integration.test.js    # E2E-Tests für Subscription-Lifecycle
```

Tests benötigen laufenden MQTT Broker auf `localhost:1883` (oder `MQTT_BROKER` env var).

## Umgebungsvariablen

Konfiguration via `.env` (nicht committed):
```bash
MQTT_BROKER=localhost      # MQTT Broker Host
MQTT_BROKER_PORT=1883      # MQTT Broker Port
PORT=3000                  # HTTP Server Port
```

## Sprachkonvention

**KRITISCH:** Das gesamte Projekt ist auf Deutsch:
- UI-Texte: Deutsch
- Commit-Messages: Deutsch (außer conventional commit Präfix)
- Kommentare: Deutsch
- Dokumentation: Deutsch
- Variablen/Funktionen: Englisch (Standard Code-Konvention)

**Beispiele:**
- ✅ `<button>Abonnieren</button>`
- ✅ `showNotification('Abgemeldet: ${topic}', 'success')`
- ❌ `<button>Subscribe</button>`
- ❌ `showNotification('Unsubscribed: ${topic}', 'success')`
