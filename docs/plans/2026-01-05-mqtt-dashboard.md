# MQTT Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web-based MQTT dashboard that connects to mqtt://localhost:1883, displays real-time topic messages, and allows publishing messages.

**Architecture:** Modern web application using Node.js backend with Express and MQTT.js for broker communication, vanilla JavaScript frontend with real-time updates via WebSockets, and a clean UI for monitoring and interacting with MQTT topics.

**Tech Stack:** Node.js, Express, MQTT.js, WebSocket (ws), HTML/CSS/JavaScript (vanilla)

---

## Task 1: Project Setup and Dependencies

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Initialize Node.js project**

Create `package.json`:

```json
{
  "name": "mqtt-dashboard",
  "version": "1.0.0",
  "description": "MQTT Dashboard for monitoring and publishing to MQTT broker",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "jest"
  },
  "keywords": ["mqtt", "dashboard", "monitoring"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mqtt": "^5.3.4",
    "ws": "^8.16.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

**Step 2: Create .gitignore**

Create `.gitignore`:

```
node_modules/
.env
*.log
.DS_Store
```

**Step 3: Create README**

Create `README.md`:

```markdown
# MQTT Dashboard

Web-based dashboard for monitoring and interacting with MQTT broker.

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

Open browser at http://localhost:3000

## Configuration

Default MQTT broker: mqtt://localhost:1883
```

**Step 4: Install dependencies**

Run: `npm install`
Expected: Dependencies installed successfully

**Step 5: Commit**

```bash
git init
git add .
git commit -m "chore: initialize project with dependencies"
```

---

## Task 2: MQTT Client Module

**Files:**
- Create: `src/mqtt-client.js`
- Create: `tests/mqtt-client.test.js`

**Step 1: Write the failing test**

Create `tests/mqtt-client.test.js`:

```javascript
const MqttClient = require('../src/mqtt-client');

