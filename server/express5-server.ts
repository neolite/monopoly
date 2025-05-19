import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Player,
  Room,
  PlayerToken
} from '../src/types/game';
import {
  saveRoom,
  getRoom,
  deleteRoom,
  getAllRooms,
  savePlayer,
  deletePlayer,
  saveGameState
} from '../src/lib/redis';

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Connected SSE clients
const clients = new Map<string, express.Response>();

// Available player tokens
const availableTokens: PlayerToken[] = [
  'car', 'boot', 'hat', 'ship', 'dog', 'cat', 'iron', 'thimble'
];

// SSE endpoint
app.get('/events', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Generate client ID
  const clientId = req.query.clientId as string || uuidv4();

  // Store client connection
  clients.set(clientId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', payload: { clientId } })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });
});

// Helper function to send SSE event to all clients or specific room
const sendEvent = (type: string, payload: any, roomId?: string) => {
  const message = JSON.stringify({ type, payload });
  let sentCount = 0;

  for (const [, client] of clients.entries()) {
    if (!roomId || (payload.room && payload.room.id === roomId)) {
      client.write(`data: ${message}\n\n`);
      sentCount++;
    }
  }

  console.log(`Event ${type} sent to ${sentCount} clients`);
};

// API endpoints
app.get('/api/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;

  const room = await getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({ room });
});

app.post('/api/rooms', async (req, res) => {
  const { playerName, clientId } = req.body;

  if (!playerName || !clientId) {
    return res.status(400).json({ error: 'Player name and client ID are required' });
  }

  const roomId = uuidv4();
  const playerId = clientId;
  const name = playerName || `Player ${playerId.substring(0, 5)}`;

  // Create player
  const player: Player = {
    id: playerId,
    name,
    token: availableTokens[0],
    position: 0,
    money: 1500,
    properties: [],
    inJail: false,
    bankrupt: false,
    isAI: false
  };

  // Create room
  const room: Room = {
    id: roomId,
    name: `${name}'s Room`,
    host: playerId,
    players: [player],
    gameStarted: false,
    gameState: null
  };

  // Save to Redis
  await savePlayer(player);
  await saveRoom(room);

  // Send SSE event
  sendEvent('roomCreated', { room });

  // Send updated rooms list
  const rooms = await getAllRooms();
  sendEvent('roomsList', { rooms });

  res.json({ roomId });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
