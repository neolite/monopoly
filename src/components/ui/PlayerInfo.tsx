'use client';

import { Player } from '@/types/game';

interface PlayerInfoProps {
  players: Player[];
  currentPlayerId: string;
  currentPlayerIndex: number;
}

export default function PlayerInfo({ players, currentPlayerId, currentPlayerIndex }: PlayerInfoProps) {
  // Get token emoji based on player token
  const getTokenEmoji = (token: string) => {
    switch (token) {
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
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-blue-800 mb-4">Players</h2>
      
      <div className="space-y-4">
        {players.map((player, index) => (
          <div 
            key={player.id} 
            className={`p-3 rounded-lg ${
              player.id === currentPlayerId 
                ? 'bg-blue-100 border border-blue-300' 
                : 'bg-gray-50 border border-gray-200'
            } ${
              index === currentPlayerIndex
                ? 'ring-2 ring-yellow-400'
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="mr-2 text-lg">{getTokenEmoji(player.token)}</span>
                <span className="font-semibold">
                  {player.name}
                  {player.isAI && <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">AI</span>}
                </span>
              </div>
              <span className={`font-bold ${player.bankrupt ? 'text-red-600' : 'text-green-600'}`}>
                ${player.money}
              </span>
            </div>
            
            {player.properties.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Properties:</h3>
                <div className="flex flex-wrap gap-1">
                  {player.properties.map((property) => (
                    <div 
                      key={property.id}
                      className={`text-xs px-2 py-1 rounded text-white ${
                        property.mortgaged ? 'bg-gray-400' : getPropertyColor(property.group)
                      }`}
                      title={property.name}
                    >
                      {property.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {player.inJail && (
              <div className="mt-2 text-sm text-red-600 flex items-center">
                <span className="mr-1">🔒</span> In Jail
              </div>
            )}
            
            {player.bankrupt && (
              <div className="mt-2 text-sm text-red-600 font-bold">
                BANKRUPT
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to get property color
function getPropertyColor(group: string): string {
  switch (group) {
    case 'brown':
      return 'bg-amber-800';
    case 'light-blue':
      return 'bg-sky-500';
    case 'pink':
      return 'bg-pink-500';
    case 'orange':
      return 'bg-orange-500';
    case 'red':
      return 'bg-red-600';
    case 'yellow':
      return 'bg-yellow-500';
    case 'green':
      return 'bg-green-600';
    case 'dark-blue':
      return 'bg-blue-800';
    case 'railroad':
      return 'bg-gray-700';
    case 'utility':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
}
