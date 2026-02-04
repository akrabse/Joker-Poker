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
export const getCardImage = (rank) => {
    const faces = ['A', 'K', 'Q', 'J'];
    if (faces.includes(rank)) {
        return getCardAsset(`${rank}.png`);
    }
    // Also support custom numeric/suit decals if user desires:
    // return getCardAsset(`${rank}.png`); 
    return null;
}

export const CardBack = () => (
    <div className="w-[40px] h-[56px] bg-red-800 rounded border-2 border-white/20 relative overflow-hidden shadow-md">
        {/* Try to load back.png, fallback to CSS pattern */}
        <div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getCardAsset('back.png')})` }}>

            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent 0, transparent 4px, #000 4px, #000 8px)'
                }}
            />
        </div>

        {/* Optional Logo overlay if back.png fails or is transparent */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white/30 text-xs font-bold mix-blend-overlay">Joker</span>
        </div>
    </div>
)
