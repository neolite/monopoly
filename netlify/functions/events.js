const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Connected SSE clients (in-memory, will be lost on function restart)
const clients = new Map();

// Helper function to send SSE event
const sendEvent = (res, type, payload) => {
  res.write(`data: ${JSON.stringify({ type, payload })}\n\n`);
};

// Subscribe to Redis channel for events
const subscribeToEvents = async (res, clientId) => {
  const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  
  // Subscribe to all events and room-specific events
  await subscriber.subscribe('monopoly:events');
  await subscriber.subscribe(`monopoly:events:client:${clientId}`);
  
  subscriber.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      sendEvent(res, data.type, data.payload);
    } catch (error) {
      console.error('Error parsing Redis message:', error);
    }
  });
  
  return subscriber;
};

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }
  
  // Parse query parameters
  const params = new URLSearchParams(event.queryStringParameters || {});
  const clientId = params.get('clientId') || uuidv4();
  
  // Set up SSE response
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
  
  // Create response object
  const response = {
    statusCode: 200,
    headers,
    body: '',
    isBase64Encoded: false,
  };
  
  // Set up Redis subscriber
  const subscriber = await subscribeToEvents(response, clientId);
  
  // Send initial connection message
  sendEvent(response, 'connected', { clientId });
  
  // Clean up on disconnect
  context.callbackWaitsForEmptyEventLoop = false;
  
  return response;
};
