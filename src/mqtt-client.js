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
