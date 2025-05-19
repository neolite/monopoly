'use client';

import { useState, useEffect } from 'react';
import { GameState, Player } from '@/types/game';
import { getAllBoardSpaces } from '@/lib/game/board';
import BoardSpace from './BoardSpace';
import PlayerToken from './PlayerToken';

interface GameBoardProps {
  gameState: GameState | null;
}

export default function GameBoard({ gameState }: GameBoardProps) {
  const [boardSpaces, setBoardSpaces] = useState<any[]>([]);

  useEffect(() => {
    // Get all board spaces
    const spaces = getAllBoardSpaces();
    setBoardSpaces(spaces);
  }, []);

  if (!gameState) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Waiting for game to start...</h2>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg h-full">
      <div className="relative aspect-square w-full max-w-2xl mx-auto bg-blue-50 border-2 border-blue-800 rounded-lg overflow-hidden">
        {/* Board grid */}
        <div className="absolute inset-0 grid grid-cols-11 grid-rows-11">
          {/* Bottom row (left to right) */}
          <BoardSpace
            space={boardSpaces[20]}
            position="bottom-left"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[21]}
            position="bottom"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[22]}
            position="bottom"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[23]}
            position="bottom"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[24]}
            position="bottom"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[25]}
            position="bottom"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[26]}
            position="bottom"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[27]}
            position="bottom"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[28]}
            position="bottom"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[29]}
            position="bottom"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[30]}
            position="bottom-right"
            gameState={gameState}
          />

          {/* Right column (bottom to top) */}
          <div className="col-start-11 row-start-10">
            <BoardSpace
              space={boardSpaces[31]}
              position="right"
              gameState={gameState}
            />
          </div>
          <div className="col-start-11 row-start-9">
            <BoardSpace
              space={boardSpaces[32]}
              position="right"
              gameState={gameState}
            />
          </div>
          <div className="col-start-11 row-start-8">
            <BoardSpace
              space={boardSpaces[33]}
              position="right"
              gameState={gameState}
            />
          </div>
          <div className="col-start-11 row-start-7">
            <BoardSpace
              space={boardSpaces[34]}
              position="right"
              gameState={gameState}
            />
          </div>
          <div className="col-start-11 row-start-6">
            <BoardSpace
              space={boardSpaces[35]}
              position="right"
              gameState={gameState}
            />
          </div>
          <div className="col-start-11 row-start-5">
            <BoardSpace
              space={boardSpaces[36]}
              position="right"
              gameState={gameState}
            />
          </div>
          <div className="col-start-11 row-start-4">
            <BoardSpace
              space={boardSpaces[37]}
              position="right"
              gameState={gameState}
            />
          </div>
          <div className="col-start-11 row-start-3">
            <BoardSpace
              space={boardSpaces[38]}
              position="right"
              gameState={gameState}
            />
          </div>
          <div className="col-start-11 row-start-2">
            <BoardSpace
              space={boardSpaces[39]}
              position="right"
              gameState={gameState}
            />
          </div>

          {/* Top row (right to left) */}
          <BoardSpace
            space={boardSpaces[10]}
            position="top-right"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[11]}
            position="top"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[12]}
            position="top"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[13]}
            position="top"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[14]}
            position="top"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[15]}
            position="top"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[16]}
            position="top"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[17]}
            position="top"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[18]}
            position="top"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[19]}
            position="top"
            gameState={gameState}
          />
          <BoardSpace
            space={boardSpaces[0]}
            position="top-left"
            gameState={gameState}
          />

          {/* Left column (top to bottom) */}
          <div className="col-start-1 row-start-2">
            <BoardSpace
              space={boardSpaces[1]}
              position="left"
              gameState={gameState}
            />
          </div>
          <div className="col-start-1 row-start-3">
            <BoardSpace
              space={boardSpaces[2]}
              position="left"
              gameState={gameState}
            />
          </div>
          <div className="col-start-1 row-start-4">
            <BoardSpace
              space={boardSpaces[3]}
              position="left"
              gameState={gameState}
            />
          </div>
          <div className="col-start-1 row-start-5">
            <BoardSpace
              space={boardSpaces[4]}
              position="left"
              gameState={gameState}
            />
          </div>
          <div className="col-start-1 row-start-6">
            <BoardSpace
              space={boardSpaces[5]}
              position="left"
              gameState={gameState}
            />
          </div>
          <div className="col-start-1 row-start-7">
            <BoardSpace
              space={boardSpaces[6]}
              position="left"
              gameState={gameState}
            />
          </div>
          <div className="col-start-1 row-start-8">
            <BoardSpace
              space={boardSpaces[7]}
              position="left"
              gameState={gameState}
            />
          </div>
          <div className="col-start-1 row-start-9">
            <BoardSpace
              space={boardSpaces[8]}
              position="left"
              gameState={gameState}
            />
          </div>
          <div className="col-start-1 row-start-10">
            <BoardSpace
              space={boardSpaces[9]}
              position="left"
              gameState={gameState}
            />
          </div>

          {/* Center area */}
          <div className="col-start-2 col-span-9 row-start-2 row-span-9 flex items-center justify-center">
            <div className="text-4xl font-bold text-blue-800 rotate-[-45deg]">MONOPOLY</div>
          </div>
        </div>

        {/* Player tokens */}
        {gameState.players.map((player) => (
          <PlayerToken
            key={player.id}
            player={player}
            position={player.position}
            isCurrentPlayer={gameState.players[gameState.currentPlayerIndex]?.id === player.id}
          />
        ))}

        {/* Dice display */}
        {gameState.dice[0] > 0 && (
          <div className="absolute top-4 right-4 flex space-x-2">
            <div className="w-10 h-10 bg-white rounded-lg border-2 border-gray-800 flex items-center justify-center text-2xl font-bold">
              {gameState.dice[0]}
            </div>
            <div className="w-10 h-10 bg-white rounded-lg border-2 border-gray-800 flex items-center justify-center text-2xl font-bold">
              {gameState.dice[1]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
