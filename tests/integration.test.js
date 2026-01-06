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
