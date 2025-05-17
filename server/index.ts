import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
} from '../src/types/socket';
import {
  GameState,
  Player,
  Property,
  Room,
  PlayerToken
} from '../src/types/game';
import { v4 as uuidv4 } from 'uuid';

// Initialize HTTP server
const httpServer = createServer();

// Initialize Socket.IO server
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Game data
const rooms: Map<string, Room> = new Map();
const players: Map<string, Player> = new Map();

// Available player tokens
const availableTokens: PlayerToken[] = [
  'car', 'boot', 'hat', 'ship', 'dog', 'cat', 'iron', 'thimble'
];

// Socket.IO connection handler
io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new room
  socket.on('createRoom', (name: string, callback: (roomId: string) => void) => {
    const roomId = uuidv4();
    const playerId = socket.id;
    const playerName = name || `Player ${playerId.substring(0, 5)}`;

    // Create player
    const player: Player = {
      id: playerId,
      name: playerName,
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
      name: `${playerName}'s Room`,
      host: playerId,
      players: [player],
      gameStarted: false,
      gameState: null
    };

    // Save player and room
    players.set(playerId, player);
    rooms.set(roomId, room);

    // Join socket room
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;
    socket.data.playerName = playerName;

    // Send callback with room ID
    callback(roomId);

    // Broadcast updated rooms list
    io.emit('roomsList', Array.from(rooms.values()));
  });

  // Join an existing room
  socket.on('joinRoom', (roomId: string, playerName: string, callback: (success: boolean, message?: string) => void) => {
    const room = rooms.get(roomId);

    if (!room) {
      callback(false, 'Room not found');
      return;
    }

    if (room.gameStarted) {
      callback(false, 'Game already started');
      return;
    }

    if (room.players.length >= 8) {
      callback(false, 'Room is full');
      return;
    }

    const playerId = socket.id;
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
    players.set(playerId, player);

    // Join socket room
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;
    socket.data.playerName = name;

    // Send callback with success
    callback(true);

    // Broadcast room update
    io.to(roomId).emit('roomJoined', room);

    // Broadcast updated rooms list
    io.emit('roomsList', Array.from(rooms.values()));
  });

  // Add AI player to room
  socket.on('addAIPlayer', (roomId: string) => {
    const room = rooms.get(roomId);

    if (!room || room.gameStarted || room.players.length >= 8) {
      return;
    }

    // Only host can add AI players
    if (socket.data.playerId !== room.host) {
      return;
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
    players.set(aiId, aiPlayer);

    // Broadcast room update
    io.to(roomId).emit('roomJoined', room);
  });

  // Start game
  socket.on('startGame', (roomId: string) => {
    const room = rooms.get(roomId);

    if (!room || room.gameStarted) {
      return;
    }

    // Only host can start the game
    if (socket.data.playerId !== room.host) {
      return;
    }

    // Need at least 2 players to start
    if (room.players.length < 2) {
      io.to(socket.id).emit('error', 'Need at least 2 players to start the game');
      return;
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

    // Broadcast game started
    io.to(roomId).emit('gameStarted', gameState);

    // Broadcast updated rooms list
    io.emit('roomsList', Array.from(rooms.values()));
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    const playerId = socket.data.playerId;
    const roomId = socket.data.roomId;

    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId)!;

      // Remove player from room
      room.players = room.players.filter(p => p.id !== playerId);

      if (room.players.length === 0) {
        // Delete empty room
        rooms.delete(roomId);
      } else if (room.host === playerId) {
        // Assign new host
        room.host = room.players[0].id;
      }

      // Broadcast player left
      io.to(roomId).emit('roomLeft', playerId);

      // Broadcast updated rooms list
      io.emit('roomsList', Array.from(rooms.values()));
    }

    // Remove player
    if (playerId) {
      players.delete(playerId);
    }

    console.log(`Player disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
