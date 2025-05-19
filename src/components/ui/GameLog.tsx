'use client';

import { useEffect, useRef } from 'react';

interface GameLogProps {
  actionLog: string[];
}

export default function GameLog({ actionLog }: GameLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when log updates
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [actionLog]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-blue-800 mb-4">Game Log</h2>

      <div className="h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
        {actionLog.length === 0 ? (
          <p className="text-gray-500 italic">No actions yet...</p>
        ) : (
          <ul className="space-y-2">
            {actionLog.map((action, index) => (
              <li key={index} className="text-sm text-gray-700 border-b border-gray-200 pb-1">
                {action}
              </li>
            ))}
            <div ref={logEndRef} />
          </ul>
        )}
      </div>
    </div>
  );
}
