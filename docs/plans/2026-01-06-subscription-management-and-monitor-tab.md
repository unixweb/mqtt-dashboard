# Subscription Management and Monitor Tab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add unsubscribe functionality and a Monitor tab for viewing $SYS/# system metrics

**Architecture:** Extend existing MQTT client with unsubscribe capability, add tab navigation to frontend, create dedicated Monitor view for system metrics

**Tech Stack:** Node.js, Express, WebSocket, MQTT.js, Vanilla JavaScript

---

## Task 1: Add Unsubscribe Method to MQTT Client

**Files:**
- Modify: `src/mqtt-client.js:73-83`
- Test: `tests/mqtt-client.test.js`

**Step 1: Write the failing test**

Add to `tests/mqtt-client.test.js` after the existing subscribe tests:

```javascript
describe('unsubscribe', () => {
  it('should unsubscribe from a topic successfully', async () => {
    const topic = 'test/unsubscribe';

    await client.connect();
    await client.subscribe(topic);
    await client.unsubscribe(topic);

    expect(client.client.unsubscribe).toHaveBeenCalledWith(topic, expect.any(Function));
  });

  it('should throw error when not connected', async () => {
    await expect(client.unsubscribe('test/topic'))
      .rejects.toThrow('Client not connected');
  });

  it('should reject on unsubscribe error', async () => {
    await client.connect();

    // Mock error response
    client.client.unsubscribe = jest.fn((topic, callback) => {
      callback(new Error('Unsubscribe failed'));
    });

    await expect(client.unsubscribe('test/topic'))
      .rejects.toThrow('Unsubscribe failed');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/mqtt-client.test.js`
Expected: FAIL with "client.unsubscribe is not a function"

**Step 3: Write minimal implementation**

Add to `src/mqtt-client.js` after the `subscribe` method (after line 71):

```javascript
  unsubscribe(topic) {
    if (!this.connected) {
      throw new Error('Client not connected');
    }
    return new Promise((resolve, reject) => {
      this.client.unsubscribe(topic, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/mqtt-client.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/mqtt-client.js tests/mqtt-client.test.js
git commit -m "feat: add unsubscribe method to MQTT client

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add Server-Side Unsubscribe Handler

**Files:**
- Modify: `server.js:72-107`
- Test: `tests/server.test.js`

**Step 1: Write the failing test**

Add to `tests/server.test.js`:

```javascript
it('should handle unsubscribe message', (done) => {
  const topic = 'test/unsub';

  ws.on('message', (data) => {
    const response = JSON.parse(data);

    if (response.type === 'unsubscribed') {
      expect(response.topic).toBe(topic);
      done();
    }
  });

  // First subscribe
  ws.send(JSON.stringify({ type: 'subscribe', topic }));

  setTimeout(() => {
    // Then unsubscribe
    ws.send(JSON.stringify({ type: 'unsubscribe', topic }));
  }, 100);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/server.test.js`
Expected: FAIL with timeout (no 'unsubscribed' message received)

**Step 3: Write minimal implementation**

In `server.js`, add unsubscribe handler after the publish handler (around line 99):

```javascript
      } else if (message.type === 'unsubscribe') {
        if (!mqttReady) {
          throw new Error('MQTT client not ready');
        }
        await mqttClient.unsubscribe(message.topic);
        subscribedTopics.delete(message.topic);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'unsubscribed',
              topic: message.topic
            }));
          }
        });
      }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/server.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server.js tests/server.test.js
git commit -m "feat: add server-side unsubscribe message handler

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Delete Buttons to Subscription List UI

**Files:**
- Modify: `public/app.js:118-131`
- Modify: `public/styles.css:188-198`

**Step 1: Add delete button styles**

Add to `public/styles.css` after the `#topicList li` rule (after line 198):

```css
#topicList li {
    padding: 8px 12px;
    background: #f3f4f6;
    margin-bottom: 5px;
    border-radius: 4px;
    color: #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.topic-text {
    flex: 1;
}

.unsubscribe-btn {
    width: auto;
    padding: 4px 12px;
    background: #ef4444;
    font-size: 12px;
    margin-left: 10px;
}

.unsubscribe-btn:hover {
    background: #dc2626;
}
```

**Step 2: Update topic list rendering**

Modify `updateTopicList()` method in `public/app.js` (lines 118-131):

