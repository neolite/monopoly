const express = require('express');
const { createServer } = require('http');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// In-memory storage (temporary until Redis is available)
console.log('Using in-memory storage instead of Redis');
const rooms = new Map();
const players = new Map();
const gameStates = new Map();

// Room operations
const saveRoom = async (room) => {
  console.log('Saving room to memory:', room.id);
  rooms.set(room.id, room);
};

const getRoom = async (roomId) => {
  console.log('Getting room from memory:', roomId);
  return rooms.get(roomId) || null;
};

const deleteRoom = async (roomId) => {
  console.log('Deleting room from memory:', roomId);
  rooms.delete(roomId);
};

const getAllRooms = async () => {
  console.log('Getting all rooms from memory');
  return Array.from(rooms.values());
};

// Player operations
const savePlayer = async (player) => {
  console.log('Saving player to memory:', player.id);
  players.set(player.id, player);
};

const getPlayer = async (playerId) => {
  console.log('Getting player from memory:', playerId);
  return players.get(playerId) || null;
};

const deletePlayer = async (playerId) => {
  console.log('Deleting player from memory:', playerId);
  players.delete(playerId);
};

// Game state operations
const saveGameState = async (gameState) => {
  console.log('Saving game state to memory:', gameState.id);
  gameStates.set(gameState.id, gameState);
};

const getGameState = async (gameId) => {
  console.log('Getting game state from memory:', gameId);
  return gameStates.get(gameId) || null;
};

// Connected SSE clients
const clients = new Map();

// Available player tokens
const availableTokens = [
  'car', 'boot', 'hat', 'ship', 'dog', 'cat', 'iron', 'thimble'
];

// SSE endpoint
app.get('/events', (req, res) => {
  console.log('SSE connection request received');

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Generate client ID
  const clientId = req.query.clientId || uuidv4();
  console.log(`Client connected with ID: ${clientId}`);

  // Store client connection
  clients.set(clientId, res);
  console.log(`Total connected clients: ${clients.size}`);

  // Send initial connection message
  try {
    res.write(`data: ${JSON.stringify({ type: 'connected', payload: { clientId } })}\n\n`);
    console.log(`Sent connected event to client: ${clientId}`);
  } catch (error) {
    console.error(`Error sending connected event to client ${clientId}:`, error);
  }

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
    console.log(`Remaining connected clients: ${clients.size}`);
  });
});

// Helper function to calculate rent for a property
const calculateRent = (gameState, property) => {
  if (!property.owner) {
    return 0;
  }

  // Get owner
  const owner = gameState.players.find(p => p.id === property.owner);

  if (!owner) {
    return 0;
  }

  // Check if mortgaged
  if (property.mortgaged) {
    return 0;
  }

  // Handle different property types
  switch (property.group) {
    case 'railroad':
      // Count railroads owned by player
      const railroadsOwned = gameState.properties.filter(
        p => p.group === 'railroad' && p.owner === owner.id
      ).length;
      return property.rent[railroadsOwned - 1];

    case 'utility':
      // Count utilities owned by player
      const utilitiesOwned = gameState.properties.filter(
        p => p.group === 'utility' && p.owner === owner.id
      ).length;

      // Rent is based on dice roll
      const diceSum = gameState.dice[0] + gameState.dice[1];
      return property.rent[utilitiesOwned - 1] * diceSum;

    default:
      // Regular property
      // Check if player owns all properties in the group
      const propertiesInGroup = gameState.properties.filter(
        p => p.group === property.group
      );

      const ownsAllInGroup = propertiesInGroup.every(
        p => p.owner === owner.id
      );

      // If no houses and owns all in group, rent is doubled
      if (property.houses === 0 && ownsAllInGroup) {
        return property.rent[0] * 2;
      }

      // Otherwise, rent is based on number of houses
      return property.rent[property.houses];
  }
};

// Helper function to get special space at a position
const getSpecialSpace = (position) => {
  // Import special spaces from the board module
  const { specialSpaces } = require('../src/lib/game/board');

  return specialSpaces.find(s => s.position === position);
};

