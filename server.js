require('dotenv').config();

const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');
const MqttClient = require('./src/mqtt-client');

const app = express();
const PORT = process.env.PORT || 3000;
const MQTT_BROKER_HOST = process.env.MQTT_BROKER || 'localhost';
const MQTT_BROKER_PORT = process.env.MQTT_BROKER_PORT || '1883';
const MQTT_BROKER = `mqtt://${MQTT_BROKER_HOST}:${MQTT_BROKER_PORT}`;

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
let mqttReady = false;

// Connect to MQTT broker
mqttClient.connect()
  .then(() => {
    console.log('Connected to MQTT broker');
    mqttReady = true;
  })
  .catch((err) => {
    console.error('Failed to connect to MQTT broker:', err);
    console.error('Server will run but MQTT operations will fail');
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
    if (client.readyState === WebSocket.OPEN) {
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
        if (!mqttReady) {
          throw new Error('MQTT client not ready');
        }
        await mqttClient.subscribe(message.topic);
        subscribedTopics.add(message.topic);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'subscribed',
              topic: message.topic
            }));
          }
        });
      } else if (message.type === 'publish') {
        if (!mqttReady) {
          throw new Error('MQTT client not ready');
        }
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
