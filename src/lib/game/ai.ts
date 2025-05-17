import { GameState, Player, Property } from '@/types/game';
import { rollDice, movePlayer, buyProperty, endTurn } from './logic';

// AI player decision making
export const handleAITurn = (gameState: GameState): GameState => {
  // Get current AI player
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // Make sure it's an AI player
  if (!currentPlayer.isAI) {
    return gameState;
  }
  
  // Handle different game phases
  switch (gameState.gamePhase) {
    case 'waiting':
      // Roll dice
      return handleAIRollDice(gameState);
      
    case 'property-decision':
      // Decide whether to buy property
      return handleAIPropertyDecision(gameState);
      
    case 'end-turn':
      // End turn
      return endTurn(gameState);
      
    default:
      return gameState;
  }
};

// AI rolls dice
const handleAIRollDice = (gameState: GameState): GameState => {
  // Roll dice
  const dice = rollDice();
  
  // Update game state
  const updatedGameState = {
    ...gameState,
    dice,
    gamePhase: 'moving'
  };
  
  // Log action
  updatedGameState.actionLog.push(`${gameState.players[gameState.currentPlayerIndex].name} rolled ${dice[0]} + ${dice[1]} = ${dice[0] + dice[1]}`);
  
  // Move player
  const afterMoveGameState = movePlayer(
    updatedGameState,
    gameState.players[gameState.currentPlayerIndex].id,
    dice[0] + dice[1]
  );
  
  // Check if player landed on a property
  const currentPosition = afterMoveGameState.players[afterMoveGameState.currentPlayerIndex].position;
  const property = afterMoveGameState.properties.find(p => p.position === currentPosition);
  
  if (property) {
    // Check if property is owned
    if (property.owner) {
      // Property is owned by someone else
      if (property.owner !== afterMoveGameState.players[afterMoveGameState.currentPlayerIndex].id) {
        // Pay rent (handled by server)
        return {
          ...afterMoveGameState,
          gamePhase: 'paying-rent'
        };
      } else {
        // Own property, end turn
        return {
          ...afterMoveGameState,
          gamePhase: 'end-turn'
        };
      }
    } else {
      // Property is not owned, decide whether to buy
      return {
        ...afterMoveGameState,
        gamePhase: 'property-decision'
      };
    }
  } else {
    // Not a property, end turn
    return {
      ...afterMoveGameState,
      gamePhase: 'end-turn'
    };
  }
};

// AI decides whether to buy property
const handleAIPropertyDecision = (gameState: GameState): GameState => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentPosition = currentPlayer.position;
  const property = gameState.properties.find(p => p.position === currentPosition);
  
  if (!property) {
    // Not a property, end turn
    return {
      ...gameState,
      gamePhase: 'end-turn'
    };
  }
  
  // Basic AI strategy: Buy property if affordable
  if (currentPlayer.money >= property.price) {
    // Buy property
    const afterBuyGameState = buyProperty(
      gameState,
      currentPlayer.id,
      property.id
    );
    
    // End turn
    return {
      ...afterBuyGameState,
      gamePhase: 'end-turn'
    };
  } else {
    // Can't afford, end turn
    gameState.actionLog.push(`${currentPlayer.name} can't afford ${property.name}`);
    
    return {
      ...gameState,
      gamePhase: 'end-turn'
    };
  }
};

// Advanced AI strategy (for future implementation)
const evaluatePropertyValue = (gameState: GameState, property: Property): number => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // Base value is the property price
  let value = property.price;
  
  // Check if player owns other properties in the group
  const propertiesInGroup = gameState.properties.filter(
    p => p.group === property.group
  );
  
  const ownedInGroup = propertiesInGroup.filter(
    p => p.owner === currentPlayer.id
  ).length;
  
  // Increase value if player owns other properties in the group
  if (ownedInGroup > 0) {
    // The more properties owned in the group, the more valuable
    value *= (1 + (ownedInGroup / propertiesInGroup.length));
  }
  
  // Adjust value based on position on board
  // Properties later in the game are generally more valuable
  value *= (1 + (property.position / 40) * 0.5);
  
  // Adjust value based on potential rent income
  value *= (1 + (property.rent[0] / property.price) * 2);
  
  return value;
};
