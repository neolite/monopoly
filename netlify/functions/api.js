const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Redis key prefixes
const ROOM_PREFIX = 'room:';
const PLAYER_PREFIX = 'player:';
const GAME_STATE_PREFIX = 'gamestate:';
const EVENT_PREFIX = 'monopoly:events';

// Helper function to generate Redis keys
const getRoomKey = (roomId) => `${ROOM_PREFIX}${roomId}`;
const getPlayerKey = (playerId) => `${PLAYER_PREFIX}${playerId}`;
const getGameStateKey = (gameId) => `${GAME_STATE_PREFIX}${gameId}`;

// Helper function to publish event to Redis
const publishEvent = async (type, payload, roomId) => {
  const event = { type, payload };
  const eventId = Date.now();

  // Store in sorted set for global events
  await redisClient.zadd(
    `${EVENT_PREFIX}:sorted`,
    eventId,
    JSON.stringify(event)
  );

  // If roomId is provided, store in room-specific events
  if (roomId) {
    // Store in sorted set for room-specific events
    await redisClient.zadd(
      `${EVENT_PREFIX}:room:${roomId}:sorted`,
      eventId,
      JSON.stringify(event)
    );

    // Get all players in the room
    const room = await getRoom(roomId);
    if (room && room.players) {
      // Store in sorted set for each player in the room
      for (const player of room.players) {
        await redisClient.zadd(
          `${EVENT_PREFIX}:client:${player.id}:sorted`,
          eventId,
          JSON.stringify(event)
        );
      }
    }
  }

  // Also publish to Redis pub/sub for backward compatibility
  await redisClient.publish(EVENT_PREFIX, JSON.stringify(event));

  return eventId;
};

// Room operations
const saveRoom = async (room) => {
  await redisClient.set(getRoomKey(room.id), JSON.stringify(room));
  await redisClient.sadd('rooms', room.id);
};

const getRoom = async (roomId) => {
  const roomData = await redisClient.get(getRoomKey(roomId));
  return roomData ? JSON.parse(roomData) : null;
};

const deleteRoom = async (roomId) => {
  await redisClient.del(getRoomKey(roomId));
  await redisClient.srem('rooms', roomId);
};

const getAllRooms = async () => {
  const roomIds = await redisClient.smembers('rooms');
  if (roomIds.length === 0) return [];

  const roomKeys = roomIds.map(id => getRoomKey(id));
  const roomsData = await redisClient.mget(...roomKeys);

  return roomsData
    .filter((data) => data !== null)
    .map(data => JSON.parse(data));
};

// Player operations
const savePlayer = async (player) => {
  await redisClient.set(getPlayerKey(player.id), JSON.stringify(player));
};

const getPlayer = async (playerId) => {
  const playerData = await redisClient.get(getPlayerKey(playerId));
  return playerData ? JSON.parse(playerData) : null;
};

const deletePlayer = async (playerId) => {
  await redisClient.del(getPlayerKey(playerId));
};

// Game state operations
const saveGameState = async (gameState) => {
  await redisClient.set(getGameStateKey(gameState.id), JSON.stringify(gameState));
};

const getGameState = async (gameId) => {
  const gameStateData = await redisClient.get(getGameStateKey(gameId));
  return gameStateData ? JSON.parse(gameStateData) : null;
};

// Available player tokens
const availableTokens = [
  'car', 'boot', 'hat', 'ship', 'dog', 'cat', 'iron', 'thimble'
];

