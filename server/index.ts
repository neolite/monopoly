import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Player,
  Property,
  Room,
  PlayerToken
} from '../src/types/game';
import {
  saveRoom,
  getRoom,
  deleteRoom,
  getAllRooms,
  savePlayer,
  getPlayer,
  deletePlayer,
  saveGameState,
  getGameState
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

  for (const [clientId, client] of clients.entries()) {
    if (!roomId || (payload.room && payload.room.id === roomId)) {
      client.write(`data: ${message}\n\n`);
    }
  }
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

app.post('/api/rooms/:roomId/join', async (req, res) => {
  const { roomId } = req.params;
  const { playerName, clientId } = req.body;

  if (!playerName || !clientId) {
    return res.status(400).json({ error: 'Player name and client ID are required' });
  }

  const room = await getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.gameStarted) {
    return res.status(400).json({ error: 'Game already started' });
  }

  if (room.players.length >= 8) {
    return res.status(400).json({ error: 'Room is full' });
  }

  const playerId = clientId;
  const name = playerName || `Player ${playerId.substring(0, 5)}`;

  // Get available token
  const usedTokens = room.players.map(p => p.token);
  const availableToken = availableTokens.find(t => !usedTokens.includes(t)) || 'car';

  // Create player
  const player: Player = {
    id: playerId,
    name,
    token: availableToken,
    position: 0,
    money: 1500,
    properties: [],
    inJail: false,
    bankrupt: false,
    isAI: false
  };

  // Add player to room
  room.players.push(player);

  // Save to Redis
  await savePlayer(player);
  await saveRoom(room);

  // Send SSE event
  sendEvent('roomJoined', { room }, roomId);

  // Send updated rooms list
  const rooms = await getAllRooms();
  sendEvent('roomsList', { rooms });

  res.json({ success: true, room });
});

app.post('/api/rooms/:roomId/ai', async (req, res) => {
  const { roomId } = req.params;
  const { clientId } = req.body;

  const room = await getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.gameStarted || room.players.length >= 8) {
    return res.status(400).json({ error: 'Cannot add AI player' });
  }

  // Only host can add AI players
  if (room.host !== clientId) {
    return res.status(403).json({ error: 'Only host can add AI players' });
  }

  const aiId = `ai-${uuidv4()}`;
  const aiName = `AI Player ${room.players.length + 1}`;

  // Get available token
  const usedTokens = room.players.map(p => p.token);
  const availableToken = availableTokens.find(t => !usedTokens.includes(t)) || 'car';

  // Create AI player
  const aiPlayer: Player = {
    id: aiId,
    name: aiName,
    token: availableToken,
    position: 0,
    money: 1500,
    properties: [],
    inJail: false,
    bankrupt: false,
    isAI: true
  };

  // Add AI player to room
  room.players.push(aiPlayer);

  // Save to Redis
  await savePlayer(aiPlayer);
  await saveRoom(room);

  // Send SSE event
  sendEvent('roomJoined', { room }, roomId);

  res.json({ success: true, room });
});

// Start game endpoint
app.post('/api/rooms/:roomId/start', async (req, res) => {
  const { roomId } = req.params;
  const { clientId } = req.body;

  const room = await getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.gameStarted) {
    return res.status(400).json({ error: 'Game already started' });
  }

  // Only host can start the game
  if (room.host !== clientId) {
    return res.status(403).json({ error: 'Only host can start the game' });
  }

  // Need at least 2 players to start
  if (room.players.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 players to start the game' });
  }

  // Initialize game state
  const gameState: GameState = {
    id: uuidv4(),
    players: room.players,
    properties: [], // Will be initialized with actual properties
    currentPlayerIndex: 0,
    dice: [0, 0],
    gamePhase: 'waiting',
    winner: null,
    actionLog: ['Game started']
  };

  // Update room
  room.gameStarted = true;
  room.gameState = gameState;

  // Save to Redis
  await saveRoom(room);
  await saveGameState(gameState);

  // Send SSE event
  sendEvent('gameStarted', { gameState }, roomId);

  // Send updated rooms list
  const rooms = await getAllRooms();
  sendEvent('roomsList', { rooms });

  res.json({ success: true, gameState });
});

// Game action endpoints
app.post('/api/rooms/:roomId/roll-dice', async (req, res) => {
  const { roomId } = req.params;
  const { clientId } = req.body;

  const room = await getRoom(roomId);

  if (!room || !room.gameStarted || !room.gameState) {
    return res.status(400).json({ error: 'Game not started' });
  }

  // Check if it's the player's turn
  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  if (currentPlayer.id !== clientId) {
    return res.status(403).json({ error: 'Not your turn' });
  }

  // Roll dice
  const dice: [number, number] = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];

  // Update game state
  room.gameState.dice = dice;

  // Move player
  const oldPosition = currentPlayer.position;
  const newPosition = (oldPosition + dice[0] + dice[1]) % 40;
  currentPlayer.position = newPosition;

  // Update action log
  room.gameState.actionLog.push(`${currentPlayer.name} rolled ${dice[0]}+${dice[1]} and moved to position ${newPosition}`);

  // Save to Redis
  await saveRoom(room);
  await saveGameState(room.gameState);

  // Send SSE events
  sendEvent('diceRolled', { playerId: currentPlayer.id, dice }, roomId);
  sendEvent('playerMoved', { playerId: currentPlayer.id, position: newPosition }, roomId);
  sendEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

  res.json({ success: true, dice, newPosition });
});

app.post('/api/rooms/:roomId/end-turn', async (req, res) => {
  const { roomId } = req.params;
  const { clientId } = req.body;

  const room = await getRoom(roomId);

  if (!room || !room.gameStarted || !room.gameState) {
    return res.status(400).json({ error: 'Game not started' });
  }

  // Check if it's the player's turn
  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  if (currentPlayer.id !== clientId) {
    return res.status(403).json({ error: 'Not your turn' });
  }

  // Move to next player
  room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.gameState.players.length;
  const nextPlayer = room.gameState.players[room.gameState.currentPlayerIndex];

  // Update action log
  room.gameState.actionLog.push(`${currentPlayer.name} ended their turn. ${nextPlayer.name}'s turn now.`);

  // Save to Redis
  await saveRoom(room);
  await saveGameState(room.gameState);

  // Send SSE events
  sendEvent('turnEnded', { nextPlayerId: nextPlayer.id }, roomId);
  sendEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

  res.json({ success: true, nextPlayerId: nextPlayer.id });
});

// Client disconnect handler
app.delete('/api/clients/:clientId', async (req, res) => {
  const { clientId } = req.params;

  // Find rooms where the client is a player
  const rooms = await getAllRooms();
  for (const room of rooms) {
    const playerIndex = room.players.findIndex(p => p.id === clientId);

    if (playerIndex !== -1) {
      // Remove player from room
      room.players.splice(playerIndex, 1);

      if (room.players.length === 0) {
        // Delete empty room
        await deleteRoom(room.id);
      } else if (room.host === clientId) {
        // Assign new host
        room.host = room.players[0].id;
        await saveRoom(room);
      } else {
        await saveRoom(room);
      }

      // Send SSE events
      sendEvent('roomLeft', { playerId: clientId }, room.id);

      // Delete player
      await deletePlayer(clientId);
    }
  }

  // Send updated rooms list
  const updatedRooms = await getAllRooms();
  sendEvent('roomsList', { rooms: updatedRooms });

  res.json({ success: true });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
