'use client';

import { GameState } from '@/types/game';

interface ActionPanelProps {
  gameState: GameState | null;
  isCurrentTurn: boolean;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onEndTurn: () => void;
}

export default function ActionPanel({
  gameState,
  isCurrentTurn,
  onRollDice,
  onBuyProperty,
  onEndTurn
}: ActionPanelProps) {
  if (!gameState) {
    return null;
  }
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // Check if current player can buy property
  const canBuyProperty = () => {
    if (!isCurrentTurn || gameState.gamePhase !== 'property-decision') {
      return false;
    }
    
    // Find property at current position
    const property = gameState.properties.find(p => p.position === currentPlayer.position);
    
    if (!property || property.owner !== null) {
      return false;
    }
    
    // Check if player has enough money
    return currentPlayer.money >= property.price;
  };
  
  // Get property at current position
  const getCurrentProperty = () => {
    return gameState.properties.find(p => p.position === currentPlayer.position);
  };
  
  const property = getCurrentProperty();
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-blue-800 mb-4">Actions</h2>
      
      <div className="space-y-4">
        {/* Game phase info */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Current Phase:</h3>
          <p className="text-blue-700 capitalize">{gameState.gamePhase.replace('-', ' ')}</p>
        </div>
        
        {/* Current player info */}
        <div className="p-3 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">Current Player:</h3>
          <p className="text-green-700">{currentPlayer.name}</p>
        </div>
        
        {/* Property info if on property */}
        {property && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Current Property:</h3>
            <p className="text-yellow-700">{property.name}</p>
            <p className="text-yellow-700">Price: ${property.price}</p>
            <p className="text-yellow-700">
              Owner: {property.owner 
                ? gameState.players.find(p => p.id === property.owner)?.name || 'Unknown' 
                : 'None'}
            </p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex flex-col space-y-2">
          {isCurrentTurn && gameState.gamePhase === 'waiting' && (
            <button
              onClick={onRollDice}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
            >
              Roll Dice
            </button>
          )}
          
          {isCurrentTurn && canBuyProperty() && (
            <button
              onClick={onBuyProperty}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
            >
              Buy Property (${property?.price})
            </button>
          )}
          
          {isCurrentTurn && (gameState.gamePhase === 'end-turn' || gameState.gamePhase === 'property-decision') && (
            <button
              onClick={onEndTurn}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
            >
              End Turn
            </button>
          )}
          
          {!isCurrentTurn && (
            <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-600">
              Waiting for {currentPlayer.name}'s turn...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
