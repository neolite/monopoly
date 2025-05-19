const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Implement short polling for events instead of SSE
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

    // Return events as JSON response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        clientId,
        events
      })
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
