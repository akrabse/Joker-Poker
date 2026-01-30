import { motion } from 'framer-motion'

export default function PokerTable({ game, user, socket }) {
  const currentPlayer = game.players.find((p) => p.userId.toString() === user._id)
  const isMyTurn = game.players[game.currentPlayerIndex]?.userId.toString() === user._id

  const handleFold = () => {
    socket.emit('fold', { roomId: game.roomId, userId: user._id })
  }

  const handleCall = () => {
    socket.emit('call', { roomId: game.roomId, userId: user._id })
  }

  const handleRaise = () => {
    const amount = prompt('Enter raise amount:')
    if (amount && !isNaN(amount)) {
      socket.emit('raise', { roomId: game.roomId, userId: user._id, amount: parseInt(amount) })
    }
  }

  const handleStartHand = () => {
    socket.emit('startHand', { roomId: game.roomId })
  }

  return (
    <div className="bg-poker-light rounded-2xl p-8">
      {/* Table */}
      <div className="poker-table relative h-96 flex items-center justify-center">
        {/* Pot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-poker-darker rounded-lg px-6 py-3">
            <p className="text-gray-400 text-sm">POT</p>
            <p className="text-poker-gold text-3xl font-bold">{game.pot}</p>
          </div>
        </div>

        {/* Community Cards */}
        {game.communityCards.length > 0 && (
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {game.communityCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ delay: i * 0.1 }}
                className="poker-card"
              >
                {card}
              </motion.div>
            ))}
          </div>
        )}

        {/* Players */}
        {game.players.map((player, index) => (
          <div
            key={index}
            className={`absolute player-slot ${
              game.currentPlayerIndex === index ? 'ring-2 ring-poker-gold' : ''
            }`}
            style={{
              top: `${30 + Math.sin((index / game.players.length) * 2 * Math.PI) * 35}%`,
              left: `${50 + Math.cos((index / game.players.length) * 2 * Math.PI) * 40}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <p className="text-white font-bold">{player.username}</p>
            <p className="text-poker-gold">{player.chips} chips</p>
            {player.bet > 0 && <p className="text-sm text-gray-400">Bet: {player.bet}</p>}
            {player.hasFolded && <p className="text-red-400 text-sm">Folded</p>}
          </div>
        ))}
      </div>

      {/* Player Cards */}
      {currentPlayer && currentPlayer.cards && currentPlayer.cards.length > 0 && (
        <div className="mt-4 flex justify-center gap-4">
          {currentPlayer.cards.map((card, i) => (
            <div key={i} className="poker-card text-2xl">
              {card}
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="mt-6 flex justify-center gap-4">
        {game.stage === 'waiting' && (
          <button onClick={handleStartHand} className="btn-primary">
            Start Hand
          </button>
        )}

        {isMyTurn && game.stage !== 'waiting' && (
          <>
            <button onClick={handleFold} className="btn-danger">
              Fold
            </button>
            <button onClick={handleCall} className="btn-secondary">
              {game.currentBet === 0 ? 'Check' : 'Call'}
            </button>
            <button onClick={handleRaise} className="btn-primary">
              Raise
            </button>
          </>
        )}
      </div>

      {/* Game Info */}
      <div className="mt-4 text-center text-gray-400">
        <p>Stage: {game.stage}</p>
        <p>Current Bet: {game.currentBet}</p>
      </div>
    </div>
  )
}
