'use client';

import { Player } from '@/types/game';

interface PlayerTokenProps {
  player: Player;
  position: number;
  isCurrentPlayer: boolean;
}

export default function PlayerToken({ player, position, isCurrentPlayer }: PlayerTokenProps) {
  // Calculate token position on the board
  const getTokenPosition = () => {
    // Board is 11x11 grid
    // Position 0 is GO (bottom right)
    // Position 10 is Jail (bottom left)
    // Position 20 is Free Parking (top left)
    // Position 30 is Go To Jail (top right)
    
    // Bottom row (right to left)
    if (position >= 0 && position <= 10) {
      const col = 11 - position;
      return { top: '92%', left: `${(col / 11) * 100}%` };
    }
    
    // Left column (bottom to top)
    if (position > 10 && position <= 20) {
      const row = 11 - (position - 10);
      return { top: `${(row / 11) * 100}%`, left: '8%' };
    }
    
    // Top row (left to right)
    if (position > 20 && position <= 30) {
      const col = position - 20;
      return { top: '8%', left: `${(col / 11) * 100}%` };
    }
    
    // Right column (top to bottom)
    if (position > 30 && position < 40) {
      const row = position - 30;
      return { top: `${(row / 11) * 100}%`, left: '92%' };
    }
    
    return { top: '50%', left: '50%' };
  };
  
  // Get token color based on player token
  const getTokenColor = () => {
    switch (player.token) {
      case 'car':
        return 'bg-red-500';
      case 'boot':
        return 'bg-blue-500';
      case 'hat':
        return 'bg-green-500';
      case 'ship':
        return 'bg-yellow-500';
      case 'dog':
        return 'bg-purple-500';
      case 'cat':
        return 'bg-pink-500';
      case 'iron':
        return 'bg-gray-500';
      case 'thimble':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Get token emoji based on player token
  const getTokenEmoji = () => {
    switch (player.token) {
      case 'car':
        return '🚗';
      case 'boot':
        return '👢';
      case 'hat':
        return '🎩';
      case 'ship':
        return '🚢';
      case 'dog':
        return '🐕';
      case 'cat':
        return '🐈';
      case 'iron':
        return '🔨';
      case 'thimble':
        return '🧵';
      default:
        return '🎲';
    }
  };
  
  const tokenPosition = getTokenPosition();
  
  return (
    <div
      className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-white font-bold transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
        isCurrentPlayer ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
      } ${getTokenColor()}`}
      style={{
        top: tokenPosition.top,
        left: tokenPosition.left,
        zIndex: isCurrentPlayer ? 20 : 10,
      }}
    >
      {getTokenEmoji()}
    </div>
  );
}
