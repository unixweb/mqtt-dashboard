const WebSocket = require('ws');

describe('Server WebSocket Handler', () => {
  let ws;
  let server;
  const TEST_PORT = 3001;

  beforeAll((done) => {
    // Set test environment variables
    process.env.PORT = TEST_PORT;
    process.env.MQTT_BROKER = 'localhost';
    process.env.MQTT_BROKER_PORT = '1883';

    // Start the server
    jest.isolateModules(() => {
      server = require('../server');
    });

    // Give the server time to start
    setTimeout(done, 1000);
  });

  beforeEach((done) => {
    ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
    ws.on('open', () => done());
  });

  afterEach(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  afterAll((done) => {
    if (server) {
      server.close(() => {
        done();
      });
    } else {
      done();
    }
  });

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
});