// Helper function to send SSE event to all clients or specific room
const sendEvent = (type, payload, roomId) => {
  console.log(`Sending SSE event: ${type}`, roomId ? `to room ${roomId}` : 'to all clients');
  const message = JSON.stringify({ type, payload });

  // Always include the roomId in the payload for proper routing
  if (roomId && !payload.roomId) {
    payload.roomId = roomId;
  }

  let sentCount = 0;
  for (const [clientId, client] of clients.entries()) {
    try {
      // If roomId is specified, we need to check if this client is in the room
      // For now, we'll send to all clients to ensure delivery
      client.write(`data: ${message}\n\n`);
      sentCount++;
      console.log(`Event sent to client: ${clientId}`);
    } catch (error) {
      console.error(`Error sending event to client ${clientId}:`, error);
    }
  }

  console.log(`Event ${type} sent to ${sentCount} clients`);

  // If no clients received the event, log a warning
  if (sentCount === 0) {
    console.warn(`No clients received the ${type} event`);
  }
};

// API endpoints
app.get('/api/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  console.log(`Fetching room data for roomId: ${roomId}`);

  const room = await getRoom(roomId);

  if (!room) {
    console.log(`Room not found: ${roomId}`);
    return res.status(404).json({ error: 'Room not found' });
  }

  console.log(`Returning room data:`, {
    id: room.id,
    name: room.name,
    host: room.host,
    playerCount: room.players.length,
    gameStarted: room.gameStarted,
    hasGameState: !!room.gameState
  });

  // Also send a roomUpdated event to ensure all clients have the latest state
  sendEvent('roomUpdated', { room }, roomId);

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

  // Check if player is already in the room
  const existingPlayerIndex = room.players.findIndex(p => p.id === clientId);
  if (existingPlayerIndex !== -1) {
    console.log(`Player ${clientId} is already in room ${roomId}`);
    return res.json({ success: true, room });
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

  // Send SSE events
  // Send roomJoined to all clients to ensure everyone gets the update
  sendEvent('roomJoined', { room });

  // Also send a specific roomUpdated event
  sendEvent('roomUpdated', { room }, roomId);

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

  // Send SSE event
  sendEvent('roomJoined', { room }, roomId);

  res.json({ success: true, room });
});

