'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { initializeSocket, getSocket } from '@/lib/socket';
import { GameState, Player, Room } from '@/types/game';
import GameBoard from '@/components/board/GameBoard';
import PlayerInfo from '@/components/ui/PlayerInfo';
import ActionPanel from '@/components/ui/ActionPanel';
import GameLog from '@/components/ui/GameLog';

export default function Game() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);
  
  useEffect(() => {
    if (!roomId) {
      return;
    }
    
    // Initialize socket
    const socket = initializeSocket();
    
    // Set up event listeners
    socket.on('roomJoined', (updatedRoom) => {
      setRoom(updatedRoom);
      
      // Check if current player is host
      const playerId = socket.id;
      setIsHost(updatedRoom.host === playerId);
      
      // Find current player
      const player = updatedRoom.players.find(p => p.id === playerId);
      if (player) {
        setCurrentPlayer(player);
      }
    });
    
    socket.on('gameStarted', (initialGameState) => {
      setGameState(initialGameState);
      
      // Find current player
      const playerId = socket.id;
      const player = initialGameState.players.find(p => p.id === playerId);
      if (player) {
        setCurrentPlayer(player);
      }
    });
    
    socket.on('gameStateUpdated', (updatedGameState) => {
      setGameState(updatedGameState);
      
      // Find current player
      const playerId = socket.id;
      const player = updatedGameState.players.find(p => p.id === playerId);
      if (player) {
        setCurrentPlayer(player);
      }
    });
    
    // Clean up event listeners
    return () => {
      socket.off('roomJoined');
      socket.off('gameStarted');
      socket.off('gameStateUpdated');
    };
  }, [roomId]);
  
  const handleStartGame = () => {
    if (!roomId || !isHost) {
      return;
    }
    
    const socket = getSocket();
    socket.emit('startGame', roomId);
  };
  
  const handleAddAI = () => {
    if (!roomId || !isHost) {
      return;
    }
    
    const socket = getSocket();
    socket.emit('addAIPlayer', roomId);
  };
  
  const handleRollDice = () => {
    if (!roomId || !gameState) {
      return;
    }
    
    const socket = getSocket();
    socket.emit('rollDice', roomId);
  };
  
  const handleBuyProperty = () => {
    if (!roomId || !gameState || !currentPlayer) {
      return;
    }
    
    // Find property at current position
    const property = gameState.properties.find(p => p.position === currentPlayer.position);
    
    if (!property) {
      return;
    }
    
    const socket = getSocket();
    socket.emit('buyProperty', roomId, property.id);
  };
  
  const handleEndTurn = () => {
    if (!roomId || !gameState) {
      return;
    }
    
    const socket = getSocket();
    socket.emit('endTurn', roomId);
  };
  
  // Check if it's the current player's turn
  const isCurrentPlayerTurn = () => {
    if (!gameState || !currentPlayer) {
      return false;
    }
    
    return gameState.players[gameState.currentPlayerIndex]?.id === currentPlayer.id;
  };
  
  if (!roomId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">Room ID is missing. Please go back to the home page.</p>
        </div>
      </div>
    );
  }
  
  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Loading...</h1>
          <p className="text-gray-700">Connecting to game room...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <div className="max-w-7xl mx-auto">
        {!room.gameStarted ? (
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-blue-800 mb-6">Game Lobby</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Room ID: {room.id}</h2>
            <p className="text-gray-600 mb-6">Share this ID with friends to join your game</p>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Players:</h3>
              <ul className="space-y-2">
                {room.players.map((player) => (
                  <li key={player.id} className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 ${player.isAI ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-gray-700">{player.name} {player.id === room.host && '(Host)'}</span>
                    {player.isAI && <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">AI</span>}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex space-x-4">
              {isHost && (
                <>
                  <button
                    onClick={handleStartGame}
                    disabled={room.players.length < 2}
                    className={`px-4 py-2 rounded font-semibold ${
                      room.players.length < 2
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Start Game
                  </button>
                  
                  <button
                    onClick={handleAddAI}
                    disabled={room.players.length >= 8}
                    className={`px-4 py-2 rounded font-semibold ${
                      room.players.length >= 8
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    Add AI Player
                  </button>
                </>
              )}
            </div>
            
            {isHost && room.players.length < 2 && (
              <p className="mt-4 text-sm text-red-600">
                You need at least 2 players to start the game.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GameBoard gameState={gameState} />
            </div>
            
            <div className="space-y-6">
              <PlayerInfo 
                players={gameState?.players || []} 
                currentPlayerId={currentPlayer?.id || ''} 
                currentPlayerIndex={gameState?.currentPlayerIndex || 0}
              />
              
              <ActionPanel 
                gameState={gameState}
                isCurrentTurn={isCurrentPlayerTurn()}
                onRollDice={handleRollDice}
                onBuyProperty={handleBuyProperty}
                onEndTurn={handleEndTurn}
              />
              
              <GameLog actionLog={gameState?.actionLog || []} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
