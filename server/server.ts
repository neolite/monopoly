import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import {
  GameState,
  Player,
  Room,
  PlayerToken
} from '../src/types/game';

// Type definitions for request parameters
interface RoomIdParam {
  roomId: string;
}

interface CreateRoomBody {
  playerName: string;
  clientId: string;
}

interface JoinRoomBody extends CreateRoomBody {}

interface ClientIdBody {
  clientId: string;
}

interface BuyPropertyBody extends ClientIdBody {
  propertyId: number;
}

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Redis key prefixes
const ROOM_PREFIX = 'room:';
const PLAYER_PREFIX = 'player:';
const GAME_STATE_PREFIX = 'gamestate:';

// Helper function to generate Redis keys
const getRoomKey = (roomId: string) => `${ROOM_PREFIX}${roomId}`;
const getPlayerKey = (playerId: string) => `${PLAYER_PREFIX}${playerId}`;
const getGameStateKey = (gameId: string) => `${GAME_STATE_PREFIX}${gameId}`;

// Room operations
const saveRoom = async (room: Room): Promise<void> => {
  await redisClient.set(getRoomKey(room.id), JSON.stringify(room));

  // Add to rooms list
  await redisClient.sadd('rooms', room.id);
};

const getRoom = async (roomId: string): Promise<Room | null> => {
  const roomData = await redisClient.get(getRoomKey(roomId));
  return roomData ? JSON.parse(roomData) : null;
};

const deleteRoom = async (roomId: string): Promise<void> => {
  await redisClient.del(getRoomKey(roomId));
  await redisClient.srem('rooms', roomId);
};

const getAllRooms = async (): Promise<Room[]> => {
  const roomIds = await redisClient.smembers('rooms');
  if (roomIds.length === 0) return [];

  const roomKeys = roomIds.map(id => getRoomKey(id));
  const roomsData = await redisClient.mget(...roomKeys);

  return roomsData
    .filter((data): data is string => data !== null)
    .map(data => JSON.parse(data));
};

// Player operations
const savePlayer = async (player: Player): Promise<void> => {
  await redisClient.set(getPlayerKey(player.id), JSON.stringify(player));
};

const getPlayer = async (playerId: string): Promise<Player | null> => {
  const playerData = await redisClient.get(getPlayerKey(playerId));
  return playerData ? JSON.parse(playerData) : null;
};

const deletePlayer = async (playerId: string): Promise<void> => {
  await redisClient.del(getPlayerKey(playerId));
};

// Game state operations
const saveGameState = async (gameState: GameState): Promise<void> => {
  await redisClient.set(getGameStateKey(gameState.id), JSON.stringify(gameState));
};

const getGameState = async (gameId: string): Promise<GameState | null> => {
  const gameStateData = await redisClient.get(getGameStateKey(gameId));
  return gameStateData ? JSON.parse(gameStateData) : null;
};

// Connected SSE clients
const clients = new Map<string, express.Response>();

// Available player tokens
const availableTokens: PlayerToken[] = [
  'car', 'boot', 'hat', 'ship', 'dog', 'cat', 'iron', 'thimble'
];

