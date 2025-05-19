# Monopoly Game

A web-based multiplayer version of the classic Monopoly board game where players can connect to a virtual room and play together. This digital implementation follows the standard Monopoly mechanics and includes an AI bot for single-player mode.

## Project Overview

This project is a digital implementation of the Monopoly board game, featuring:

- Real-time multiplayer gameplay using Server-Sent Events (SSE)
- Room-based player connections
- Turn-based game mechanics with dice rolling
- Property acquisition and rent collection
- AI opponents for single-player mode
- Responsive design that works on desktop and mobile devices

## Technology Stack

- **Frontend**: React with Next.js for server-side rendering and routing
- **Backend**: Node.js with Express
- **Real-time Communication**: Server-Sent Events (SSE) for efficient one-way real-time updates
- **Data Storage**: Redis for game state persistence
- **Styling**: Tailwind CSS for responsive design
- **Deployment**: Netlify for frontend and backend deployment

### Why This Tech Stack?

- **Next.js**: Chosen for its server-side rendering capabilities, built-in routing, and excellent developer experience. It provides a solid foundation for building complex web applications with React.

- **Server-Sent Events (SSE)**: Selected over WebSockets for their simplicity and efficiency for this use case. Since most game updates flow from server to client with minimal client-to-server communication, SSE provides a more lightweight solution than bidirectional WebSockets.

- **Redis**: Used for its speed and in-memory data structure capabilities, making it perfect for storing game state that needs to be accessed quickly. Redis pub/sub features also complement the SSE architecture.

- **Tailwind CSS**: Provides a utility-first approach that allows for rapid UI development without leaving HTML. This made it easier to create a consistent and responsive design across the application.

- **Express**: A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications, making it ideal for our game server.

## Installation and Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Redis server (local or remote)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/monopoly-game.git
   cd monopoly-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3002
   REDIS_URL=redis://localhost:6379
   ```

4. Start the development server:
   ```bash
   npm run dev:all
   ```
   This command starts both the Next.js frontend and the Express backend server.

5. Open your browser and navigate to `http://localhost:3000`

### Deployment to Netlify

1. Create a new site on Netlify and connect it to your GitHub repository.

2. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`

3. Set up environment variables in Netlify:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed API
   - `REDIS_URL`: Connection string for your Redis instance (e.g., from Upstash)

4. Deploy the API using Netlify Functions:
   - Create a `netlify.toml` file in the root directory:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
     functions = "netlify/functions"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/api/:splat"
     status = 200
   ```

5. Create a serverless function for the API in `netlify/functions/api.js`

## Game Features

### Core Mechanics

- **Dice Rolling**: Players roll two dice to determine movement
- **Board Movement**: Players move around the board based on dice rolls
- **Property Acquisition**: Players can buy unowned properties they land on
- **Rent Collection**: Property owners collect rent from other players who land on their properties
- **Bankruptcy Conditions**: Players who cannot pay their debts go bankrupt and are eliminated
- **Passing GO**: Players collect $200 when passing or landing on the GO space
- **Jail System**: Players can be sent to jail and must roll doubles or pay to get out

### Multiplayer Support

- Create and join game rooms with unique room IDs
- Real-time game state synchronization using Server-Sent Events
- Player turn management with visual indicators
- Comprehensive game action log showing all player activities
- Support for 2-8 players in a single game

### AI Opponent

- Smart AI logic that makes decisions based on current game state
- Property purchase strategy based on available funds and property value
- Automated turn management with realistic delays to simulate thinking
- Different difficulty levels with varying strategies (planned feature)
- Ability to add multiple AI players to a game

## Design and Development Process

The development process followed these key steps:

1. **Research and Planning**:
   - Studied the original Monopoly rules and mechanics
   - Researched existing digital implementations for inspiration
   - Defined the core features and technical requirements
   - Created wireframes and mockups for the UI

2. **Architecture Design**:
   - Designed the client-server architecture using Next.js and Express
   - Chose Server-Sent Events for real-time updates over WebSockets for efficiency
   - Selected Redis for game state persistence due to its speed and simplicity
   - Planned the data models for game state, players, and properties