app.post('/api/rooms/:roomId/start', async (req, res) => {
  console.log('Start game request received:', req.params, req.body);

  const { roomId } = req.params;
  const { clientId } = req.body;

  if (!clientId) {
    console.error('No clientId provided in request body');
    return res.status(400).json({ error: 'Client ID is required' });
  }

  console.log('Fetching room from Redis:', roomId);
  const room = await getRoom(roomId);

  if (!room) {
    console.error('Room not found:', roomId);
    return res.status(404).json({ error: 'Room not found' });
  }

  console.log('Room found:', room);

  if (room.gameStarted) {
    console.error('Game already started');
    return res.status(400).json({ error: 'Game already started' });
  }

  // Only host can start the game
  console.log('Checking if client is host. Host:', room.host, 'Client:', clientId);
  if (room.host !== clientId) {
    console.error('Client is not the host');
    return res.status(403).json({ error: 'Only host can start the game' });
  }

  // Need at least 2 players to start
  console.log('Checking player count:', room.players.length);
  if (room.players.length < 2) {
    console.error('Not enough players');
    return res.status(400).json({ error: 'Need at least 2 players to start the game' });
  }

  // Initialize game state
  console.log('Initializing game state');

  // Check for duplicate player IDs
  const playerIds = room.players.map(p => p.id);
  const uniqueIds = new Set(playerIds);
  if (playerIds.length !== uniqueIds.size) {
    console.error('DUPLICATE PLAYER IDs DETECTED!', playerIds);

    // Find the duplicates
    const counts = {};
    const duplicates = [];
    playerIds.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
      if (counts[id] > 1 && !duplicates.includes(id)) {
        duplicates.push(id);
      }
    });

    console.error('Duplicate IDs:', duplicates);

    // Fix duplicate IDs by assigning new IDs to duplicates
    const uniquePlayers = [];
    const seenIds = new Set();

    room.players.forEach(player => {
      if (!seenIds.has(player.id)) {
        seenIds.add(player.id);
        uniquePlayers.push(player);
      } else {
        // Create a new ID for the duplicate player
        const newId = `${player.id}-${uuidv4().substring(0, 8)}`;
        console.log(`Fixing duplicate player ID: ${player.id} -> ${newId}`);

        const fixedPlayer = {
          ...player,
          id: newId
        };

        uniquePlayers.push(fixedPlayer);
      }
    });

    // Update the room with fixed players
    room.players = uniquePlayers;
    await saveRoom(room);
  }

  // Import properties from the board module
  const { properties } = require('../src/lib/game/board');

  // Create a deep copy of the properties to avoid reference issues
  const initialProperties = JSON.parse(JSON.stringify(properties));
  console.log(`Initialized ${initialProperties.length} properties for the game`);

  const gameState = {
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
  console.log('Updating room with game state');
  room.gameStarted = true;
  room.gameState = gameState;

  try {
    // Save to Redis
    console.log('Saving room to Redis');
    await saveRoom(room);
    console.log('Saving game state to Redis');
    await saveGameState(gameState);

    // Send SSE event
    console.log('Sending gameStarted event');
    // Include room information in the payload to ensure proper routing
    sendEvent('gameStarted', { gameState, room: { id: roomId } }, roomId);

    // Also send a direct room update event to ensure the client updates the room state
    console.log('Sending explicit roomUpdated event');
    sendEvent('roomUpdated', { room }, roomId);

    // Send updated rooms list
    console.log('Getting all rooms');
    const rooms = await getAllRooms();
    console.log('Sending roomsList event');
    sendEvent('roomsList', { rooms });

    console.log('Sending success response');
    res.json({ success: true, gameState });
  } catch (error) {
    console.error('Error in start game endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Game action endpoints
app.post('/api/rooms/:roomId/roll-dice', async (req, res) => {
  const { roomId } = req.params;
  const { clientId } = req.body;
  console.log(`Roll dice request from ${clientId} for room ${roomId}`);

  const room = await getRoom(roomId);

  if (!room || !room.gameStarted || !room.gameState) {
    console.log('Game not started');
    return res.status(400).json({ error: 'Game not started' });
  }

  // Check if it's the player's turn
  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  if (currentPlayer.id !== clientId) {
    console.log(`Not ${clientId}'s turn. Current player is ${currentPlayer.id}`);
    return res.status(403).json({ error: 'Not your turn' });
  }

  // Check if the player has already rolled
  if (room.gameState.gamePhase === 'rolled') {
    console.log('Player has already rolled');
    return res.status(400).json({ error: 'You have already rolled the dice' });
  }

  // Roll dice
  const dice = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];
  console.log(`Dice roll: ${dice[0]}, ${dice[1]}`);

  // Update game state
  room.gameState.dice = dice;
  room.gameState.gamePhase = 'rolled';

  // Move player
  const oldPosition = currentPlayer.position;
  const newPosition = (oldPosition + dice[0] + dice[1]) % 40;
  currentPlayer.position = newPosition;
  console.log(`Player moved from ${oldPosition} to ${newPosition}`);

  // Check if player landed on a property
  let propertyMessage = '';
  const property = room.gameState.properties.find(p => p.position === newPosition);

  if (property) {
    propertyMessage = ` and landed on ${property.name}`;
    console.log(`Player landed on property: ${property.name}`);

    // Check if property is owned by another player
    if (property.owner && property.owner !== currentPlayer.id) {
      // Find owner
      const owner = room.gameState.players.find(p => p.id === property.owner);

      if (owner) {
        // Calculate rent
        const rentAmount = calculateRent(room.gameState, property);
        console.log(`Player needs to pay $${rentAmount} rent to ${owner.name}`);

        // Pay rent
        currentPlayer.money -= rentAmount;
        owner.money += rentAmount;

        // Update action log
        room.gameState.actionLog.push(`${currentPlayer.name} paid $${rentAmount} rent to ${owner.name} for ${property.name}`);

        // Check for bankruptcy
        if (currentPlayer.money < 0) {
          console.log(`Player ${currentPlayer.name} is bankrupt`);
          currentPlayer.bankrupt = true;
          room.gameState.actionLog.push(`${currentPlayer.name} went bankrupt!`);

          // Check if game is over (only one player left)
          const activePlayers = room.gameState.players.filter(p => !p.bankrupt);
          if (activePlayers.length === 1) {
            room.gameState.winner = activePlayers[0].id;
            room.gameState.gamePhase = 'game-over';
            room.gameState.actionLog.push(`${activePlayers[0].name} wins the game!`);
          }
        }

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
    // Check if player landed on a special space
    const specialSpace = getSpecialSpace(newPosition);
    if (specialSpace) {
      propertyMessage = ` and landed on ${specialSpace.name}`;
      console.log(`Player landed on special space: ${specialSpace.name}`);

      // Handle special spaces
      if (specialSpace.type === 'tax') {
        // Pay tax
        const taxAmount = specialSpace.amount || 0;
        currentPlayer.money -= taxAmount;
        room.gameState.actionLog.push(`${currentPlayer.name} paid $${taxAmount} in taxes`);

        // Check for bankruptcy
        if (currentPlayer.money < 0) {
          console.log(`Player ${currentPlayer.name} is bankrupt`);
          currentPlayer.bankrupt = true;
          room.gameState.actionLog.push(`${currentPlayer.name} went bankrupt!`);

          // Check if game is over (only one player left)
          const activePlayers = room.gameState.players.filter(p => !p.bankrupt);
          if (activePlayers.length === 1) {
            room.gameState.winner = activePlayers[0].id;
            room.gameState.gamePhase = 'game-over';
            room.gameState.actionLog.push(`${activePlayers[0].name} wins the game!`);
          }
        }
      } else if (specialSpace.type === 'go-to-jail') {
        // Go to jail
        currentPlayer.position = 10; // Jail position
        currentPlayer.inJail = true;
        room.gameState.actionLog.push(`${currentPlayer.name} was sent to Jail`);
      }

      // Set game phase to end-turn
      room.gameState.gamePhase = 'end-turn';
    } else {
      // Not a property or special space, set game phase to end-turn
      room.gameState.gamePhase = 'end-turn';
    }
  }

  // Update action log for the dice roll and movement
  room.gameState.actionLog.push(`${currentPlayer.name} rolled ${dice[0]}+${dice[1]} and moved to position ${newPosition}${propertyMessage}`);

  // Save to Redis
  await saveRoom(room);
  await saveGameState(room.gameState);

  // Send SSE events
  console.log('Sending diceRolled event');
  sendEvent('diceRolled', { playerId: currentPlayer.id, dice }, roomId);

  console.log('Sending playerMoved event');
  sendEvent('playerMoved', { playerId: currentPlayer.id, position: newPosition }, roomId);

  console.log('Sending gameStateUpdated event');
  sendEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

  res.json({ success: true, dice, newPosition });
});

app.post('/api/rooms/:roomId/end-turn', async (req, res) => {
  const { roomId } = req.params;
  const { clientId } = req.body;
  console.log(`End turn request from ${clientId} for room ${roomId}`);

  const room = await getRoom(roomId);

  if (!room || !room.gameStarted || !room.gameState) {
    console.log('Game not started');
    return res.status(400).json({ error: 'Game not started' });
  }

  // Check if it's the player's turn
  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  if (currentPlayer.id !== clientId) {
    console.log(`Not ${clientId}'s turn. Current player is ${currentPlayer.id}`);
    return res.status(403).json({ error: 'Not your turn' });
  }

  // Check if the player has rolled the dice
  if (room.gameState.gamePhase !== 'rolled') {
    console.log('Player has not rolled the dice yet');
    return res.status(400).json({ error: 'You must roll the dice before ending your turn' });
  }

  // Move to next player
  room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.gameState.players.length;
  const nextPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  console.log(`Turn passed from ${currentPlayer.name} to ${nextPlayer.name}`);

  // Reset game phase for the next player
  room.gameState.gamePhase = 'waiting';

  // Update action log
  room.gameState.actionLog.push(`${currentPlayer.name} ended their turn. ${nextPlayer.name}'s turn now.`);

  // Save to Redis
  await saveRoom(room);
  await saveGameState(room.gameState);

  // Send SSE events
  console.log('Sending turnEnded event');
  sendEvent('turnEnded', { nextPlayerId: nextPlayer.id }, roomId);

  console.log('Sending gameStateUpdated event');
  sendEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

  // Check if next player is AI and trigger AI turn automatically
  if (nextPlayer.isAI) {
    console.log(`Next player ${nextPlayer.name} is AI, triggering AI turn automatically`);
    // Trigger AI turn with a slight delay to allow clients to update
    setTimeout(() => {
      try {
        // Call the AI turn endpoint
        handleAITurn(roomId).catch(error => {
          console.error('[END TURN] Error in AI turn triggered from end-turn:', error);
        });
      } catch (error) {
        console.error('[END TURN] Error scheduling AI turn:', error);
      }
    }, 2000); // 2 second delay
  }

  res.json({ success: true, nextPlayerId: nextPlayer.id });
});

// Buy property endpoint
app.post('/api/rooms/:roomId/buy-property', async (req, res) => {
  const { roomId } = req.params;
  const { clientId, propertyId } = req.body;
  console.log(`Buy property request from ${clientId} for property ${propertyId} in room ${roomId}`);

  const room = await getRoom(roomId);

  if (!room || !room.gameStarted || !room.gameState) {
    console.log('Game not started');
    return res.status(400).json({ error: 'Game not started' });
  }

  // Check if it's the player's turn
  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  if (currentPlayer.id !== clientId) {
    console.log(`Not ${clientId}'s turn. Current player is ${currentPlayer.id}`);
    return res.status(403).json({ error: 'Not your turn' });
  }

  // Find the property
  const property = room.gameState.properties.find(p => p.id === propertyId);
  if (!property) {
    console.log(`Property ${propertyId} not found`);
    return res.status(404).json({ error: 'Property not found' });
  }

  // Check if property is available
  if (property.owner !== null) {
    console.log(`Property ${property.name} already owned by ${property.owner}`);
    return res.status(400).json({ error: 'Property already owned' });
  }

  // Check if player has enough money
  if (currentPlayer.money < property.price) {
    console.log(`Player ${currentPlayer.name} doesn't have enough money to buy ${property.name}`);
    return res.status(400).json({ error: 'Not enough money' });
  }

  // Buy property
  console.log(`Player ${currentPlayer.name} is buying ${property.name} for $${property.price}`);
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
  console.log('Sending propertyPurchased event');
  sendEvent('propertyPurchased', {
    playerId: currentPlayer.id,
    propertyId: property.id,
    propertyName: property.name,
    price: property.price
  }, roomId);

  console.log('Sending gameStateUpdated event');
  sendEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

  res.json({ success: true, property });
});

// AI turn handling
const handleAITurn = async (roomId) => {
  try {
    console.log(`[AI TURN] Handling AI turn for room ${roomId}`);

    // Get the latest room state
    const room = await getRoom(roomId);

    if (!room || !room.gameStarted || !room.gameState) {
      console.log('[AI TURN] Game not started or no game state');
      return;
    }

    // Get current player
    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];

    if (!currentPlayer) {
      console.error('[AI TURN] Current player not found in game state');
      return;
    }

    // Make sure it's an AI player
    if (!currentPlayer.isAI) {
      console.log(`[AI TURN] Current player ${currentPlayer.name} is not AI`);
      return;
    }

    console.log(`[AI TURN] AI player ${currentPlayer.name} is taking its turn`);

    // AI rolls dice
    const dice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    console.log(`[AI TURN] AI rolled dice: ${dice[0]}, ${dice[1]}`);

    // Update game state
    room.gameState.dice = dice;
    room.gameState.gamePhase = 'rolled';

    // Move player
    const oldPosition = currentPlayer.position;
    const newPosition = (oldPosition + dice[0] + dice[1]) % 40;
    currentPlayer.position = newPosition;
    console.log(`[AI TURN] AI moved from ${oldPosition} to ${newPosition}`);

    // Check if player landed on a property
    let propertyMessage = '';
    const property = room.gameState.properties.find(p => p.position === newPosition);

    if (property) {
      propertyMessage = ` and landed on ${property.name}`;
      console.log(`[AI TURN] AI landed on property: ${property.name}`);

      // Check if property is owned by another player
      if (property.owner && property.owner !== currentPlayer.id) {
        // Find owner
        const owner = room.gameState.players.find(p => p.id === property.owner);

        if (owner) {
          // Calculate rent
          const rentAmount = calculateRent(room.gameState, property);
          console.log(`[AI TURN] AI needs to pay $${rentAmount} rent to ${owner.name}`);

          // Pay rent
          currentPlayer.money -= rentAmount;
          owner.money += rentAmount;

          // Update action log
          room.gameState.actionLog.push(`${currentPlayer.name} paid $${rentAmount} rent to ${owner.name} for ${property.name}`);

          // Check for bankruptcy
          if (currentPlayer.money < 0) {
            console.log(`[AI TURN] AI player ${currentPlayer.name} is bankrupt`);
            currentPlayer.bankrupt = true;
            room.gameState.actionLog.push(`${currentPlayer.name} went bankrupt!`);

            // Check if game is over (only one player left)
            const activePlayers = room.gameState.players.filter(p => !p.bankrupt);
            if (activePlayers.length === 1) {
              room.gameState.winner = activePlayers[0].id;
              room.gameState.gamePhase = 'game-over';
              room.gameState.actionLog.push(`${activePlayers[0].name} wins the game!`);
            }
          }
        }
      } else if (!property.owner) {
        // Property is not owned, AI should buy it if it has enough money
        if (currentPlayer.money >= property.price) {
          // Buy property
          console.log(`[AI TURN] AI is buying ${property.name} for $${property.price}`);
          currentPlayer.money -= property.price;
          property.owner = currentPlayer.id;

          // Add property to AI's properties array
          if (!currentPlayer.properties) {
            currentPlayer.properties = [];
          }
          currentPlayer.properties.push(property);

          // Update action log
          room.gameState.actionLog.push(`${currentPlayer.name} bought ${property.name} for $${property.price}`);
        } else {
          console.log(`[AI TURN] AI can't afford ${property.name}`);
          room.gameState.actionLog.push(`${currentPlayer.name} can't afford ${property.name}`);
        }
      }
    } else {
      // Check if player landed on a special space
      const specialSpace = getSpecialSpace(newPosition);
      if (specialSpace) {
        propertyMessage = ` and landed on ${specialSpace.name}`;
        console.log(`[AI TURN] AI landed on special space: ${specialSpace.name}`);

        // Handle special spaces
        if (specialSpace.type === 'tax') {
          // Pay tax
          const taxAmount = specialSpace.amount || 0;
          currentPlayer.money -= taxAmount;
          room.gameState.actionLog.push(`${currentPlayer.name} paid $${taxAmount} in taxes`);

          // Check for bankruptcy
          if (currentPlayer.money < 0) {
            console.log(`[AI TURN] AI player ${currentPlayer.name} is bankrupt`);
            currentPlayer.bankrupt = true;
            room.gameState.actionLog.push(`${currentPlayer.name} went bankrupt!`);

            // Check if game is over (only one player left)
            const activePlayers = room.gameState.players.filter(p => !p.bankrupt);
            if (activePlayers.length === 1) {
              room.gameState.winner = activePlayers[0].id;
              room.gameState.gamePhase = 'game-over';
              room.gameState.actionLog.push(`${activePlayers[0].name} wins the game!`);
            }
          }
        } else if (specialSpace.type === 'go-to-jail') {
          // Go to jail
          currentPlayer.position = 10; // Jail position
          currentPlayer.inJail = true;
          room.gameState.actionLog.push(`${currentPlayer.name} was sent to Jail`);
        }
      }
    }

    // Update action log for the dice roll and movement
    room.gameState.actionLog.push(`${currentPlayer.name} rolled ${dice[0]}+${dice[1]} and moved to position ${newPosition}${propertyMessage}`);

    // Save to Redis
    await saveRoom(room);
    await saveGameState(room.gameState);

    // Send SSE events
    console.log('[AI TURN] Sending diceRolled event for AI');
    sendEvent('diceRolled', { playerId: currentPlayer.id, dice }, roomId);

    console.log('[AI TURN] Sending playerMoved event for AI');
    sendEvent('playerMoved', { playerId: currentPlayer.id, position: newPosition }, roomId);

    console.log('[AI TURN] Sending gameStateUpdated event for AI');
    sendEvent('gameStateUpdated', { gameState: room.gameState }, roomId);

    // End AI turn after a delay
    console.log('[AI TURN] Scheduling end of AI turn');

    // Use a promise with setTimeout to handle the async operation properly
    await new Promise(resolve => {
      setTimeout(async () => {
        try {
          console.log(`[AI TURN] AI player ${currentPlayer.name} is ending its turn`);

          // Get the latest room state again to ensure we're working with current data
          const updatedRoom = await getRoom(roomId);

          if (!updatedRoom || !updatedRoom.gameStarted || !updatedRoom.gameState) {
            console.log('[AI TURN] Game no longer active when ending AI turn');
            resolve();
            return;
          }

          // Verify the current player is still the same AI
          const currentAIPlayer = updatedRoom.gameState.players[updatedRoom.gameState.currentPlayerIndex];
          if (!currentAIPlayer || currentAIPlayer.id !== currentPlayer.id) {
            console.log('[AI TURN] Current player has changed, not ending AI turn');
            resolve();
            return;
          }

          // Move to next player
          updatedRoom.gameState.currentPlayerIndex = (updatedRoom.gameState.currentPlayerIndex + 1) % updatedRoom.gameState.players.length;
          const nextPlayer = updatedRoom.gameState.players[updatedRoom.gameState.currentPlayerIndex];
          console.log(`[AI TURN] Turn passed from ${currentAIPlayer.name} to ${nextPlayer.name}`);

          // Reset game phase for the next player
          updatedRoom.gameState.gamePhase = 'waiting';

          // Update action log
          updatedRoom.gameState.actionLog.push(`${currentAIPlayer.name} ended their turn. ${nextPlayer.name}'s turn now.`);

          // Save to Redis
          await saveRoom(updatedRoom);
          await saveGameState(updatedRoom.gameState);

          // Send SSE events
          console.log('[AI TURN] Sending turnEnded event for AI');
          sendEvent('turnEnded', { nextPlayerId: nextPlayer.id }, roomId);

          console.log('[AI TURN] Sending gameStateUpdated event for AI');
          sendEvent('gameStateUpdated', { gameState: updatedRoom.gameState }, roomId);

          // If next player is also AI, trigger its turn after a delay
          if (nextPlayer.isAI) {
            console.log(`[AI TURN] Next player ${nextPlayer.name} is also AI, scheduling its turn`);
            setTimeout(() => {
              try {
                handleAITurn(roomId).catch(err => {
                  console.error('[AI TURN] Error in recursive AI turn:', err);
                });
              } catch (error) {
                console.error('[AI TURN] Error scheduling next AI turn:', error);
              }
            }, 2000);
          }

          resolve();
        } catch (error) {
          console.error('[AI TURN] Error ending AI turn:', error);
          resolve(); // Resolve anyway to prevent hanging
        }
      }, 3000); // 3 second delay before ending turn
    });

    console.log('[AI TURN] AI turn handling completed');
  } catch (error) {
    console.error('[AI TURN] Error in handleAITurn:', error);
  }
};

// Expose AI turn endpoint for manual triggering if needed
app.post('/api/rooms/:roomId/ai-turn', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { clientId } = req.body;
    console.log(`[MANUAL AI TURN] Manual AI turn request from ${clientId} for room ${roomId}`);

    const room = await getRoom(roomId);

    if (!room || !room.gameStarted || !room.gameState) {
      console.log('[MANUAL AI TURN] Game not started or no game state');
      return res.status(400).json({ error: 'Game not started' });
    }

    // Only host can manually trigger AI turns
    if (room.host !== clientId) {
      console.log(`[MANUAL AI TURN] Client ${clientId} is not the host (${room.host})`);
      return res.status(403).json({ error: 'Only host can trigger AI turns' });
    }

    // Get current player
    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];

    if (!currentPlayer) {
      console.error('[MANUAL AI TURN] Current player not found in game state');
      return res.status(500).json({ error: 'Current player not found' });
    }

    // Make sure it's an AI player
    if (!currentPlayer.isAI) {
      console.log(`[MANUAL AI TURN] Current player ${currentPlayer.name} is not AI`);
      return res.status(400).json({ error: 'Current player is not AI' });
    }

    // Trigger AI turn
    console.log(`[MANUAL AI TURN] Manually triggering AI turn for ${currentPlayer.name}`);

    // Start the AI turn in the background
    handleAITurn(roomId).catch(error => {
      console.error('[MANUAL AI TURN] Error in manually triggered AI turn:', error);
    });

    // Respond immediately
    res.json({ success: true, message: 'AI turn started' });
  } catch (error) {
    console.error('[MANUAL AI TURN] Error in manual AI turn endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

// Periodic room state check for debugging
setInterval(async () => {
  try {
    const rooms = await getAllRooms();
    console.log(`[DEBUG] Current rooms: ${rooms.length}`);

    for (const room of rooms) {
      console.log(`[DEBUG] Room ${room.id}: ${room.players.length} players, gameStarted=${room.gameStarted}`);

      if (room.gameStarted && room.gameState) {
        console.log(`[DEBUG] Game state for room ${room.id}: currentPlayer=${room.gameState.currentPlayerIndex}, phase=${room.gameState.gamePhase}`);
      }
    }

    console.log(`[DEBUG] Connected clients: ${clients.size}`);
  } catch (error) {
    console.error('[DEBUG] Error in periodic room check:', error);
  }
}, 60000); // Check every minute

// Start server
const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server-Sent Events endpoint available at http://localhost:${PORT}/events`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/*`);
});
