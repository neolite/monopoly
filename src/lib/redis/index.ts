import Redis from 'ioredis';
import { Room, Player, GameState } from '@/types/game';

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
export const saveRoom = async (room: Room): Promise<void> => {
  await redisClient.set(getRoomKey(room.id), JSON.stringify(room));
  
  // Add to rooms list
  await redisClient.sadd('rooms', room.id);
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  const roomData = await redisClient.get(getRoomKey(roomId));
  return roomData ? JSON.parse(roomData) : null;
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  await redisClient.del(getRoomKey(roomId));
  await redisClient.srem('rooms', roomId);
};

export const getAllRooms = async (): Promise<Room[]> => {
  const roomIds = await redisClient.smembers('rooms');
  if (roomIds.length === 0) return [];
  
  const roomKeys = roomIds.map(id => getRoomKey(id));
  const roomsData = await redisClient.mget(...roomKeys);
  
  return roomsData
    .filter((data): data is string => data !== null)
    .map(data => JSON.parse(data));
};

// Player operations
export const savePlayer = async (player: Player): Promise<void> => {
  await redisClient.set(getPlayerKey(player.id), JSON.stringify(player));
};

export const getPlayer = async (playerId: string): Promise<Player | null> => {
  const playerData = await redisClient.get(getPlayerKey(playerId));
  return playerData ? JSON.parse(playerData) : null;
};

export const deletePlayer = async (playerId: string): Promise<void> => {
  await redisClient.del(getPlayerKey(playerId));
};

// Game state operations
export const saveGameState = async (gameState: GameState): Promise<void> => {
  await redisClient.set(getGameStateKey(gameState.id), JSON.stringify(gameState));
};

export const getGameState = async (gameId: string): Promise<GameState | null> => {
  const gameStateData = await redisClient.get(getGameStateKey(gameId));
  return gameStateData ? JSON.parse(gameStateData) : null;
};

export const deleteGameState = async (gameId: string): Promise<void> => {
  await redisClient.del(getGameStateKey(gameId));
};

// Export Redis client for direct access if needed
export const getRedisClient = () => redisClient;