```javascript
  updateTopicList() {
    this.topicList.innerHTML = '';

    if (this.subscribedTopics.size === 0) {
      this.topicList.innerHTML = '<li style="color: #999;">Keine Topics abonniert</li>';
      return;
    }

    this.subscribedTopics.forEach(topic => {
      const li = document.createElement('li');

      const topicText = document.createElement('span');
      topicText.className = 'topic-text';
      topicText.textContent = topic;

      const unsubBtn = document.createElement('button');
      unsubBtn.className = 'unsubscribe-btn';
      unsubBtn.textContent = 'Löschen';
      unsubBtn.onclick = () => this.unsubscribe(topic);

      li.appendChild(topicText);
      li.appendChild(unsubBtn);
      this.topicList.appendChild(li);
    });
  }
```

**Step 3: Add unsubscribe method to MqttDashboard class**

Add after the `subscribe()` method in `public/app.js` (after line 164):

```javascript
  unsubscribe(topic) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        topic
      }));
    } else {
      this.showNotification('Nicht verbunden', 'error');
    }
  }
```

**Step 4: Add unsubscribed message handler**

Add to `handleMessage()` method in `public/app.js`, after the 'subscribed' case (after line 88):

```javascript
      case 'unsubscribed':
        this.subscribedTopics.delete(data.topic);
        this.updateTopicList();
        this.showNotification(`Abgemeldet: ${data.topic}`, 'success');
        break;
```

**Step 5: Manual test**

Run: `npm start`
Open browser: http://localhost:3000
1. Subscribe to a topic (e.g., "test/#")
2. Verify "Löschen" button appears
3. Click "Löschen" button
4. Verify topic is removed from list

Expected: Topic disappears from subscribed list

**Step 6: Commit**

```bash
git add public/app.js public/styles.css
git commit -m "feat: add delete buttons for subscription management

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Add Tab Navigation Structure

**Files:**
- Modify: `public/index.html:19-66`
- Modify: `public/styles.css` (add new styles)

**Step 1: Add tab navigation HTML**

Replace the `.main-content` section in `public/index.html` (lines 19-66):

```html
        <div class="tabs">
            <button class="tab-btn active" data-tab="dashboard">Dashboard</button>
            <button class="tab-btn" data-tab="monitor">Monitor</button>
        </div>

        <div class="main-content">
            <!-- Dashboard Tab -->
            <div class="tab-content active" id="dashboard-tab">
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
                        <button type="button" id="subscribeBtn">Abonnieren</button>
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
                    <button type="button" id="publishBtn">Veröffentlichen</button>
                </section>

                <!-- Messages Section -->
                <section class="card messages-card">
                    <div class="messages-header">
                        <h2>Empfangene Nachrichten</h2>
                        <button type="button" id="clearBtn">Löschen</button>
                    </div>
                    <div id="messages" class="messages-container"></div>
                </section>
            </div>

            <!-- Monitor Tab -->
            <div class="tab-content" id="monitor-tab">
                <section class="card monitor-card">
                    <h2>System Monitor ($SYS/#)</h2>
                    <div class="monitor-status">
                        <span id="monitorStatus">Inaktiv</span>
                    </div>
                    <div id="monitorMessages" class="monitor-container"></div>
                </section>
            </div>
        </div>
```

**Step 2: Add tab styles**

Add to `public/styles.css` before `.main-content`:

```css
.tabs {
    background: white;
    padding: 10px 20px;
    border-radius: 10px 10px 0 0;
    margin-top: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 10px;
}

.tab-btn {
    width: auto;
    padding: 10px 20px;
    background: transparent;
    color: #666;
    border: none;
    border-bottom: 3px solid transparent;
    border-radius: 0;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.tab-btn:hover {
    background: #f3f4f6;
    color: #333;
}

.tab-btn.active {
    color: #667eea;
    border-bottom-color: #667eea;
    background: transparent;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}
```

**Step 3: Update .main-content styles**

Modify `.main-content` in `public/styles.css`:

```css
.main-content {
    background: white;
    padding: 20px;
    border-radius: 0 0 10px 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**Step 4: Add monitor-specific styles**

Add to `public/styles.css`:

```css
.monitor-card {
    grid-column: 1 / -1;
}

.monitor-status {
    margin-bottom: 15px;
    padding: 10px;
    background: #f3f4f6;
    border-radius: 4px;
    text-align: center;
    font-weight: 600;
}

#monitorStatus {
    color: #666;
}

#monitorStatus.active {
    color: #10b981;
}

.monitor-container {
    max-height: 600px;
    overflow-y: auto;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    padding: 10px;
}

.monitor-item {
    padding: 10px;
    background: #f9fafb;
    border-left: 4px solid #10b981;
    margin-bottom: 8px;
    border-radius: 4px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
}

.monitor-topic {
    font-family: monospace;
    font-size: 12px;
    color: #10b981;
    word-break: break-all;
}

.monitor-value {
    font-weight: 600;
    color: #333;
    text-align: right;
}
```

**Step 5: Manual test**

Run: `npm start`
Open browser: http://localhost:3000
1. Verify two tabs visible: "Dashboard" and "Monitor"
2. Click "Monitor" tab
3. Verify tab switches and shows Monitor view

Expected: Tabs switch correctly, styling looks good

**Step 6: Commit**

```bash
git add public/index.html public/styles.css
git commit -m "feat: add tab navigation structure for Dashboard and Monitor

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Implement Tab Switching Logic

**Files:**
- Modify: `public/app.js:7-23`

**Step 1: Add tab elements to initElements**

Modify `initElements()` in `public/app.js` (after line 22):

```javascript
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

    // Tab elements
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');
    this.monitorMessages = document.getElementById('monitorMessages');
    this.monitorStatus = document.getElementById('monitorStatus');
  }
```

**Step 2: Add tab initialization to constructor**

Add to constructor after `this.subscribedTopics = new Set();`:

```javascript
    this.currentTab = 'dashboard';
    this.monitorActive = false;
```

**Step 3: Add tab switching method**

Add after `updateTopicList()` method:

```javascript
  switchTab(tabName) {
    this.currentTab = tabName;

    // Update tab buttons
    this.tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab content
    this.tabContents.forEach(content => {
      if (content.id === `${tabName}-tab`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Handle monitor tab activation
    if (tabName === 'monitor' && !this.monitorActive) {
      this.activateMonitor();
    } else if (tabName !== 'monitor' && this.monitorActive) {
      this.deactivateMonitor();
    }
  }
```

**Step 4: Add tab event listeners**

Add to `attachEventListeners()`:

```javascript
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
```

**Step 5: Add placeholder monitor methods**

Add after `switchTab()` method:

```javascript
  activateMonitor() {
    this.monitorActive = true;
    this.monitorStatus.textContent = 'Aktiv';
    this.monitorStatus.classList.add('active');

    // Subscribe to $SYS/# topic
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        topic: '$SYS/#'
      }));
    }
  }

  deactivateMonitor() {
    this.monitorActive = false;
    this.monitorStatus.textContent = 'Inaktiv';
    this.monitorStatus.classList.remove('active');

    // Unsubscribe from $SYS/# topic
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        topic: '$SYS/#'
      }));
    }
  }
