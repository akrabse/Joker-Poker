// Card styles and decals configuration

const getCardAsset = (filename) => `/assets/cards/${filename}`;

export const DECALS = {
    default: 'text-2xl',
    'A': 'text-red-500 font-extrabold text-3xl',
    'K': 'text-yellow-500 font-bold',
    'Q': 'text-purple-400 font-bold',
    'J': 'text-blue-400 font-bold',
}

export const getCardStyle = (card) => {
    if (!card) return DECALS.default

    const rank = card.slice(0, -1) // 'A', '10', 'K' etc.
    return DECALS[rank] || DECALS.default
}

// Function to get image path for a card rank
export const getCardImage = (cardCode) => {
    if (!cardCode || cardCode.length < 2) return null;

    const rankCode = cardCode.slice(0, -1);
    const suitCode = cardCode.slice(-1);

    // Map Suits
    const suitMap = {
        'h': 'Hearts',
        'd': 'Tiles',
        'c': 'Clovers',
        's': 'Pikes',
        'H': 'Hearts',
        'D': 'Tiles',
        'C': 'Clovers',
        'S': 'Pikes'
    };

    // Map Ranks
    // User requested: 1-10, A, Jack, Queen, King
    // Standard poker codes: 2-9, T, J, Q, K, A
    const rankMap = {
        'A': 'A',
        'K': 'King',
        'Q': 'Queen',
        'J': 'Jack',
        'T': '10',
        // 2-9 map to themselves
    };

    const suitName = suitMap[suitCode];
    // Use mapped rank or default to the number itself
    const rankName = rankMap[rankCode] || rankCode;

    if (suitName && rankName) {
        return getCardAsset(`${suitName}_${rankName}.png`);
    }

    return null;
}

export const CardBack = () => (
    <div className="w-[40px] h-[56px] bg-red-800 rounded border-2 border-white/20 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-20"
            style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent 0, transparent 4px, #000 4px, #000 8px)'
            }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/30 text-xs font-bold">Joker</span>
        </div>
    </div>
)
