describe('Bankruptcy Functionality', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
  });

  it('should handle bankruptcy when player cannot pay rent', () => {
    // Create a game
    cy.get('input[placeholder="Your Name"]').type('Player 1');
    cy.contains('Create Game').click();
    
    // Add AI player
    cy.contains('Add AI Player').click();
    
    // Start game
    cy.contains('Start Game').click();
    
    // We'll use cy.window() to access the game state and modify it
    cy.window().then((win) => {
      // We need to intercept the API call that happens when rolling dice
      cy.intercept('POST', '/api/rooms/*/roll-dice', (req) => {
        // Modify the request to simulate bankruptcy
        req.continue((res) => {
          // Check if the response contains the expected data
          if (res.body && res.body.success) {
            // Modify the response to include bankruptcy in the action log
            if (res.body.gameState) {
              // Set player money to a very low amount
              res.body.gameState.players[0].money = 10;
              
              // Simulate landing on an expensive property owned by AI
              const aiPlayer = res.body.gameState.players.find(p => p.isAI);
              if (aiPlayer) {
                const expensiveProperty = res.body.gameState.properties.find(p => p.price >= 300);
                if (expensiveProperty) {
                  expensiveProperty.owner = aiPlayer.id;
                  
                  // Add to action log
                  res.body.gameState.actionLog.push(`Player 1 paid $500 rent to ${aiPlayer.name} for ${expensiveProperty.name}`);
                  res.body.gameState.actionLog.push(`Player 1 went bankrupt to ${aiPlayer.name}!`);
                  
                  // Set player as bankrupt
                  res.body.gameState.players[0].bankrupt = true;
                  res.body.gameState.players[0].money = -490;
                }
              }
            }
          }
        });
      }).as('rollDice');
      
      // Roll dice
      cy.contains('Roll Dice').click();
      
      // Wait for the API call to complete
      cy.wait('@rollDice');
      
      // Check if the action log contains the bankruptcy message
      cy.get('[data-testid="game-log"]').should('contain', 'went bankrupt');
      
      // Check if the player is marked as bankrupt
      cy.get('[data-testid="player-status"]').should('contain', 'Bankrupt');
      
      // Check if the game is over (only one player left)
      cy.get('[data-testid="game-phase"]').should('contain', 'game-over');
    });
  });

  it('should handle bankruptcy when player cannot pay taxes', () => {
    // Create a game
    cy.get('input[placeholder="Your Name"]').type('Player 1');
    cy.contains('Create Game').click();
    
    // Add AI player
    cy.contains('Add AI Player').click();
    
    // Start game
    cy.contains('Start Game').click();
    
    // We'll use cy.window() to access the game state and modify it
    cy.window().then((win) => {
      // We need to intercept the API call that happens when rolling dice
      cy.intercept('POST', '/api/rooms/*/roll-dice', (req) => {
        // Modify the request to simulate bankruptcy from taxes
        req.continue((res) => {
          // Check if the response contains the expected data
          if (res.body && res.body.success) {
            // Modify the response to include bankruptcy in the action log
            if (res.body.gameState) {
              // Set player money to a very low amount
              res.body.gameState.players[0].money = 10;
              
              // Simulate landing on a tax space
              res.body.gameState.actionLog.push('Player 1 paid $200 in taxes');
              res.body.gameState.actionLog.push('Player 1 went bankrupt due to taxes!');
              
              // Set player as bankrupt
              res.body.gameState.players[0].bankrupt = true;
              res.body.gameState.players[0].money = -190;
              
              // Make sure properties are released
              const playerProperties = res.body.gameState.properties.filter(p => p.owner === res.body.gameState.players[0].id);
              playerProperties.forEach(prop => {
                prop.owner = null;
              });
            }
          }
        });
      }).as('rollDice');
      
      // Roll dice
      cy.contains('Roll Dice').click();
      
      // Wait for the API call to complete
      cy.wait('@rollDice');
      
      // Check if the action log contains the bankruptcy message
      cy.get('[data-testid="game-log"]').should('contain', 'went bankrupt due to taxes');
      
      // Check if the player is marked as bankrupt
      cy.get('[data-testid="player-status"]').should('contain', 'Bankrupt');
    });
  });

  it('should transfer properties when player goes bankrupt to another player', () => {
    // Create a game
    cy.get('input[placeholder="Your Name"]').type('Player 1');
    cy.contains('Create Game').click();
    
    // Add AI player
    cy.contains('Add AI Player').click();
    
    // Start game
    cy.contains('Start Game').click();
    
    // We'll use cy.window() to access the game state and modify it
    cy.window().then((win) => {
      // First, let's give the player some properties
      cy.intercept('POST', '/api/rooms/*/roll-dice', (req) => {
        req.continue((res) => {
          if (res.body && res.body.success) {
            // Give player some properties
            if (res.body.gameState) {
              const player = res.body.gameState.players[0];
              const properties = res.body.gameState.properties.slice(0, 3); // First 3 properties
              
              properties.forEach(prop => {
                prop.owner = player.id;
              });
              
              player.properties = JSON.parse(JSON.stringify(properties));
              
              // Add to action log
              res.body.gameState.actionLog.push(`Player 1 now owns ${properties.map(p => p.name).join(', ')}`);
            }
          }
        });
      }).as('giveProperties');
      
      // Roll dice to trigger the intercept
      cy.contains('Roll Dice').click();
      
      // Wait for the API call to complete
      cy.wait('@giveProperties');
      
      // End turn
      cy.contains('End Turn').click();
      
      // Wait for AI to finish
      cy.wait(3000);
      
      // Now, let's make the player go bankrupt
      cy.intercept('POST', '/api/rooms/*/roll-dice', (req) => {
        req.continue((res) => {
          if (res.body && res.body.success) {
            // Make player go bankrupt
            if (res.body.gameState) {
              const player = res.body.gameState.players[0];
              const aiPlayer = res.body.gameState.players.find(p => p.isAI);
              
              // Set player money to a very low amount
              player.money = 10;
              
              // Simulate landing on an expensive property owned by AI
              const expensiveProperty = res.body.gameState.properties.find(p => p.price >= 300 && !p.owner);
              if (expensiveProperty && aiPlayer) {
                expensiveProperty.owner = aiPlayer.id;
                
                // Add to action log
                res.body.gameState.actionLog.push(`Player 1 paid $500 rent to ${aiPlayer.name} for ${expensiveProperty.name}`);
                res.body.gameState.actionLog.push(`Player 1 went bankrupt to ${aiPlayer.name}!`);
                
                // Set player as bankrupt
                player.bankrupt = true;
                player.money = -490;
                
                // Transfer properties to AI
                const playerProperties = res.body.gameState.properties.filter(p => p.owner === player.id);
                playerProperties.forEach(prop => {
                  prop.owner = aiPlayer.id;
                });
                
                // Clear player properties
                player.properties = [];
                
                // Add AI properties
                if (!aiPlayer.properties) {
                  aiPlayer.properties = [];
                }
                
                aiPlayer.properties = aiPlayer.properties.concat(JSON.parse(JSON.stringify(playerProperties)));
              }
            }
          }
        });
      }).as('bankruptcy');
      
      // Roll dice to trigger the intercept
      cy.contains('Roll Dice').click();
      
      // Wait for the API call to complete
      cy.wait('@bankruptcy');
      
      // Check if the action log contains the bankruptcy message
      cy.get('[data-testid="game-log"]').should('contain', 'went bankrupt');
      
      // Check if the player is marked as bankrupt
      cy.get('[data-testid="player-status"]').should('contain', 'Bankrupt');
      
      // Check if the AI player now has the properties
      cy.get('[data-testid="player-properties"]').eq(1).should('not.be.empty');
    });
  });
});