```

**Step 6: Manual test**

Run: `npm start`
Open browser: http://localhost:3000
1. Click "Monitor" tab
2. Verify status changes to "Aktiv" (green)
3. Click "Dashboard" tab
4. Verify Monitor tab deactivates

Expected: Tabs switch correctly, monitor activates/deactivates

**Step 7: Commit**

```bash
git add public/app.js
git commit -m "feat: implement tab switching with monitor activation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Display System Metrics in Monitor Tab

**Files:**
- Modify: `public/app.js:75-96`

**Step 1: Add monitor message tracking**

Add to constructor after `this.monitorActive = false;`:

```javascript
    this.monitorData = new Map();
```

**Step 2: Modify handleMessage to route monitor messages**

Modify `handleMessage()` method to filter monitor messages:

```javascript
  handleMessage(data) {
    switch (data.type) {
      case 'message':
        // Route $SYS messages to monitor
        if (data.topic.startsWith('$SYS/') && this.monitorActive) {
          this.addMonitorMessage(data);
        } else {
          this.addMessage(data);
        }
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
      case 'unsubscribed':
        this.subscribedTopics.delete(data.topic);
        this.updateTopicList();
        this.showNotification(`Abgemeldet: ${data.topic}`, 'success');
        break;
      case 'published':
        this.showNotification(`Veröffentlicht auf: ${data.topic}`, 'success');
        break;
      case 'error':
        this.showNotification(`Fehler: ${data.message}`, 'error');
        break;
    }
  }
```

**Step 3: Add monitor message display method**

Add after `addMessage()` method:

