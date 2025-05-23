// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to create a game and add AI player
Cypress.Commands.add('setupGame', (playerName = 'Player 1') => {
  cy.visit('/');
  cy.get('input[placeholder="Your Name"]').type(playerName);
  cy.contains('Create Game').click();
  cy.contains('Add AI Player').click();
  cy.contains('Start Game').click();
});

// Custom command to roll dice and optionally end turn
Cypress.Commands.add('rollDice', (endTurn = false) => {
  cy.contains('Roll Dice').click();
  if (endTurn) {
    cy.contains('End Turn').click();
  }
});

// Custom command to buy property if available
Cypress.Commands.add('buyPropertyIfAvailable', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="buy-property-button"]').length > 0) {
      cy.get('[data-testid="buy-property-button"]').click();
    }
  });
});

// Custom command to get player money
Cypress.Commands.add('getPlayerMoney', (playerIndex = 0) => {
  return cy.get('[data-testid="player-money"]').eq(playerIndex).invoke('text').then((text) => {
    // Extract the number from the text (e.g., "$1500" -> 1500)
    const money = parseInt(text.replace(/[^0-9]/g, ''));
    return money;
  });
});
