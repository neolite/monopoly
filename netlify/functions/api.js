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

// Helper function to generate Redis keys
const getRoomKey = (roomId) => `${ROOM_PREFIX}${roomId}`;
const getPlayerKey = (playerId) => `${PLAYER_PREFIX}${playerId}`;
const getGameStateKey = (gameId) => `${GAME_STATE_PREFIX}${gameId}`;

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

  res.json({ roomId, room });
});

// Export the serverless function
module.exports.handler = serverless(app);
