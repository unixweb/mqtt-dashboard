const MqttClient = require('../src/mqtt-client');

describe('MqttClient', () => {
  test('should create client with broker URL', () => {
    const client = new MqttClient('mqtt://localhost:1883');
    expect(client.brokerUrl).toBe('mqtt://localhost:1883');
    expect(client.connected).toBe(false);
  });
});
