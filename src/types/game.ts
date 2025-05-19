// Game types for Monopoly

export type PlayerToken = 'car' | 'boot' | 'hat' | 'ship' | 'dog' | 'cat' | 'iron' | 'thimble';

export interface Player {
  id: string;
  name: string;
  token: PlayerToken;
  position: number;
  money: number;
  properties: Property[];
  inJail: boolean;
  bankrupt: boolean;
  isAI: boolean;
}

export interface Property {
  id: number;
  name: string;
  price: number;
  rent: number[];
  group: PropertyGroup;
  position: number;
  owner: string | null;
  houses: number;
  mortgaged: boolean;
}

export type PropertyGroup =
  | 'brown'
  | 'light-blue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'dark-blue'
  | 'railroad'
  | 'utility';

export interface GameState {
  id: string;
  players: Player[];
  properties: Property[];
  currentPlayerIndex: number;
  dice: [number, number];
  gamePhase: GamePhase;
  winner: string | null;
  actionLog: string[];
}

export type GamePhase =
  | 'waiting'
  | 'rolling'
  | 'moving'
  | 'rolled'
  | 'property-decision'
  | 'paying-rent'
  | 'end-turn'
  | 'game-over';

export interface Room {
  id: string;
  name: string;
  host: string;
  players: Player[];
  gameStarted: boolean;
  gameState: GameState | null;
}

export interface Card {
  id: number;
  type: 'chance' | 'community-chest';
  text: string;
  action: CardAction;
}

export type CardAction =
  | { type: 'move', destination: number }
  | { type: 'pay', amount: number }
  | { type: 'collect', amount: number }
  | { type: 'repair', houseAmount: number, hotelAmount: number }
  | { type: 'jail', enter: boolean }
  | { type: 'move-relative', steps: number };
