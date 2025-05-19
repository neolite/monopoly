'use client';

import { useRef } from 'react';

interface GameLogProps {
  actionLog: string[];
}

export default function GameLog({ actionLog }: GameLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll functionality is disabled
  // If you want to manually scroll to the bottom, uncomment the useEffect below
  /*
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [actionLog]);
  */

  // Function to manually scroll to the bottom
  const scrollToBottom = () => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-800">Game Log</h2>

        {/* Only show scroll button if there are log entries */}
        {actionLog.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
          >
            Latest
          </button>
        )}
      </div>

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
