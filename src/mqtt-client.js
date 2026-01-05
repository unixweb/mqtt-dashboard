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
      // Remove existing listeners if reconnecting
      if (this.client) {
        this.client.removeAllListeners();
      }

      this.client = mqtt.connect(this.brokerUrl);

      // One-time listeners for connection result
      this.client.once('connect', () => {
        this.connected = true;
        resolve();
      });

      this.client.once('error', (err) => {
        reject(err);
      });

      // Persistent error handler for runtime errors
      this.client.on('error', (err) => {
        console.error('MQTT client error:', err);
      });

      // Persistent disconnect handlers
      this.client.on('close', () => {
        this.connected = false;
      });

      this.client.on('offline', () => {
        this.connected = false;
      });

      // Persistent message handler with error protection
      this.client.on('message', (topic, message) => {
        this.messageHandlers.forEach(handler => {
          try {
            handler(topic, message.toString());
          } catch (err) {
            console.error('Error in message handler:', err);
          }
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
