const { Hand } = require('pokersolver');

// Create and shuffle a deck of cards
const createDeck = () => {
  const suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(rank + suit);
    }
  }
  
  return shuffleDeck(deck);
};

// Fisher-Yates shuffle algorithm
const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Deal cards to players
const dealCards = (deck, numPlayers) => {
  const playerHands = [];
  let deckIndex = 0;
  
  // Deal 2 cards to each player
  for (let i = 0; i < numPlayers; i++) {
    playerHands.push([deck[deckIndex++], deck[deckIndex++]]);
  }
  
  return {
    playerHands,
    remainingDeck: deck.slice(deckIndex),
  };
};

// Deal community cards
const dealCommunityCards = (deck, currentCards, numCards) => {
  const newCards = [];
  for (let i = 0; i < numCards; i++) {
    if (deck.length > 0) {
      newCards.push(deck.shift());
    }
  }
  return [...currentCards, ...newCards];
};

// Evaluate poker hand
const evaluateHand = (playerCards, communityCards) => {
  try {
    const allCards = [...playerCards, ...communityCards];
    const hand = Hand.solve(allCards);
    return {
      name: hand.name,
      descr: hand.descr,
      rank: hand.rank,
    };
  } catch (error) {
    console.error('Error evaluating hand:', error);
    return {
      name: 'High Card',
      descr: 'High Card',
      rank: 0,
    };
  }
};

// Find winner(s) among players
const findWinners = (players, communityCards) => {
  const activePlayers = players.filter((p) => !p.hasFolded);
  
  if (activePlayers.length === 0) {
    return [];
  }
  
  if (activePlayers.length === 1) {
    return [
      {
        player: activePlayers[0],
        hand: { name: 'Winner by fold', descr: 'All others folded' },
      },
    ];
  }

  // Evaluate all hands
  const hands = activePlayers.map((player) => {
    const allCards = [...player.cards, ...communityCards];
    const hand = Hand.solve(allCards);
    return {
      player,
      hand,
    };
  });

  // Find winner(s)
  const winners = Hand.winners(hands.map((h) => h.hand));
  
  return hands.filter((h) => winners.includes(h.hand));
};

// Calculate pot distribution for side pots
const calculatePotDistribution = (players, pot) => {
  const activePlayers = players.filter((p) => !p.hasFolded);
  
  if (activePlayers.length === 0) {
    return [];
  }

  // Simple case: split pot equally among winners
  // For production, implement proper side pot calculation
  return activePlayers.map((player) => ({
    playerId: player.userId,
    username: player.username,
    amount: Math.floor(pot / activePlayers.length),
  }));
};

// Format card for display (e.g., "As" -> "A♠")
const formatCard = (card) => {
  if (!card || card.length !== 2) return card;
  
  const rank = card[0];
  const suit = card[1];
  
  const suitSymbols = {
    h: '♥',
    d: '♦',
    c: '♣',
    s: '♠',
  };
  
  return rank + (suitSymbols[suit] || suit);
};

// Validate bet amount
const validateBet = (player, amount, currentBet, gameStage) => {
  // Check if player has enough chips
  if (amount > player.chips) {
    return { valid: false, error: 'Not enough chips' };
  }

  // Check minimum bet (must at least match current bet)
  const callAmount = currentBet - player.bet;
  if (amount < callAmount && amount < player.chips) {
    return { valid: false, error: 'Bet must at least match current bet' };
  }

  // Check minimum raise (must be at least double the current bet)
  if (amount > callAmount) {
    const raiseAmount = amount - callAmount;
    if (raiseAmount < currentBet && amount < player.chips) {
      return { valid: false, error: 'Raise must be at least the current bet amount' };
    }
  }

  return { valid: true };
};

// Generate unique room code
const generateRoomCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

module.exports = {
  createDeck,
  shuffleDeck,
  dealCards,
  dealCommunityCards,
  evaluateHand,
  findWinners,
  calculatePotDistribution,
  formatCard,
  validateBet,
  generateRoomCode,
};
