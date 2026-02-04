import { Hand } from 'pokersolver';

export const evaluateHand = (cards, communityCards) => {
    if (!cards || cards.length !== 2) return null;
    // If no community cards, we can't solve significantly, but we can solve the 2 cards?
    // Usually poker solver needs 5+ cards for a proper hand, or it evaluates best 5 of X.
    // If preflop, just high card?
    const safeCommunityCards = communityCards || [];
    const allCards = [...cards, ...safeCommunityCards];

    if (allCards.length === 0) return null;

    try {
        const hand = Hand.solve(allCards);
        return hand.name; // "Pair", "Flush", etc.
    } catch (e) {
        console.error("Hand solve error", e);
        return "";
    }
};