describe('MqttClient', () => {
  test('should create client with broker URL', () => {
    const client = new MqttClient('mqtt://localhost:1883');
    expect(client.brokerUrl).toBe('mqtt://localhost:1883');
    expect(client.connected).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../src/mqtt-client'"

**Step 3: Create directory structure**

Run: `mkdir -p src tests`

**Step 4: Write minimal implementation**

Create `src/mqtt-client.js`:

```javascript
const mqtt = require('mqtt');

class MqttClient {
  constructor(brokerUrl) {
    this.brokerUrl = brokerUrl;
    this.connected = false;
    this.client = null;
    this.messageHandlers = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.brokerUrl);

      this.client.on('connect', () => {
        this.connected = true;
        resolve();
      });

      this.client.on('error', (err) => {
        reject(err);
      });

      this.client.on('message', (topic, message) => {
        this.messageHandlers.forEach(handler => {
          handler(topic, message.toString());
        });
      });
    });
  }

  subscribe(topic) {
    if (!this.connected) {
      throw new Error('Client not connected');
    }
    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  publish(topic, message) {
    if (!this.connected) {
      throw new Error('Client not connected');
    }
    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.connected = false;
    }
  }
}

module.exports = MqttClient;
```

**Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 6: Commit**

```bash
git add src/mqtt-client.js tests/mqtt-client.test.js
git commit -m "feat: add MQTT client module"
```

---

## Task 3: Express Server Setup

**Files:**
- Create: `server.js`
- Create: `tests/server.test.js`

**Step 1: Write basic server test**

Create `tests/server.test.js`:

```javascript
describe('Server', () => {
  test('placeholder for server tests', () => {
    expect(true).toBe(true);
  });
});
```

**Step 2: Run test**

Run: `npm test`
Expected: PASS

**Step 3: Create Express server**

Create `server.js`:

```javascript
const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');
const MqttClient = require('./src/mqtt-client');

const app = express();
const PORT = process.env.PORT || 3000;
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Connecting to MQTT broker: ${MQTT_BROKER}`);
});

// WebSocket server
const wss = new WebSocketServer({ server });

// MQTT client
const mqttClient = new MqttClient(MQTT_BROKER);

// Store subscribed topics
const subscribedTopics = new Set();

// Connect to MQTT broker
mqttClient.connect()
  .then(() => {
    console.log('Connected to MQTT broker');
  })
  .catch((err) => {
    console.error('Failed to connect to MQTT broker:', err);
  });

// Handle MQTT messages
mqttClient.onMessage((topic, message) => {
  const data = {
    type: 'message',
    topic,
    message,
    timestamp: new Date().toISOString()
  };

  // Broadcast to all WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');

  // Send current subscriptions
  ws.send(JSON.stringify({
    type: 'subscriptions',
    topics: Array.from(subscribedTopics)
  }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'subscribe') {
        await mqttClient.subscribe(message.topic);
        subscribedTopics.add(message.topic);
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'subscribed',
              topic: message.topic
            }));
          }
        });
      } else if (message.type === 'publish') {
        await mqttClient.publish(message.topic, message.message);
        ws.send(JSON.stringify({
          type: 'published',
          topic: message.topic
        }));
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
      ws.send(JSON.stringify({
        type: 'error',
        message: err.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  mqttClient.disconnect();
  server.close(() => {
    process.exit(0);
  });
});
```

**Step 4: Test server manually**

Run: `npm start`
Expected: Server starts without errors (will show MQTT connection error if broker not running)

Stop with Ctrl+C

**Step 5: Commit**

```bash
git add server.js tests/server.test.js
git commit -m "feat: add Express server with WebSocket and MQTT integration"
```

---

## Task 4: Frontend HTML Structure

**Files:**
- Create: `public/index.html`
- Create: `public/styles.css`

**Step 1: Create public directory**

Run: `mkdir -p public`

**Step 2: Create HTML structure**

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MQTT Dashboard</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>MQTT Dashboard</h1>
            <div class="connection-status">
                <span class="status-indicator" id="statusIndicator"></span>
                <span id="statusText">Verbindung wird hergestellt...</span>
            </div>
        </header>

        <div class="main-content">
            <!-- Subscribe Section -->
            <section class="card">
                <h2>Topics abonnieren</h2>
                <div class="input-group">
                    <input
                        type="text"
                        id="subscribeInput"
                        placeholder="z.B. sensors/# oder home/temperature"
                        value="#"
                    >
                    <button id="subscribeBtn">Abonnieren</button>
                </div>
                <div class="subscribed-topics">
                    <h3>Abonnierte Topics:</h3>
                    <ul id="topicList"></ul>
                </div>
            </section>

            <!-- Publish Section -->
            <section class="card">
                <h2>Nachricht veröffentlichen</h2>
                <div class="input-group">
                    <input
                        type="text"
                        id="publishTopic"
                        placeholder="Topic"
                    >
                </div>
                <div class="input-group">
                    <textarea
                        id="publishMessage"
                        placeholder="Nachricht"
                        rows="3"
                    ></textarea>
                </div>
                <button id="publishBtn">Veröffentlichen</button>
            </section>

            <!-- Messages Section -->
            <section class="card messages-card">
                <div class="messages-header">
                    <h2>Empfangene Nachrichten</h2>
                    <button id="clearBtn">Löschen</button>
                </div>
                <div id="messages" class="messages-container"></div>
            </section>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
```

**Step 3: Create CSS styles**

Create `public/styles.css`:

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}

header {
    background: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

h1 {
    color: #333;
    font-size: 28px;
}

.connection-status {
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #gray;
    animation: pulse 2s infinite;
}

.status-indicator.connected {
    background: #10b981;
}

.status-indicator.disconnected {
    background: #ef4444;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

#statusText {
    color: #666;
    font-size: 14px;
}

.main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.messages-card {
    grid-column: 1 / -1;
}

h2 {
    color: #333;
    margin-bottom: 15px;
    font-size: 20px;
}

h3 {
    color: #555;
    margin-top: 15px;
    margin-bottom: 10px;
    font-size: 16px;
}

.input-group {
    margin-bottom: 10px;
}

input[type="text"],
textarea {
    width: 100%;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.3s;
}

input[type="text"]:focus,
textarea:focus {
    outline: none;
    border-color: #667eea;
}

button {
    width: 100%;
    padding: 12px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
}

button:hover {
    background: #5568d3;
}

button:active {
    transform: scale(0.98);
}

#clearBtn {
    width: auto;
    padding: 8px 16px;
    background: #ef4444;
}

#clearBtn:hover {
    background: #dc2626;
}

