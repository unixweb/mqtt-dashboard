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