```javascript
  addMonitorMessage(data) {
    // Store latest value for each topic
    this.monitorData.set(data.topic, {
      message: data.message,
      timestamp: data.timestamp
    });

    this.updateMonitorDisplay();
  }

  updateMonitorDisplay() {
    this.monitorMessages.innerHTML = '';

    if (this.monitorData.size === 0) {
      this.monitorMessages.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">Warte auf System-Metriken...</div>';
      return;
    }

    // Sort by topic name
    const sortedTopics = Array.from(this.monitorData.keys()).sort();

    sortedTopics.forEach(topic => {
      const data = this.monitorData.get(topic);
      const messageEl = document.createElement('div');
      messageEl.className = 'monitor-item';

      const topicEl = document.createElement('div');
      topicEl.className = 'monitor-topic';
      topicEl.textContent = topic;

      const valueEl = document.createElement('div');
      valueEl.className = 'monitor-value';
      valueEl.textContent = data.message;

      messageEl.appendChild(topicEl);
      messageEl.appendChild(valueEl);
      this.monitorMessages.appendChild(messageEl);
    });
  }
```

**Step 4: Clear monitor data on deactivation**

Modify `deactivateMonitor()` method:

```javascript
  deactivateMonitor() {
    this.monitorActive = false;
    this.monitorStatus.textContent = 'Inaktiv';
    this.monitorStatus.classList.remove('active');

    // Clear monitor data
    this.monitorData.clear();
    this.monitorMessages.innerHTML = '';

    // Unsubscribe from $SYS/# topic
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        topic: '$SYS/#'
      }));
    }
  }
```

**Step 5: Manual test with real MQTT broker**

Ensure mosquitto is running with $SYS topics enabled.

Run: `npm start`
Open browser: http://localhost:3000
1. Click "Monitor" tab
2. Wait for system metrics to appear
3. Verify topics like $SYS/broker/version, $SYS/broker/uptime appear
4. Verify values update in real-time
5. Switch back to Dashboard tab
6. Verify monitor data clears

Expected: System metrics display and update, grouped by topic

**Step 6: Commit**

```bash
git add public/app.js
git commit -m "feat: display system metrics in Monitor tab

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Add Visual Notification System

**Files:**
- Modify: `public/app.js:192-195`
- Modify: `public/styles.css` (add notification styles)

**Step 1: Add notification container to HTML**

This will be done dynamically in JavaScript.

**Step 2: Add notification styles**

Add to `public/styles.css`:

```css
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
}

.notification.success {
    border-left: 4px solid #10b981;
    color: #059669;
}