.messages-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.messages-container {
    max-height: 500px;
    overflow-y: auto;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    padding: 10px;
}

.message-item {
    padding: 12px;
    background: #f9fafb;
    border-left: 4px solid #667eea;
    margin-bottom: 10px;
    border-radius: 4px;
}

.message-topic {
    font-weight: 600;
    color: #667eea;
    margin-bottom: 5px;
}

.message-content {
    color: #333;
    word-wrap: break-word;
    margin-bottom: 5px;
}

.message-time {
    font-size: 12px;
    color: #999;
}

#topicList {
    list-style: none;
}

#topicList li {
    padding: 8px 12px;
    background: #f3f4f6;
    margin-bottom: 5px;
    border-radius: 4px;
    color: #333;
}

@media (max-width: 768px) {
    .main-content {
        grid-template-columns: 1fr;
    }

    header {
        flex-direction: column;
        gap: 15px;
    }
}
```

**Step 4: Test HTML rendering**

Run: `npm start`
Open: http://localhost:3000
Expected: Dashboard UI loads (WebSocket will try to connect)

Stop with Ctrl+C

**Step 5: Commit**

```bash
git add public/index.html public/styles.css
git commit -m "feat: add dashboard HTML and CSS"
```

---

## Task 5: Frontend JavaScript Application

**Files:**
- Create: `public/app.js`

**Step 1: Create WebSocket client and UI logic**

Create `public/app.js`:

```javascript
class MqttDashboard {
  constructor() {
    this.ws = null;
    this.messages = [];
    this.subscribedTopics = new Set();

    this.initElements();
    this.initWebSocket();
    this.attachEventListeners();
  }

  initElements() {
    this.statusIndicator = document.getElementById('statusIndicator');
    this.statusText = document.getElementById('statusText');
    this.subscribeInput = document.getElementById('subscribeInput');
    this.subscribeBtn = document.getElementById('subscribeBtn');
    this.publishTopic = document.getElementById('publishTopic');
    this.publishMessage = document.getElementById('publishMessage');
    this.publishBtn = document.getElementById('publishBtn');
    this.messagesContainer = document.getElementById('messages');
    this.topicList = document.getElementById('topicList');
    this.clearBtn = document.getElementById('clearBtn');
  }

  initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.updateStatus(true);
      console.log('WebSocket verbunden');
    };

    this.ws.onclose = () => {
      this.updateStatus(false);
      console.log('WebSocket getrennt');
      // Reconnect after 3 seconds
      setTimeout(() => this.initWebSocket(), 3000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket Fehler:', error);
      this.updateStatus(false);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
  }

  updateStatus(connected) {
    if (connected) {
      this.statusIndicator.className = 'status-indicator connected';
      this.statusText.textContent = 'Verbunden';
    } else {
      this.statusIndicator.className = 'status-indicator disconnected';
      this.statusText.textContent = 'Getrennt';
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'message':
        this.addMessage(data);
        break;
      case 'subscriptions':
        data.topics.forEach(topic => this.subscribedTopics.add(topic));
        this.updateTopicList();
        break;
      case 'subscribed':
        this.subscribedTopics.add(data.topic);
        this.updateTopicList();
        this.showNotification(`Abonniert: ${data.topic}`, 'success');
        break;
      case 'published':
        this.showNotification(`Veröffentlicht auf: ${data.topic}`, 'success');
        break;
      case 'error':
        this.showNotification(`Fehler: ${data.message}`, 'error');
        break;
    }
  }

  addMessage(data) {
    this.messages.unshift(data);

    const messageEl = document.createElement('div');
    messageEl.className = 'message-item';
    messageEl.innerHTML = `
      <div class="message-topic">${this.escapeHtml(data.topic)}</div>
      <div class="message-content">${this.escapeHtml(data.message)}</div>
      <div class="message-time">${new Date(data.timestamp).toLocaleString('de-DE')}</div>
    `;

    this.messagesContainer.insertBefore(messageEl, this.messagesContainer.firstChild);

    // Limit to 100 messages
    if (this.messages.length > 100) {
      this.messages.pop();
      this.messagesContainer.removeChild(this.messagesContainer.lastChild);
    }
  }

  updateTopicList() {
    this.topicList.innerHTML = '';

    if (this.subscribedTopics.size === 0) {
      this.topicList.innerHTML = '<li style="color: #999;">Keine Topics abonniert</li>';
      return;
    }

    this.subscribedTopics.forEach(topic => {
      const li = document.createElement('li');
      li.textContent = topic;
      this.topicList.appendChild(li);
    });
  }

  attachEventListeners() {
    this.subscribeBtn.addEventListener('click', () => this.subscribe());
    this.subscribeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.subscribe();
    });

    this.publishBtn.addEventListener('click', () => this.publish());
    this.publishMessage.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) this.publish();
    });

    this.clearBtn.addEventListener('click', () => this.clearMessages());
  }

  subscribe() {
    const topic = this.subscribeInput.value.trim();

    if (!topic) {
      this.showNotification('Bitte Topic eingeben', 'error');
      return;
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        topic
      }));
      this.subscribeInput.value = '';
    } else {
      this.showNotification('Nicht verbunden', 'error');
    }
  }

  publish() {
    const topic = this.publishTopic.value.trim();
    const message = this.publishMessage.value.trim();

    if (!topic || !message) {
      this.showNotification('Topic und Nachricht erforderlich', 'error');
      return;
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'publish',
        topic,
        message
      }));
      this.publishMessage.value = '';
    } else {
      this.showNotification('Nicht verbunden', 'error');
    }
  }

  clearMessages() {
    this.messages = [];
    this.messagesContainer.innerHTML = '';
  }

  showNotification(message, type) {
    // Simple console notification for now
    console.log(`[${type}] ${message}`);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MqttDashboard();
});
```

**Step 2: Test complete application**

Run: `npm start`
Open: http://localhost:3000
Expected: Dashboard loads, shows connection status

**Step 3: Commit**

```bash
git add public/app.js
git commit -m "feat: add frontend WebSocket client and UI logic"
```

---

## Task 6: Testing and Documentation

**Files:**
- Modify: `README.md`
- Create: `docs/usage.md`

**Step 1: Update README with detailed instructions**

Modify `README.md`:

```markdown
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
```

**Step 2: Create usage documentation**

Create `docs/usage.md`:

```markdown
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
```

**Step 3: Commit documentation**

```bash
git add README.md docs/usage.md
git commit -m "docs: add comprehensive README and usage guide"
```

---

## Task 7: Final Testing and Verification

**Step 1: Test with MQTT broker**

Prerequisites:
- Ensure MQTT broker is running on localhost:1883
- If not available, start one with: `docker run -d -p 1883:1883 eclipse-mosquitto:latest`

**Step 2: Run application**

Run: `npm start`
Expected: Server starts and connects to MQTT broker

**Step 3: Manual testing checklist**

Open http://localhost:3000 and verify:

1. Connection indicator shows green
2. Subscribe to `#` topic
3. Open terminal and publish test message:
   ```bash
   mosquitto_pub -h localhost -t test/topic -m "Hello MQTT"
   ```
4. Verify message appears in dashboard
5. Publish message from dashboard to `test/response`
6. Verify with: `mosquitto_sub -h localhost -t test/response`
7. Test multiple subscriptions
8. Test clearing messages

**Step 4: Run automated tests**

Run: `npm test`
Expected: All tests pass

**Step 5: Create final commit**

```bash
git add -A
git commit -m "chore: final verification and testing complete"
```

---

## Completion Checklist

- [ ] All dependencies installed
- [ ] MQTT client module working
- [ ] Express server with WebSocket running
- [ ] Frontend UI responsive and functional
- [ ] Real-time message updates working
- [ ] Topic subscription working (including wildcards)
- [ ] Message publishing working
- [ ] Documentation complete
- [ ] Tests passing
- [ ] Manual testing completed

## Notes for Implementation

- Default broker URL is mqtt://localhost:1883
- Port 3000 for web server (configurable via PORT env var)
- WebSocket automatically reconnects on disconnect
- Messages limited to 100 for performance
- German UI language as requested
- No authentication (can be added later if needed)
- Supports MQTT wildcard topics (# and +)
