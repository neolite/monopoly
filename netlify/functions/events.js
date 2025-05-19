const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Implement Server-Sent Events (SSE)
exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  // Parse query parameters
  const params = new URLSearchParams(event.queryStringParameters || {});
  const clientId = params.get('clientId') || uuidv4();
  const lastEventId = params.get('lastEventId') || '0';

  try {
    // Get events from Redis
    const events = await getEventsFromRedis(clientId, lastEventId);

    // Format events as SSE
    let sseData = '';

    // Add initial connection event if this is a new connection
    if (lastEventId === '0') {
      const connectedEvent = {
        type: 'connected',
        payload: { clientId }
      };
      sseData += `data: ${JSON.stringify(connectedEvent)}\n\n`;
    }

    // Add all events from Redis
    for (const event of events) {
      sseData += `id: ${event.id}\n`;
      sseData += `data: ${JSON.stringify({ type: event.type, payload: event.payload })}\n\n`;
    }

    // If no events, add a ping event
    if (events.length === 0 && lastEventId !== '0') {
      const pingEvent = {
        type: 'ping',
        payload: { clientId }
      };
      const pingId = Date.now();
      sseData += `id: ${pingId}\n`;
      sseData += `data: ${JSON.stringify(pingEvent)}\n\n`;
    }

    // Return events as SSE response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Last-Event-ID, Cache-Control',
        'X-Accel-Buffering': 'no' // Disable Nginx buffering
      },
      body: sseData
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};

// Get events from Redis
async function getEventsFromRedis(clientId, lastEventId) {
  // Convert lastEventId to number
  const lastId = parseInt(lastEventId, 10);

  // Get global events
  const globalEvents = await redisClient.zrangebyscore(
    'monopoly:events:sorted',
    lastId + 1,
    '+inf',
    'WITHSCORES'
  );

  // Get client-specific events
  const clientEvents = await redisClient.zrangebyscore(
    `monopoly:events:client:${clientId}:sorted`,
    lastId + 1,
    '+inf',
    'WITHSCORES'
  );

  // Process events
  const events = [];

  // Process global events
  for (let i = 0; i < globalEvents.length; i += 2) {
    try {
      const eventData = JSON.parse(globalEvents[i]);
      const eventId = parseInt(globalEvents[i + 1], 10);
      events.push({
        id: eventId,
        type: eventData.type,
        payload: eventData.payload
      });
    } catch (error) {
      console.error('Error parsing global event:', error);
    }
  }

  // Process client events
  for (let i = 0; i < clientEvents.length; i += 2) {
    try {
      const eventData = JSON.parse(clientEvents[i]);
      const eventId = parseInt(clientEvents[i + 1], 10);
      events.push({
        id: eventId,
        type: eventData.type,
        payload: eventData.payload
      });
    } catch (error) {
      console.error('Error parsing client event:', error);
    }
  }

  // Sort events by ID
  events.sort((a, b) => a.id - b.id);

  // If no events, add a ping event
  if (events.length === 0) {
    events.push({
      id: Date.now(),
      type: 'ping',
      payload: { clientId }
    });
  }

  return events;
}