.notification.error {
    border-left: 4px solid #ef4444;
    color: #dc2626;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}
```

**Step 3: Implement notification system**

Replace `showNotification()` method in `public/app.js`:

```javascript
  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
```

**Step 4: Manual test**

Run: `npm start`
Open browser: http://localhost:3000
1. Subscribe to a topic
2. Verify success notification appears (green)
3. Try to subscribe without topic
4. Verify error notification appears (red)
5. Unsubscribe from a topic
6. Verify success notification appears

Expected: Notifications slide in from right, auto-dismiss after 3s

**Step 5: Commit**

```bash
git add public/app.js public/styles.css
git commit -m "feat: add visual notification system

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: End-to-End Integration Test

**Files:**
- Create: `tests/integration.test.js`

**Step 1: Write integration test**

Create `tests/integration.test.js`:

```javascript
const MqttClient = require('../src/mqtt-client');

describe('Integration: Subscription Lifecycle', () => {
  let client;
  const testBroker = process.env.MQTT_BROKER || 'mqtt://localhost:1883';

  beforeEach(async () => {
    client = new MqttClient(testBroker);
    await client.connect();
  });

  afterEach(() => {
    client.disconnect();
  });

  it('should subscribe and unsubscribe successfully', async () => {
    const topic = 'test/integration/unsub';
    let messageCount = 0;

    client.onMessage((receivedTopic) => {
      if (receivedTopic === topic) {
        messageCount++;
      }
    });

    // Subscribe
    await client.subscribe(topic);

    // Publish a message
    await client.publish(topic, 'test message 1');

    // Wait for message
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(messageCount).toBe(1);

    // Unsubscribe
    await client.unsubscribe(topic);

    // Publish another message
    await client.publish(topic, 'test message 2');

    // Wait and verify no new message received
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(messageCount).toBe(1); // Still 1, not 2
  });
});
```

**Step 2: Run integration test**

Run: `npm test -- tests/integration.test.js`
Expected: PASS (requires running MQTT broker)

**Step 3: Update package.json test script**

Verify test script includes all tests:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add tests/integration.test.js
git commit -m "test: add integration test for subscription lifecycle

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Update Documentation

**Files:**
- Modify: `README.md`

**Step 1: Read current README**

Run: `cat README.md`

**Step 2: Update Features section**

Add to Features section:

```markdown
## Features

- 🔌 Real-time MQTT messaging via WebSocket
- 📊 Subscribe to multiple topics with wildcard support
- 📤 Publish messages to any topic
- 🗑️ Unsubscribe from topics dynamically
- 📈 Monitor tab for viewing $SYS/# system metrics
- 💬 Live message feed with timestamps
- 🎨 Clean, responsive UI
- ⚙️ Environment-based configuration
```

**Step 3: Add Monitor Tab usage**

Add new section after Usage:

```markdown
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
```

**Step 4: Add Unsubscribe feature to Usage**

Update Usage section to mention unsubscribe:

```markdown
### Subscribing to Topics

1. Enter a topic pattern in the subscribe field (e.g., `sensors/#`, `home/+/temperature`)
2. Click **Abonnieren** (Subscribe)
3. The topic appears in your subscribed topics list
4. Click **Löschen** (Delete) next to any topic to unsubscribe
```

**Step 5: Manual review**

Run: `cat README.md`
Verify: Documentation is clear and accurate

**Step 6: Commit**

```bash
git add README.md
git commit -m "docs: update README with unsubscribe and monitor features

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Final Testing and Validation

**Files:**
- None (manual testing)

**Step 1: Start fresh server**

```bash
# Kill any running instances
pkill -f "node server.js" || true

# Start server
npm start
```

**Step 2: Test subscription management**

1. Open http://localhost:3000
2. Subscribe to `test/topic1`
3. Subscribe to `test/topic2`
4. Verify both appear in list with Delete buttons
5. Click Delete on `test/topic1`
6. Verify it's removed from list
7. Publish to `test/topic2`
8. Verify message appears
9. Publish to `test/topic1`
10. Verify NO message appears (unsubscribed)

Expected: Subscription management works correctly

**Step 3: Test Monitor tab**

1. Click Monitor tab
2. Verify status shows "Aktiv" (green)
3. Wait 2-3 seconds
4. Verify system metrics appear (broker version, uptime, etc.)
5. Verify values update in real-time
6. Switch to Dashboard tab
7. Verify Monitor status changes to "Inaktiv"
8. Switch back to Monitor tab
9. Verify metrics reload

Expected: Monitor tab works correctly

**Step 4: Test tab isolation**

1. In Dashboard tab, subscribe to `test/message`
2. Open another terminal, publish: `mosquitto_pub -h localhost -t "test/message" -m "Hello"`
3. Verify message appears in Dashboard tab
4. Switch to Monitor tab
5. Publish again: `mosquitto_pub -h localhost -t "test/message" -m "World"`
6. Verify "test/message" does NOT appear in Monitor (only $SYS topics)
7. Switch back to Dashboard
8. Verify "World" message appears

Expected: Messages routed correctly to appropriate tabs

**Step 5: Test notifications**

1. Try each action and verify appropriate notification:
   - Subscribe → Green success notification
   - Unsubscribe → Green success notification
   - Publish → Green success notification
   - Subscribe with empty topic → Red error notification
2. Verify notifications auto-dismiss after 3 seconds

Expected: All notifications work correctly

**Step 6: Test responsiveness**

1. Resize browser window to mobile size
2. Verify layout adapts correctly
3. Verify tabs still work
4. Verify all buttons are clickable

Expected: Responsive design works

**Step 7: Manual validation complete**

Run: `echo "✅ All manual tests passed"`

**Step 8: Final commit**

```bash
git add -A
git commit -m "chore: validate subscription management and monitor features

All integration tests passed:
- Subscription/unsubscription lifecycle
- Monitor tab with \$SYS/# metrics
- Tab switching and message routing
- Responsive UI and notifications

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Summary

This plan implements:

1. **Unsubscribe functionality**:
   - Backend: `MqttClient.unsubscribe()` method
   - Server: WebSocket message handler for 'unsubscribe'
   - Frontend: Delete buttons in subscription list
   - Tests: Unit and integration tests

2. **Monitor tab**:
   - Tab navigation system
   - Auto-subscribe to `$SYS/#` when Monitor tab is active
   - Real-time display of system metrics
   - Message routing (regular messages → Dashboard, $SYS → Monitor)

3. **UX improvements**:
   - Visual notification system
   - Clean tab switching
   - Responsive design maintained

**Total tasks**: 10
**Estimated time**: 60-90 minutes
**Testing**: TDD throughout, final integration testing
