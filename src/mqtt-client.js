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
      if (this.client) {
        this.client.removeAllListeners();
      }

      this.client = mqtt.connect(this.brokerUrl);
      let connectionResolved = false;

      this.client.once('connect', () => {
        connectionResolved = true;
        this.connected = true;
        resolve();
      });

      // Handle errors during connection phase
      this.client.once('error', (err) => {
        if (!connectionResolved) {
          connectionResolved = true;
          reject(err);
        }
      });

      // Persistent error handler for runtime errors (after connection)
      this.client.on('error', (err) => {
        if (connectionResolved) {
          console.error('MQTT runtime error:', err);
        }
      });

      this.client.on('close', () => {
        this.connected = false;
      });

      this.client.on('offline', () => {
        this.connected = false;
      });

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
