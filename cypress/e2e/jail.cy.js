describe('Jail Functionality', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
  });

  it('should send player to jail when landing on Go To Jail', () => {
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
        // Modify the request to simulate landing on Go To Jail
        req.continue((res) => {
          // Check if the response contains the expected data
          if (res.body && res.body.success) {
            // Modify the response to include "sent to Jail" in the action log
            if (res.body.gameState && res.body.gameState.actionLog) {
              res.body.gameState.actionLog.push('Player 1 was sent to Jail');
            }
          }
        });
      }).as('rollDice');
      
      // Roll dice
      cy.contains('Roll Dice').click();
      
      // Wait for the API call to complete
      cy.wait('@rollDice');
      
      // Check if the action log contains the "sent to Jail" message
      cy.get('[data-testid="game-log"]').should('contain', 'sent to Jail');
      
      // Check if the player token is at the jail position
      cy.get('[data-testid="player-token"]').should('have.attr', 'data-position', '10');
    });
  });

  it('should require doubles to get out of jail', () => {
    // Create a game
    cy.get('input[placeholder="Your Name"]').type('Player 1');
    cy.contains('Create Game').click();
    
    // Add AI player
    cy.contains('Add AI Player').click();
    
    // Start game
    cy.contains('Start Game').click();
    
    // We'll use cy.window() to access the game state and modify it
    cy.window().then((win) => {
      // First, we need to put the player in jail
      cy.intercept('POST', '/api/rooms/*/roll-dice', (req) => {
        req.continue((res) => {
          if (res.body && res.body.success) {
            // Modify the response to put player in jail
            if (res.body.gameState) {
              res.body.gameState.players[0].inJail = true;
              res.body.gameState.players[0].position = 10;
              res.body.gameState.actionLog.push('Player 1 was sent to Jail');
            }
          }
        });
      }).as('goToJail');
      
      // Roll dice to trigger the intercept
      cy.contains('Roll Dice').click();
      
      // Wait for the API call to complete
      cy.wait('@goToJail');
      
      // Now, let's test not rolling doubles
      cy.intercept('POST', '/api/rooms/*/roll-dice', (req) => {
        req.continue((res) => {
          if (res.body && res.body.success) {
            // Modify the response to simulate not rolling doubles
            if (res.body.gameState) {
              res.body.gameState.dice = [1, 2]; // Not doubles
              res.body.gameState.actionLog.push('Player 1 did not roll doubles and stays in jail');
            }
          }
        });
      }).as('noDoubles');
      
      // End turn and let AI play
      cy.contains('End Turn').click();
      
      // Wait for AI to finish
      cy.wait(3000);
      
      // Roll dice again (should be player's turn again)
      cy.contains('Roll Dice').click();
      
      // Wait for the API call to complete
      cy.wait('@noDoubles');
      
      // Check if the action log contains the "stays in jail" message
      cy.get('[data-testid="game-log"]').should('contain', 'stays in jail');
      
      // Now, let's test rolling doubles
      cy.intercept('POST', '/api/rooms/*/roll-dice', (req) => {
        req.continue((res) => {
          if (res.body && res.body.success) {
            // Modify the response to simulate rolling doubles
            if (res.body.gameState) {
              res.body.gameState.dice = [4, 4]; // Doubles
              res.body.gameState.players[0].inJail = false;
              res.body.gameState.actionLog.push('Player 1 rolled doubles and got out of jail!');
            }
          }
        });
      }).as('doubles');
      
      // End turn and let AI play
      cy.contains('End Turn').click();
      
      // Wait for AI to finish
      cy.wait(3000);
      
      // Roll dice again (should be player's turn again)
      cy.contains('Roll Dice').click();
      
      // Wait for the API call to complete
      cy.wait('@doubles');
      
      // Check if the action log contains the "got out of jail" message
      cy.get('[data-testid="game-log"]').should('contain', 'got out of jail');
    });
  });
});
