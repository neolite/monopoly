'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initializeSSE, apiRequest, getClientId } from '@/lib/socket';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize SSE connection
    initializeSSE();

    return () => {
      // No need to clean up, will be handled by the module
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      const clientId = getClientId();
      const response = await apiRequest<{ roomId: string }>('/api/rooms', 'POST', {
        playerName,
        clientId
      });

      router.push(`/game?roomId=${response.roomId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    try {
      const clientId = getClientId();
      await apiRequest(`/api/rooms/${roomId}/join`, 'POST', {
        playerName,
        clientId
      });

      router.push(`/game?roomId=${roomId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">Monopoly Game</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="playerName" className="block text-gray-700 text-sm font-bold mb-2">
            Your Name
          </label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your name"
          />
        </div>

        <div className="flex flex-col space-y-4 mb-6">
          <button
            onClick={handleCreateRoom}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
          >
            Create New Game
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="roomId" className="block text-gray-700 text-sm font-bold mb-2">
              Room ID
            </label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter room ID"
            />
          </div>

          <button
            onClick={handleJoinRoom}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
          >
            Join Existing Game
          </button>
        </div>

        <div className="text-center">
          <Link href="/rules" className="text-blue-600 hover:text-blue-800 underline">
            Game Rules
          </Link>
        </div>
      </div>
    </div>
  );
}