// Initialize Monopoly board properties
const initializeProperties = () => {
  return [
    { id: 1, position: 1, name: 'Mediterranean Avenue', price: 60, rent: 2, group: 'brown', ownerId: null },
    { id: 3, position: 3, name: 'Baltic Avenue', price: 60, rent: 4, group: 'brown', ownerId: null },
    { id: 5, position: 5, name: 'Reading Railroad', price: 200, rent: 25, group: 'railroad', ownerId: null },
    { id: 6, position: 6, name: 'Oriental Avenue', price: 100, rent: 6, group: 'light-blue', ownerId: null },
    { id: 8, position: 8, name: 'Vermont Avenue', price: 100, rent: 6, group: 'light-blue', ownerId: null },
    { id: 9, position: 9, name: 'Connecticut Avenue', price: 120, rent: 8, group: 'light-blue', ownerId: null },
    { id: 11, position: 11, name: 'St. Charles Place', price: 140, rent: 10, group: 'pink', ownerId: null },
    { id: 12, position: 12, name: 'Electric Company', price: 150, rent: 0, group: 'utility', ownerId: null },
    { id: 13, position: 13, name: 'States Avenue', price: 140, rent: 10, group: 'pink', ownerId: null },
    { id: 14, position: 14, name: 'Virginia Avenue', price: 160, rent: 12, group: 'pink', ownerId: null },
    { id: 15, position: 15, name: 'Pennsylvania Railroad', price: 200, rent: 25, group: 'railroad', ownerId: null },
    { id: 16, position: 16, name: 'St. James Place', price: 180, rent: 14, group: 'orange', ownerId: null },
    { id: 18, position: 18, name: 'Tennessee Avenue', price: 180, rent: 14, group: 'orange', ownerId: null },
    { id: 19, position: 19, name: 'New York Avenue', price: 200, rent: 16, group: 'orange', ownerId: null },
    { id: 21, position: 21, name: 'Kentucky Avenue', price: 220, rent: 18, group: 'red', ownerId: null },
    { id: 23, position: 23, name: 'Indiana Avenue', price: 220, rent: 18, group: 'red', ownerId: null },
    { id: 24, position: 24, name: 'Illinois Avenue', price: 240, rent: 20, group: 'red', ownerId: null },
    { id: 25, position: 25, name: 'B&O Railroad', price: 200, rent: 25, group: 'railroad', ownerId: null },
    { id: 26, position: 26, name: 'Atlantic Avenue', price: 260, rent: 22, group: 'yellow', ownerId: null },
    { id: 27, position: 27, name: 'Ventnor Avenue', price: 260, rent: 22, group: 'yellow', ownerId: null },
    { id: 28, position: 28, name: 'Water Works', price: 150, rent: 0, group: 'utility', ownerId: null },
    { id: 29, position: 29, name: 'Marvin Gardens', price: 280, rent: 24, group: 'yellow', ownerId: null },
    { id: 31, position: 31, name: 'Pacific Avenue', price: 300, rent: 26, group: 'green', ownerId: null },
    { id: 32, position: 32, name: 'North Carolina Avenue', price: 300, rent: 26, group: 'green', ownerId: null },
    { id: 34, position: 34, name: 'Pennsylvania Avenue', price: 320, rent: 28, group: 'green', ownerId: null },
    { id: 35, position: 35, name: 'Short Line Railroad', price: 200, rent: 25, group: 'railroad', ownerId: null },
    { id: 37, position: 37, name: 'Park Place', price: 350, rent: 35, group: 'blue', ownerId: null },
    { id: 39, position: 39, name: 'Boardwalk', price: 400, rent: 50, group: 'blue', ownerId: null }
  ];
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
  const player = {
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
  const room = {
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

  // Publish event to Redis
  await publishEvent('roomCreated', { room });

  res.json({ roomId, room });
});

// Add AI player to room
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
  const aiPlayer = {
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

  // Publish event to Redis
  await publishEvent('roomJoined', { room }, roomId);

  res.json({ success: true, room });
});

// Get all rooms
app.get('/api/rooms', async (req, res) => {
  const rooms = await getAllRooms();
  res.json({ rooms });
});

// Join room
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
  const player = {
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

  // Publish event to Redis
  await publishEvent('roomJoined', { room }, roomId);

  res.json({ success: true, room });
});

// Start game
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
  const gameState = {
    id: uuidv4(),
    players: room.players,
    properties: initializeProperties(), // Initialize with actual properties
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

  // Publish event to Redis
  await publishEvent('gameStarted', { gameState, room: { id: roomId } }, roomId);
  await publishEvent('roomUpdated', { room }, roomId);

  res.json({ success: true, gameState });
});

// Roll dice
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
  const dice = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];

  // Update game state
  room.gameState.dice = dice;

  // Move player
  const oldPosition = currentPlayer.position;
  const newPosition = (oldPosition + dice[0] + dice[1]) % 40;
  currentPlayer.position = newPosition;

  // Check if player passed GO
  if (newPosition < oldPosition) {
    currentPlayer.money += 200;
    room.gameState.actionLog.push(`${currentPlayer.name} passed GO and collected $200`);
  }

  // Update action log
  room.gameState.actionLog.push(`${currentPlayer.name} rolled ${dice[0]}+${dice[1]} and moved to position ${newPosition}`);

  // Save to Redis
  await saveRoom(room);
  await saveGameState(room.gameState);

  // Publish events to Redis
  await publishEvent('diceRolled', { playerId: currentPlayer.id, dice }, roomId);
  await publishEvent('playerMoved', { playerId: currentPlayer.id, position: newPosition }, roomId);
  await publishEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

  res.json({ success: true, dice, newPosition });
});