// SSE endpoint
app.get('/events', (req: Request, res: Response) => {
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

  for (const [, client] of clients.entries()) {
    if (!roomId || (payload.room && payload.room.id === roomId)) {
      client.write(`data: ${message}\n\n`);
    }
  }
};

// API endpoints
app.get('/api/rooms/:roomId', async (req: Request<RoomIdParam>, res: Response) => {
  const { roomId } = req.params;

  const room = await getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({ room });
});

app.post('/api/rooms', async (req: Request<{}, {}, CreateRoomBody>, res: Response) => {
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

app.post('/api/rooms/:roomId/join', async (req: Request<RoomIdParam, {}, JoinRoomBody>, res: Response) => {
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
  const usedTokens = room.players.map((p: Player) => p.token);
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

app.post('/api/rooms/:roomId/ai', async (req: Request<RoomIdParam, {}, ClientIdBody>, res: Response) => {
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
  const usedTokens = room.players.map((p: Player) => p.token);
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

app.post('/api/rooms/:roomId/start', async (req: Request<RoomIdParam, {}, ClientIdBody>, res: Response) => {
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

  // Import properties from the board module
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { properties } = require('../src/lib/game/board');

  // Create a deep copy of the properties to avoid reference issues
  const initialProperties = JSON.parse(JSON.stringify(properties));
  console.log(`Initialized ${initialProperties.length} properties for the game`);

  // Initialize game state
  const gameState: GameState = {
    id: uuidv4(),
    players: room.players,
    properties: initialProperties,
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
app.post('/api/rooms/:roomId/roll-dice', async (req: Request<RoomIdParam, {}, ClientIdBody>, res: Response) => {
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
  room.gameState.gamePhase = 'rolled';

  // Move player
  const oldPosition = currentPlayer.position;
  const newPosition = (oldPosition + dice[0] + dice[1]) % 40;
  currentPlayer.position = newPosition;

  // Check if player landed on a property
  let propertyMessage = '';
  const property = room.gameState.properties.find(p => p.position === newPosition);

  if (property) {
    propertyMessage = ` and landed on ${property.name}`;

    // Check if property is owned by another player
    if (property.owner && property.owner !== currentPlayer.id) {
      // Find owner
      const owner = room.gameState.players.find(p => p.id === property.owner);

      if (owner) {
        // Calculate rent (simplified for now)
        const rentAmount = property.rent[0]; // Basic rent

        // Pay rent
        currentPlayer.money -= rentAmount;
        owner.money += rentAmount;

        // Update action log
        room.gameState.actionLog.push(`${currentPlayer.name} paid $${rentAmount} rent to ${owner.name} for ${property.name}`);

        // Set game phase to end-turn
        room.gameState.gamePhase = 'end-turn';
      }
    } else if (!property.owner) {
      // Property is not owned, set game phase to property-decision
      room.gameState.gamePhase = 'property-decision';
    } else {
      // Property is owned by current player, set game phase to end-turn
      room.gameState.gamePhase = 'end-turn';
    }
  } else {
    // Not a property, set game phase to end-turn
    room.gameState.gamePhase = 'end-turn';
  }

  // Update action log
  room.gameState.actionLog.push(`${currentPlayer.name} rolled ${dice[0]}+${dice[1]} and moved to position ${newPosition}${propertyMessage}`);

  // Save to Redis
  await saveRoom(room);
  await saveGameState(room.gameState);

  // Send SSE events
  sendEvent('diceRolled', { playerId: currentPlayer.id, dice }, roomId);
  sendEvent('playerMoved', { playerId: currentPlayer.id, position: newPosition }, roomId);
  sendEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

  res.json({ success: true, dice, newPosition });
});

app.post('/api/rooms/:roomId/end-turn', async (req: Request<RoomIdParam, {}, ClientIdBody>, res: Response) => {
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

// Buy property endpoint
app.post('/api/rooms/:roomId/buy-property', async (req: Request<RoomIdParam, {}, { clientId: string, propertyId: number }>, res: Response) => {
  const { roomId } = req.params;
  const { clientId, propertyId } = req.body;

  const room = await getRoom(roomId);

  if (!room || !room.gameStarted || !room.gameState) {
    return res.status(400).json({ error: 'Game not started' });
  }

  // Check if it's the player's turn
  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  if (currentPlayer.id !== clientId) {
    return res.status(403).json({ error: 'Not your turn' });
  }

  // Find the property
  const property = room.gameState.properties.find(p => p.id === propertyId);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  // Check if property is available
  if (property.owner !== null) {
    return res.status(400).json({ error: 'Property already owned' });
  }

  // Check if player has enough money
  if (currentPlayer.money < property.price) {
    return res.status(400).json({ error: 'Not enough money' });
  }

  // Buy property
  currentPlayer.money -= property.price;
  property.owner = currentPlayer.id;

  // Add property to player's properties array
  if (!currentPlayer.properties) {
    currentPlayer.properties = [];
  }
  currentPlayer.properties.push(property);

  // Update action log
  room.gameState.actionLog.push(`${currentPlayer.name} bought ${property.name} for $${property.price}`);
  room.gameState.gamePhase = 'end-turn';

  // Save to Redis
  await saveRoom(room);
  await saveGameState(room.gameState);

  // Send SSE events
  sendEvent('propertyPurchased', {
    playerId: currentPlayer.id,
    propertyId: property.id,
    propertyName: property.name,
    price: property.price
  }, roomId);

  sendEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

  res.json({ success: true, property });
});

// Client disconnect handler
app.delete('/api/clients/:clientId', async (req: Request<{ clientId: string }>, res: Response) => {
  const { clientId } = req.params;

  // Find rooms where the client is a player
  const rooms = await getAllRooms();
  for (const room of rooms) {
    const playerIndex = room.players.findIndex((p: Player) => p.id === clientId);

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
  console.log(`Server running on port ${PORT}`);
});
