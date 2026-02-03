// Card styles and decals configuration

export const DECALS = {
    default: 'text-2xl',
    'A': 'text-red-500 font-extrabold text-3xl', // Special style for Aces
    'K': 'text-yellow-500 font-bold',
    'Q': 'text-purple-400 font-bold',
    'J': 'text-blue-400 font-bold',
}

export const getCardStyle = (card) => {
    if (!card) return DECALS.default

    const rank = card.slice(0, -1) // 'A', '10', 'K' etc.
    // const suit = card.slice(-1)

    return DECALS[rank] || DECALS.default
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