// End turn
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

  // Publish events to Redis
  await publishEvent('turnEnded', { nextPlayerId: nextPlayer.id }, roomId);
  await publishEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

  res.json({ success: true, nextPlayerId: nextPlayer.id });
});

// Buy property
app.post('/api/rooms/:roomId/buy-property', async (req, res) => {
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

  // Find property
  const property = room.gameState.properties.find(p => p.id === propertyId);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  // Check if property is already owned
  if (property.ownerId) {
    return res.status(400).json({ error: 'Property already owned' });
  }

  // Check if player has enough money
  if (currentPlayer.money < property.price) {
    return res.status(400).json({ error: 'Not enough money' });
  }

  // Buy property
  property.ownerId = currentPlayer.id;
  currentPlayer.money -= property.price;
  currentPlayer.properties.push(property);

  // Update action log
  room.gameState.actionLog.push(`${currentPlayer.name} bought ${property.name} for $${property.price}`);
  room.gameState.gamePhase = 'end-turn';

  // Save to Redis
  await saveRoom(room);
  await saveGameState(room.gameState);

  // Publish events to Redis
  await publishEvent('propertyPurchased', {
    playerId: currentPlayer.id,
    propertyId: property.id,
    propertyName: property.name,
    price: property.price
  }, roomId);
  await publishEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

  res.json({ success: true, property });
});

// AI turn
app.post('/api/rooms/:roomId/ai-turn', async (req, res) => {
  const { roomId } = req.params;
  const { clientId } = req.body;

  const room = await getRoom(roomId);

  if (!room || !room.gameStarted || !room.gameState) {
    return res.status(400).json({ error: 'Game not started' });
  }

  // Only host can manually trigger AI turns
  if (room.host !== clientId) {
    return res.status(403).json({ error: 'Only host can trigger AI turns' });
  }

  // Check if current player is AI
  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  if (!currentPlayer.isAI) {
    return res.status(400).json({ error: 'Current player is not AI' });
  }

  // Roll dice for AI
  const dice = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];

  // Update game state
  room.gameState.dice = dice;

  // Move player
  const oldPosition = currentPlayer.position;
  const newPosition = (oldPosition + dice[0] + dice[1]) % 40;
  currentPlayer.position = newPosition;

  // Check if player passed GO
  if (newPosition < oldPosition) {
    currentPlayer.money += 200;
    room.gameState.actionLog.push(`${currentPlayer.name} passed GO and collected $200`);
  }

  // Update action log
  room.gameState.actionLog.push(`${currentPlayer.name} rolled ${dice[0]}+${dice[1]} and moved to position ${newPosition}`);

  // AI logic for buying property
  const property = room.gameState.properties.find(p => p.position === newPosition);
  if (property && !property.ownerId && currentPlayer.money >= property.price) {
    // AI always buys property if it can afford it
    property.ownerId = currentPlayer.id;
    currentPlayer.money -= property.price;
    currentPlayer.properties.push(property);
    room.gameState.actionLog.push(`${currentPlayer.name} bought ${property.name} for $${property.price}`);

    // Publish property purchase event
    await publishEvent('propertyPurchased', {
      playerId: currentPlayer.id,
      propertyId: property.id,
      propertyName: property.name,
      price: property.price
    }, roomId);
  }

  // Move to next player
  room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.gameState.players.length;
  const nextPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  room.gameState.actionLog.push(`${currentPlayer.name} ended their turn. ${nextPlayer.name}'s turn now.`);

  // Save to Redis
  await saveRoom(room);
  await saveGameState(room.gameState);

  // Publish events to Redis
  await publishEvent('diceRolled', { playerId: currentPlayer.id, dice }, roomId);
  await publishEvent('playerMoved', { playerId: currentPlayer.id, position: newPosition }, roomId);
  await publishEvent('turnEnded', { nextPlayerId: nextPlayer.id }, roomId);
  await publishEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

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

      // Publish event to Redis
      await publishEvent('roomLeft', { playerId: clientId }, room.id);

      // Delete player
      await deletePlayer(clientId);
    }
  }

  res.json({ success: true });
});

// Export the serverless function
module.exports.handler = serverless(app);