3. **Frontend Development**:
   - Built responsive UI components using React and Tailwind CSS
   - Created the game board with property spaces and player tokens
   - Implemented player information panels and action controls
   - Designed the game log interface for tracking game events

4. **Backend Development**:
   - Developed the Express server with SSE endpoints
   - Implemented the core game logic for movement, property management, and turn handling
   - Created Redis integration for data persistence
   - Built API endpoints for game actions (roll dice, buy property, end turn)

5. **AI Implementation**:
   - Developed a rule-based AI system for computer players
   - Implemented property purchase decision-making based on available funds and property value
   - Created automated turn handling for AI players
   - Added realistic delays to simulate human-like thinking

6. **Testing and Refinement**:
   - Conducted extensive testing with multiple players
   - Fixed bugs and edge cases in game logic
   - Optimized performance for smoother gameplay
   - Refined the UI based on user feedback

7. **Deployment**:
   - Set up Netlify deployment for the frontend
   - Configured Redis for production use
   - Created documentation for installation and usage

## Technical Trade-offs and Design Decisions

During development, several important technical decisions and trade-offs were made:

- **Server-Sent Events vs. WebSockets**: We chose SSE over WebSockets for real-time communication. While WebSockets provide bidirectional communication, SSE is more lightweight and efficient for our use case where most updates flow from server to client. This resulted in better performance and simpler implementation.

- **Redis vs. Traditional Database**: We selected Redis as our data store instead of a traditional SQL or NoSQL database. Redis's in-memory nature provides the speed necessary for real-time game state updates, and its simple key-value structure matches our data model well. The trade-off is less complex querying capabilities, but this wasn't needed for our application.

- **Next.js vs. Create React App**: We chose Next.js over Create React App for its server-side rendering capabilities, built-in routing, and better performance optimization. This decision improved initial load times and SEO potential, though it added some complexity to the development process.

- **Tailwind CSS vs. Component Libraries**: We opted for Tailwind CSS instead of component libraries like Material UI or Bootstrap. This gave us more design flexibility and smaller bundle sizes, at the cost of having to build UI components from scratch.

- **Monolithic vs. Microservices**: We implemented a monolithic architecture rather than microservices for simplicity and ease of development. This made the codebase easier to manage for a small team but may limit scalability in the future.

- **Game UI Layout**: We designed the UI with the game log on the left side and game board with player information on the right. This layout provides better visibility of game events while playing, though it required careful responsive design considerations.

## Known Issues and Limitations

- **Limited Property Development**: The current implementation doesn't fully support house and hotel building mechanics.
- **No Trading System**: There's no functionality for players to trade properties with each other.
- **Basic AI Strategy**: The AI opponents follow simple rules and don't implement advanced tactics or adapt to game situations.
- **Auction Mechanics**: The game doesn't include property auctions when a player declines to purchase a property.
- **Chance and Community Chest**: Limited implementation of special card effects.
- **Mobile Experience**: While responsive, the game board can be difficult to navigate on very small screens.
- **Browser Compatibility**: Optimized for modern browsers; may have issues with older browsers.
- **Network Dependency**: Requires a stable internet connection; no offline mode available.

## Future Improvements

- **Property Trading System**: Implement a comprehensive trading system allowing players to exchange properties and money.
- **House and Hotel Building**: Add full support for property development with houses and hotels.
- **Enhanced AI Strategy**: Develop more sophisticated AI with different difficulty levels and adaptive strategies.
- **Auction System**: Implement property auctions when players decline to purchase properties they land on.
- **Full Chance and Community Chest**: Complete the implementation of all special card effects.
- **Chat System**: Add in-game chat functionality for player communication.
- **Game Statistics**: Track and display game statistics and player history.
- **Customizable Rules**: Allow players to customize game rules (starting money, free parking rules, etc.).
- **Mobile App**: Develop native mobile applications for iOS and Android.
- **Offline Mode**: Add support for offline play against AI opponents.
- **Internationalization**: Add support for multiple languages.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
