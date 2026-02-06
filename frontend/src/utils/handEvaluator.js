import { Hand } from 'pokersolver';

export const evaluateHand = (cards, communityCards) => {
    if (!cards || cards.length !== 2) {
        console.warn("evaluateHand called with invalid cards:", cards);
        return null;
    }

    const safeCommunityCards = communityCards || [];
    const allCards = [...cards, ...safeCommunityCards];

    if (allCards.length < 2) return null;

    try {
        const hand = Hand.solve(allCards);
        return hand.descr || hand.name || "Unknown Hand";
    } catch (e) {
        console.error("Client hand evaluation error:", e, { cards, communityCards });
        return "Error Evaluating";
    }
};
