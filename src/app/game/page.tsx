'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { initializeSSE, apiRequest, getClientId, on, off } from '@/lib/socket';
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

    // Initialize SSE connection
    const clientId = initializeSSE();

    // Define event handlers
    const handleRoomJoined = (data: { room: Room }) => {
      console.log('Room joined event received:', data);
      setRoom(data.room);

      // Check if current player is host
      setIsHost(data.room.host === clientId);

      // Find current player
      const player = data.room.players.find(p => p.id === clientId);
      if (player) {
        setCurrentPlayer(player);
      }
    };

    // Handle room updates (including game started status)
    const handleRoomUpdated = (data: { room: Room }) => {
      console.log('Room updated event received:', data);
      setRoom(data.room);

      // If the game has started, also update the game state
      if (data.room.gameStarted && data.room.gameState) {
        console.log('Game has started, updating game state:', data.room.gameState);
        setGameState(data.room.gameState);

        // Find current player
        const player = data.room.gameState.players.find(p => p.id === clientId);
        if (player) {
          setCurrentPlayer(player);
        }
      }
    };

    const handleGameStarted = (data: { gameState: GameState, room?: { id: string } }) => {
      console.log('Game started event received:', data);

      // Update game state
      setGameState(data.gameState);

      // Update room state to reflect that the game has started
      if (room) {
        const updatedRoom = { ...room, gameStarted: true, gameState: data.gameState };
        console.log('Updating room with game started:', updatedRoom);
        setRoom(updatedRoom);
      } else {
        console.warn('Room state is null when handling gameStarted event');

        // If room is null, we need to fetch it
        if (data.room?.id) {
          console.log('Fetching room data from gameStarted event');
          apiRequest<{ room: Room }>(`/api/rooms/${data.room.id}`, 'GET')
            .then(response => {
              console.log('Received room data after gameStarted event:', response);
              setRoom(response.room);
            })
            .catch(error => {
              console.error('Error fetching room data after gameStarted event:', error);
            });
        }
      }

      // Find current player
      const player = data.gameState.players.find(p => p.id === clientId);
      if (player) {
        console.log('Found current player in game state:', player);
        setCurrentPlayer(player);
      } else {
        console.warn('Current player not found in game state');
      }
    };

    const handleGameStateUpdated = (data: { gameState: GameState }) => {
      setGameState(data.gameState);

      // Find current player
      const player = data.gameState.players.find(p => p.id === clientId);
      if (player) {
        setCurrentPlayer(player);
      }
    };

    const handlePlayerMoved = (data: { playerId: string, position: number }) => {
      console.log('Player moved event received:', data);
      // This event is handled by the gameStateUpdated event, but we need to register a handler
      // to prevent the "No handlers registered for event type: playerMoved" error
    };

    // Register event handlers
    console.log('Registering event handlers');
    on('roomJoined', handleRoomJoined);
    on('roomUpdated', handleRoomUpdated);
    on('gameStarted', handleGameStarted);
    on('gameStateUpdated', handleGameStateUpdated);
    on('playerMoved', handlePlayerMoved);
    console.log('Event handlers registered');

    // Fetch initial room data
    const fetchRoomData = async () => {
      try {
        console.log('Fetching initial room data for roomId:', roomId);
        const response = await apiRequest<{ room: Room }>(`/api/rooms/${roomId}`, 'GET');
        console.log('Received room data:', response);

        // Update room state
        setRoom(response.room);

        // Check if current player is host
        setIsHost(response.room.host === clientId);

        // Find current player
        const player = response.room.players.find(p => p.id === clientId);
        if (player) {
          setCurrentPlayer(player);
        }

        // If game has already started, update game state
        if (response.room.gameStarted && response.room.gameState) {
          console.log('Game already started, updating game state:', response.room.gameState);
          setGameState(response.room.gameState);
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
      }
    };

    fetchRoomData();

    // Clean up event listeners
    return () => {
      off('roomJoined', handleRoomJoined);
      off('roomUpdated', handleRoomUpdated);
      off('gameStarted', handleGameStarted);
      off('gameStateUpdated', handleGameStateUpdated);
      off('playerMoved', handlePlayerMoved);
    };
  }, [roomId]);

  const handleStartGame = async () => {
    if (!roomId || !isHost) {
      console.log('Cannot start game: not host or no roomId');
      return;
    }

    try {
      console.log('Starting game for room:', roomId);
      const clientId = getClientId();
      console.log('Using clientId:', clientId);
      console.log('Sending start game request');
      const response = await apiRequest(`/api/rooms/${roomId}/start`, 'POST', { clientId });
      console.log('Start game response:', response);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleAddAI = async () => {
    if (!roomId || !isHost) {
      return;
    }

    try {
      const clientId = getClientId();
      await apiRequest(`/api/rooms/${roomId}/ai`, 'POST', { clientId });
    } catch (error) {
      console.error('Error adding AI player:', error);
    }
  };

  const handleRollDice = async () => {
    if (!roomId || !gameState) {
      return;
    }

    try {
      const clientId = getClientId();
      await apiRequest(`/api/rooms/${roomId}/roll-dice`, 'POST', { clientId });
    } catch (error) {
      console.error('Error rolling dice:', error);
    }
  };

  const handleBuyProperty = async () => {
    if (!roomId || !gameState || !currentPlayer) {
      console.log('Cannot buy property: missing roomId, gameState, or currentPlayer');
      return;
    }

    console.log('Attempting to buy property:');
    console.log('- Current player position:', currentPlayer.position);
    console.log('- Game state has properties:', gameState.properties.length);

    // Find property at current position
    const property = gameState.properties.find(p => p.position === currentPlayer.position);

    if (!property) {
      console.log('No property found at current position:', currentPlayer.position);
      console.log('Available properties:', gameState.properties.map(p => `${p.name} (position: ${p.position})`));

      // Show an alert to the user
      alert('Cannot buy property: No property at current position');
      return;
    }

    console.log('Found property to buy:', property.name);
    console.log('- Property ID:', property.id);
    console.log('- Property price:', property.price);
    console.log('- Player money:', currentPlayer.money);

    try {
      const clientId = getClientId();
      console.log('Sending buy property request with clientId:', clientId);
      const response = await apiRequest(`/api/rooms/${roomId}/buy-property`, 'POST', {
        clientId,
        propertyId: property.id
      });
      console.log('Buy property response:', response);
    } catch (error) {
      console.error('Error buying property:', error);
      alert(`Error buying property: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEndTurn = async () => {
    if (!roomId || !gameState) {
      return;
    }

    try {
      const clientId = getClientId();
      await apiRequest(`/api/rooms/${roomId}/end-turn`, 'POST', { clientId });
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  };

  // Function to manually trigger AI turn (for host only)
  const handleTriggerAITurn = async () => {
    if (!roomId || !gameState || !isHost) {
      return;
    }

    // Get current player
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    // Make sure it's an AI player
    if (!currentPlayer || !currentPlayer.isAI) {
      console.log('Current player is not AI, cannot trigger AI turn');
      return;
    }

    try {
      console.log(`Manually triggering AI turn for ${currentPlayer.name}`);
      const clientId = getClientId();
      await apiRequest(`/api/rooms/${roomId}/ai-turn`, 'POST', { clientId });
    } catch (error) {
      console.error('Error triggering AI turn:', error);
    }
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

  console.log('Rendering game component with state:', {
    roomId,
    room,
    gameState,
    currentPlayer,
    isHost,
    gameStarted: room?.gameStarted
  });

  // Debug player IDs to help identify duplicates
  if (room?.players) {
    console.log('Player IDs in room:', room.players.map(p => ({ id: p.id, name: p.name })));

    // Check for duplicate IDs
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
      console.error('Players with duplicate IDs:', room.players.filter(p => duplicates.includes(p.id)));
    }
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
                    <span className="text-gray-700">
                      {player.name}
                      {player.id === room.host ? ' (Host)' : ''}
                    </span>
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

                  <button
                    onClick={() => {
                      // Debug function to manually update the room state
                      console.log('Debug: Manually updating room state');
                      if (room) {
                        const debugGameState = {
                          id: 'debug-game-state',
                          players: room.players,
                          properties: [],
                          currentPlayerIndex: 0,
                          dice: [0, 0],
                          gamePhase: 'waiting',
                          winner: null,
                          actionLog: ['Debug game started']
                        };
                        const updatedRoom = { ...room, gameStarted: true, gameState: debugGameState };
                        console.log('Debug: Setting room to:', updatedRoom);
                        setRoom(updatedRoom);
                        console.log('Debug: Setting game state to:', debugGameState);
                        setGameState(debugGameState);
                      }
                    }}
                    className="px-4 py-2 rounded font-semibold bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Debug: Force Start
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

              {/* Add a button for host to manually trigger AI turn if needed */}
              {isHost && gameState && gameState.players[gameState.currentPlayerIndex]?.isAI && (
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Host Controls</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    If the AI player's turn is stuck, you can manually trigger it:
                  </p>
                  <button
                    onClick={handleTriggerAITurn}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
                  >
                    Force AI Turn
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
