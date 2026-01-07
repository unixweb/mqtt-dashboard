class MqttDashboard {
  constructor() {
    this.ws = null;
    this.messages = [];
    this.subscribedTopics = new Set();
    this.currentTab = 'dashboard';
    this.monitorActive = false;
    this.monitorData = new Map();

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

    // Tab elements
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');
    this.monitorMessages = document.getElementById('monitorMessages');
    this.monitorStatus = document.getElementById('monitorStatus');

    // Statistik-Karten
    this.statActive = document.getElementById('stat-active');
    this.statConnected = document.getElementById('stat-connected');
    this.statTotal = document.getElementById('stat-total');

    // Load-Karten
    this.statLoad1min = document.getElementById('stat-load-1min');
    this.statLoad1minRaw = document.getElementById('stat-load-1min-raw');
    this.statLoad5min = document.getElementById('stat-load-5min');
    this.statLoad5minRaw = document.getElementById('stat-load-5min-raw');
    this.statLoad15min = document.getElementById('stat-load-15min');
    this.statLoad15minRaw = document.getElementById('stat-load-15min-raw');
  }

  initWebSocket() {
    // Close existing connection if any
    if (this.ws) {
      this.ws.onclose = null; // Remove handler to prevent recursive reconnect
      this.ws.close();
    }

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
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
        this.showNotification('Ungültige Nachricht empfangen', 'error');
      }
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

  addMessage(data) {
    this.messages.unshift(data);

    // Versuche JSON zu parsen
    let messageDisplay;

    try {
      const parsed = JSON.parse(data.message);
      // Valid JSON → formatiert anzeigen
      messageDisplay = `<pre class="json-content">${this.escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`;
    } catch {
      // Kein JSON → normaler Text
      messageDisplay = `<div class="message-content">${this.escapeHtml(data.message)}</div>`;
    }

    const messageEl = document.createElement('div');
    messageEl.className = 'message-item';
    messageEl.innerHTML = `
      <div class="message-topic">${this.escapeHtml(data.topic)}</div>
      ${messageDisplay}
      <div class="message-time">${new Date(data.timestamp).toLocaleString('de-DE')}</div>
    `;

    this.messagesContainer.insertBefore(messageEl, this.messagesContainer.firstChild);

    // Limit to 100 messages
    if (this.messages.length > 100) {
      this.messages.pop();
      this.messagesContainer.removeChild(this.messagesContainer.lastChild);
    }
  }

  addMonitorMessage(data) {
    // Store latest value for each topic
    this.monitorData.set(data.topic, {
      message: data.message,
      timestamp: data.timestamp
    });

    this.updateMonitorDisplay();
  }

  updateStatCards() {
    if (!this.statActive || !this.statConnected || !this.statTotal) {
      return;
    }

    const active = this.monitorData.get('$SYS/broker/clients/active');
    const connected = this.monitorData.get('$SYS/broker/clients/connected');
    const total = this.monitorData.get('$SYS/broker/clients/total');

    this.statActive.textContent = active ? active.message : '-';
    this.statConnected.textContent = connected ? connected.message : '-';
    this.statTotal.textContent = total ? total.message : '-';
  }

  formatBytes(bytes) {
    // Fallback für fehlende oder ungültige Daten
    if (!bytes || bytes === '-' || bytes === '') {
      return { formatted: '-', raw: '-' };
    }

    // String zu Number konvertieren und validieren
    const num = parseFloat(bytes);
    if (isNaN(num) || num < 0) {
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

  updateMonitorDisplay() {
    // Statistik-Karten zuerst aktualisieren
    this.updateStatCards();
    this.updateLoadCards();

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

    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
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
