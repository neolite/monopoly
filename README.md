# Monopoly Game

A web-based multiplayer version of the classic Monopoly board game where players can connect to a virtual room and play together.

## Project Overview

This project is a digital implementation of the Monopoly board game, featuring:

- Real-time multiplayer gameplay using WebSockets
- Room-based player connections
- Turn-based game mechanics
- Property acquisition and rent collection
- AI opponents for single-player mode

## Technology Stack

- **Frontend**: React with Next.js for server-side rendering and routing
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.IO for WebSocket connections
- **Styling**: Tailwind CSS for responsive design
- **Deployment**: Vercel for both frontend and backend

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation Steps

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/monopoly-game.git
   cd monopoly-game
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev:all
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Game Features

### Core Mechanics

- **Dice Rolling**: Players roll two dice to determine movement
- **Board Movement**: Players move around the board based on dice rolls
- **Property Acquisition**: Players can buy unowned properties they land on
- **Rent Collection**: Property owners collect rent from other players who land on their properties
- **Bankruptcy Conditions**: Players who cannot pay their debts go bankrupt and are eliminated

### Multiplayer Support

- Create and join game rooms
- Real-time game state synchronization
- Player turn management
- Game action log

### AI Opponent

- Basic AI logic that purchases affordable properties
- Automated turn management
- Simulates a real player for single-player mode

## Design and Development Process

The development process followed these key steps:

1. **Planning and Architecture**: Defined the game rules, user interface, and technical requirements
2. **Frontend Development**: Created the game board, player tokens, and UI components
3. **Backend Development**: Implemented the game logic, Socket.IO server, and multiplayer functionality
4. **AI Implementation**: Added basic AI logic for single-player mode
5. **Testing and Refinement**: Tested the game with multiple players and fixed issues

## Technical Trade-offs

- **Socket.IO vs. REST API**: Chose Socket.IO for real-time bidirectional communication, which is essential for a multiplayer game
- **Next.js vs. Create React App**: Selected Next.js for its server-side rendering capabilities and built-in routing
- **Tailwind CSS vs. Material UI**: Used Tailwind for its utility-first approach and customization flexibility
- **Monolithic vs. Microservices**: Opted for a monolithic approach for simplicity and ease of development

## Known Issues and Limitations

- Limited support for house and hotel building
- No trading functionality between players
- AI strategy is basic and doesn't implement advanced tactics
- No persistence of game state if the server restarts

## Future Improvements

- Implement property trading between players
- Add house and hotel building mechanics
- Enhance AI strategy with more advanced decision-making
- Add game state persistence using a database
- Implement chat functionality for player communication

## License

This project is licensed under the MIT License - see the LICENSE file for details.
