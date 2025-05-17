'use client';

import { GameState } from '@/types/game';

interface BoardSpaceProps {
  space: any;
  position: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  gameState: GameState | null;
}

export default function BoardSpace({ space, position, gameState }: BoardSpaceProps) {
  if (!space) {
    return null;
  }
  
  // Get property owner if applicable
  const getOwner = () => {
    if (space.type !== 'property' || !gameState) {
      return null;
    }
    
    const property = gameState.properties.find(p => p.id === space.property.id);
    if (!property || !property.owner) {
      return null;
    }
    
    return gameState.players.find(p => p.id === property.owner);
  };
  
  const owner = getOwner();
  
  // Get property color
  const getPropertyColor = () => {
    if (space.type !== 'property') {
      return '';
    }
    
    switch (space.property.group) {
      case 'brown':
        return 'bg-amber-800';
      case 'light-blue':
        return 'bg-sky-300';
      case 'pink':
        return 'bg-pink-400';
      case 'orange':
        return 'bg-orange-500';
      case 'red':
        return 'bg-red-600';
      case 'yellow':
        return 'bg-yellow-400';
      case 'green':
        return 'bg-green-600';
      case 'dark-blue':
        return 'bg-blue-800';
      default:
        return '';
    }
  };
  
  // Get special space color
  const getSpecialSpaceColor = () => {
    switch (space.type) {
      case 'go':
        return 'bg-red-100';
      case 'community-chest':
        return 'bg-blue-100';
      case 'tax':
        return 'bg-gray-200';
      case 'chance':
        return 'bg-orange-100';
      case 'jail':
        return 'bg-gray-300';
      case 'free-parking':
        return 'bg-red-200';
      case 'go-to-jail':
        return 'bg-gray-300';
      default:
        return 'bg-white';
    }
  };
  
  // Get space classes based on position
  const getSpaceClasses = () => {
    const baseClasses = 'border border-gray-400 flex flex-col overflow-hidden';
    
    switch (position) {
      case 'top-left':
      case 'top-right':
      case 'bottom-left':
      case 'bottom-right':
        return `${baseClasses} col-span-1 row-span-1 w-full h-full`;
      case 'top':
      case 'bottom':
        return `${baseClasses} col-span-1 row-span-1 w-full h-full`;
      case 'left':
      case 'right':
        return `${baseClasses} w-full h-full`;
      default:
        return baseClasses;
    }
  };
  
  // Render property space
  const renderPropertySpace = () => {
    return (
      <div className={getSpaceClasses()}>
        <div className={`w-full h-5 ${getPropertyColor()}`}>
          {owner && (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
          )}
        </div>
        <div className="p-1 text-center flex-grow flex flex-col justify-between">
          <div className="text-[8px] font-semibold truncate">{space.property.name}</div>
          <div className="text-[8px]">${space.property.price}</div>
        </div>
      </div>
    );
  };
  
  // Render railroad space
  const renderRailroadSpace = () => {
    return (
      <div className={getSpaceClasses()}>
        <div className="p-1 text-center h-full flex flex-col justify-between">
          <div className="text-[8px] font-semibold">🚂</div>
          <div className="text-[8px] font-semibold truncate">{space.property.name}</div>
          <div className="text-[8px]">${space.property.price}</div>
        </div>
      </div>
    );
  };
  
  // Render utility space
  const renderUtilitySpace = () => {
    const icon = space.property.name.includes('Electric') ? '💡' : '💧';
    
    return (
      <div className={getSpaceClasses()}>
        <div className="p-1 text-center h-full flex flex-col justify-between">
          <div className="text-[8px] font-semibold">{icon}</div>
          <div className="text-[8px] font-semibold truncate">{space.property.name}</div>
          <div className="text-[8px]">${space.property.price}</div>
        </div>
      </div>
    );
  };
  
  // Render special space
  const renderSpecialSpace = () => {
    let icon = '';
    
    switch (space.type) {
      case 'go':
        icon = '🏁';
        break;
      case 'community-chest':
        icon = '📦';
        break;
      case 'tax':
        icon = '💰';
        break;
      case 'chance':
        icon = '❓';
        break;
      case 'jail':
        icon = '🔒';
        break;
      case 'free-parking':
        icon = '🅿️';
        break;
      case 'go-to-jail':
        icon = '👮';
        break;
      default:
        icon = '';
    }
    
    return (
      <div className={`${getSpaceClasses()} ${getSpecialSpaceColor()}`}>
        <div className="p-1 text-center h-full flex flex-col justify-center items-center">
          <div className="text-base">{icon}</div>
          <div className="text-[8px] font-semibold mt-1">{space.name}</div>
        </div>
      </div>
    );
  };
  
  // Render space based on type
  if (space.type === 'property') {
    if (space.property.group === 'railroad') {
      return renderRailroadSpace();
    } else if (space.property.group === 'utility') {
      return renderUtilitySpace();
    } else {
      return renderPropertySpace();
    }
  } else {
    return renderSpecialSpace();
  }
}
