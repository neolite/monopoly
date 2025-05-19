'use client';

import { useState } from 'react';
import { GameState } from '@/types/game';
import DiceRoll from './DiceRoll';

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
  const [isRolling, setIsRolling] = useState(false);

  if (!gameState) {
    return null;
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const handleRollDice = () => {
    setIsRolling(true);
    onRollDice();
  };

  // Check if current player can buy property
  const canBuyProperty = () => {
    console.log('Checking if player can buy property:');
    console.log('- isCurrentTurn:', isCurrentTurn);
    console.log('- gamePhase:', gameState.gamePhase);

    // Allow buying in both 'property-decision' and 'rolled' phases
    if (!isCurrentTurn || (gameState.gamePhase !== 'property-decision' && gameState.gamePhase !== 'rolled')) {
      console.log('Cannot buy property: not current turn or not in property-decision/rolled phase');
      return false;
    }

    // Find property at current position
    const property = gameState.properties.find(p => p.position === currentPlayer.position);
    console.log('- Current position:', currentPlayer.position);
    console.log('- Property at position:', property);

    if (!property) {
      console.log('Cannot buy property: no property at current position');
      return false;
    }

    if (property.owner !== null) {
      console.log('Cannot buy property: property already owned by', property.owner);
      return false;
    }

    // Check if player has enough money
    const hasEnoughMoney = currentPlayer.money >= property.price;
    console.log('- Player money:', currentPlayer.money);
    console.log('- Property price:', property.price);
    console.log('- Has enough money:', hasEnoughMoney);

    return hasEnoughMoney;
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
          <div className={`p-3 rounded-lg ${
            property.owner === null && isCurrentTurn && (gameState.gamePhase === 'property-decision' || gameState.gamePhase === 'rolled')
              ? 'bg-green-100 border-2 border-green-300'
              : 'bg-yellow-50'
          }`}>
            <h3 className="font-semibold text-yellow-800">Current Property:</h3>
            <p className="text-yellow-700">{property.name}</p>
            <p className="text-yellow-700">Price: ${property.price}</p>
            <p className="text-yellow-700">
              Owner: {property.owner
                ? gameState.players.find(p => p.id === property.owner)?.name || 'Unknown'
                : 'None'}
            </p>
            {property.owner === null && isCurrentTurn && (gameState.gamePhase === 'property-decision' || gameState.gamePhase === 'rolled') && (
              <div className="mt-2 text-sm text-green-800 font-semibold">
                This property is available for purchase!
              </div>
            )}
            {property.owner && property.owner !== currentPlayer.id && (
              <div className="mt-2 text-sm text-red-800 font-semibold">
                Rent: ${property.rent[property.houses]}
              </div>
            )}
          </div>
        )}

        {/* Dice display */}
        {(gameState.dice[0] > 0 || isRolling) && (
          <DiceRoll
            dice={gameState.dice as [number, number]}
            isRolling={isRolling}
            onRollComplete={() => setIsRolling(false)}
          />
        )}

        {/* Action buttons */}
        <div className="flex flex-col space-y-2">
          {isCurrentTurn && gameState.gamePhase === 'waiting' && (
            <button
              onClick={handleRollDice}
              disabled={isRolling}
              className={`${
                isRolling
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300`}
            >
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </button>
          )}

          {isCurrentTurn && canBuyProperty() && (
            <div>
              <div className="mb-2 text-sm text-green-600 font-semibold">
                You can buy {property?.name} for ${property?.price}
              </div>
              <button
                onClick={onBuyProperty}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
              >
                Buy Property (${property?.price})
              </button>
            </div>
          )}

          {isCurrentTurn && (gameState.gamePhase === 'end-turn' || gameState.gamePhase === 'property-decision' || gameState.gamePhase === 'rolled') && (
            <div>
              <div className="mb-2 text-sm text-gray-600">
                Game Phase: {gameState.gamePhase}
                {gameState.gamePhase === 'property-decision' && ' - You can buy this property or end your turn'}
                {gameState.gamePhase === 'rolled' && property && property.owner === null && ' - You can buy this property or end your turn'}
                {gameState.gamePhase === 'rolled' && (!property || property.owner !== null) && ' - You can end your turn'}
                {gameState.gamePhase === 'end-turn' && ' - You can end your turn'}
              </div>
              <button
                onClick={onEndTurn}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
              >
                End Turn
              </button>
            </div>
          )}

          {!isCurrentTurn && (
            <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-600">
              Waiting for {currentPlayer.name}&apos;s turn...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
