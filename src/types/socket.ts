// Socket.IO event types

import { GameState, Player, Property, Room } from './game';

// Client to Server events
export interface ClientToServerEvents {
  // Room events
  createRoom: (name: string, callback: (roomId: string) => void) => void;
  joinRoom: (roomId: string, playerName: string, callback: (success: boolean, message?: string) => void) => void;
  leaveRoom: (roomId: string) => void;
  startGame: (roomId: string) => void;
  
  // Game events
  rollDice: (roomId: string) => void;
  buyProperty: (roomId: string, propertyId: number) => void;
  endTurn: (roomId: string) => void;
  payRent: (roomId: string) => void;
  mortgageProperty: (roomId: string, propertyId: number) => void;
  unmortgageProperty: (roomId: string, propertyId: number) => void;
  buildHouse: (roomId: string, propertyId: number) => void;
  sellHouse: (roomId: string, propertyId: number) => void;
  
  // AI player
  addAIPlayer: (roomId: string) => void;
}

// Server to Client events
export interface ServerToClientEvents {
  // Room events
  roomCreated: (room: Room) => void;
  roomJoined: (room: Room) => void;
  roomLeft: (playerId: string) => void;
  roomsList: (rooms: Room[]) => void;
  
  // Game events
  gameStarted: (gameState: GameState) => void;
  gameStateUpdated: (gameState: GameState) => void;
  diceRolled: (playerId: string, dice: [number, number]) => void;
  playerMoved: (playerId: string, position: number) => void;
  propertyBought: (playerId: string, property: Property) => void;
  rentPaid: (fromPlayerId: string, toPlayerId: string, amount: number) => void;
  turnEnded: (nextPlayerId: string) => void;
  gameEnded: (winnerId: string) => void;
  
  // Error events
  error: (message: string) => void;
}

// Inter-server events
export interface InterServerEvents {
  ping: () => void;
}

// Socket data
export interface SocketData {
  playerId: string;
  playerName: string;
  roomId?: string;
}
