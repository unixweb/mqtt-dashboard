const MqttClient = require('../src/mqtt-client');

describe('MqttClient', () => {
  let client;

  beforeEach(() => {
    client = new MqttClient('mqtt://localhost:1883');
  });

  afterEach(() => {
    if (client.client) {
      client.disconnect();
    }
  });

  test('should create client with broker URL', () => {
    const client = new MqttClient('mqtt://localhost:1883');
    expect(client.brokerUrl).toBe('mqtt://localhost:1883');
    expect(client.connected).toBe(false);
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from a topic successfully', async () => {
      const topic = 'test/unsubscribe';

      await client.connect();
      await client.subscribe(topic);

      // Spy on the unsubscribe method before calling it
      const unsubscribeSpy = jest.spyOn(client.client, 'unsubscribe');

      await client.unsubscribe(topic);

      expect(unsubscribeSpy).toHaveBeenCalledWith(topic, expect.any(Function));
    });

    it('should throw error when not connected', () => {
      expect(() => client.unsubscribe('test/topic'))
        .toThrow('Client not connected');
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
});
