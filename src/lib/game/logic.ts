import { GameState, Player, Property } from '@/types/game';
import { properties, specialSpaces, BOARD_SPACES } from './board';

// Roll dice
export const rollDice = (): [number, number] => {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];
};

// Move player
export const movePlayer = (
  gameState: GameState,
  playerId: string,
  steps: number
): GameState => {
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  
  if (playerIndex === -1) {
    return gameState;
  }
  
  const player = gameState.players[playerIndex];
  const newPosition = (player.position + steps) % BOARD_SPACES;
  
  // Check if player passed GO
  if (newPosition < player.position) {
    // Player passed GO, collect $200
    player.money += 200;
    gameState.actionLog.push(`${player.name} passed GO and collected $200`);
  }
  
  // Update player position
  player.position = newPosition;
  gameState.players[playerIndex] = player;
  
  // Handle landing on special spaces
  handleSpecialSpaces(gameState, player);
  
  return {
    ...gameState,
    players: [...gameState.players]
  };
};

// Handle special spaces
const handleSpecialSpaces = (gameState: GameState, player: Player): void => {
  const space = specialSpaces.find(s => s.position === player.position);
  
  if (!space) {
    return;
  }
  
  switch (space.type) {
    case 'tax':
      // Pay tax
      player.money -= space.amount;
      gameState.actionLog.push(`${player.name} paid $${space.amount} in taxes`);
      break;
      
    case 'go-to-jail':
      // Go to jail
      player.position = 10; // Jail position
      player.inJail = true;
      gameState.actionLog.push(`${player.name} went to jail`);
      break;
      
    // Other special spaces will be handled by card drawing logic
  }
};

// Buy property
export const buyProperty = (
  gameState: GameState,
  playerId: string,
  propertyId: number
): GameState => {
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  const propertyIndex = gameState.properties.findIndex(p => p.id === propertyId);
  
  if (playerIndex === -1 || propertyIndex === -1) {
    return gameState;
  }
  
  const player = gameState.players[playerIndex];
  const property = gameState.properties[propertyIndex];
  
  // Check if property is available
  if (property.owner !== null) {
    return gameState;
  }
  
  // Check if player has enough money
  if (player.money < property.price) {
    return gameState;
  }
  
  // Buy property
  player.money -= property.price;
  property.owner = player.id;
  player.properties.push(property);
  
  // Update game state
  gameState.players[playerIndex] = player;
  gameState.properties[propertyIndex] = property;
  gameState.actionLog.push(`${player.name} bought ${property.name} for $${property.price}`);
  
  return {
    ...gameState,
    players: [...gameState.players],
    properties: [...gameState.properties]
  };
};

// Pay rent
export const payRent = (
  gameState: GameState,
  fromPlayerId: string,
  toPlayerId: string,
  propertyId: number
): GameState => {
  const fromPlayerIndex = gameState.players.findIndex(p => p.id === fromPlayerId);
  const toPlayerIndex = gameState.players.findIndex(p => p.id === toPlayerId);
  const propertyIndex = gameState.properties.findIndex(p => p.id === propertyId);
  
  if (fromPlayerIndex === -1 || toPlayerIndex === -1 || propertyIndex === -1) {
    return gameState;
  }
  
  const fromPlayer = gameState.players[fromPlayerIndex];
  const toPlayer = gameState.players[toPlayerIndex];
  const property = gameState.properties[propertyIndex];
  
  // Calculate rent
  const rentAmount = calculateRent(gameState, property);
  
  // Pay rent
  fromPlayer.money -= rentAmount;
  toPlayer.money += rentAmount;
  
  // Check for bankruptcy
  if (fromPlayer.money < 0) {
    handleBankruptcy(gameState, fromPlayer, toPlayer);
  }
  
  // Update game state
  gameState.players[fromPlayerIndex] = fromPlayer;
  gameState.players[toPlayerIndex] = toPlayer;
  gameState.actionLog.push(`${fromPlayer.name} paid $${rentAmount} rent to ${toPlayer.name} for ${property.name}`);
  
  return {
    ...gameState,
    players: [...gameState.players]
  };
};

// Calculate rent
const calculateRent = (gameState: GameState, property: Property): number => {
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

// Handle bankruptcy
const handleBankruptcy = (
  gameState: GameState,
  bankruptPlayer: Player,
  creditorPlayer: Player
): void => {
  // Mark player as bankrupt
  bankruptPlayer.bankrupt = true;
  
  // Transfer all properties to creditor
  const playerProperties = gameState.properties.filter(
    p => p.owner === bankruptPlayer.id
  );
  
  playerProperties.forEach(property => {
    property.owner = creditorPlayer.id;
    creditorPlayer.properties.push(property);
  });
  
  // Transfer any remaining money
  if (bankruptPlayer.money > 0) {
    creditorPlayer.money += bankruptPlayer.money;
    bankruptPlayer.money = 0;
  }
  
  // Add to action log
  gameState.actionLog.push(`${bankruptPlayer.name} went bankrupt to ${creditorPlayer.name}`);
  
  // Check if game is over
  const activePlayers = gameState.players.filter(p => !p.bankrupt);
  
  if (activePlayers.length === 1) {
    // Game over, we have a winner
    gameState.winner = activePlayers[0].id;
    gameState.gamePhase = 'game-over';
    gameState.actionLog.push(`${activePlayers[0].name} won the game!`);
  }
};

// End turn
export const endTurn = (gameState: GameState): GameState => {
  // Find next active player
  let nextPlayerIndex = gameState.currentPlayerIndex;
  let playersChecked = 0;
  
  while (playersChecked < gameState.players.length) {
    // Move to next player
    nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
    playersChecked++;
    
    // Check if player is active
    if (!gameState.players[nextPlayerIndex].bankrupt) {
      break;
    }
  }
  
  // Update game state
  gameState.currentPlayerIndex = nextPlayerIndex;
  gameState.gamePhase = 'waiting';
  gameState.actionLog.push(`${gameState.players[nextPlayerIndex].name}'s turn`);
  
  // Handle AI player turn
  if (gameState.players[nextPlayerIndex].isAI) {
    // AI logic will be implemented separately
    gameState.actionLog.push(`AI player ${gameState.players[nextPlayerIndex].name} is thinking...`);
  }
  
  return {
    ...gameState,
    currentPlayerIndex: nextPlayerIndex,
    gamePhase: 'waiting'
  };
};
