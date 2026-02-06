import { motion } from 'framer-motion'
import { getCardStyle, CardBack, getCardImage } from '../utils/cardStyles'
import { evaluateHand } from '../utils/handEvaluator'

export default function PokerTable({ game, user, socket }) {
  // Resolve stable user id (support user._id or user.id)
  const resolvedUserId = String(user._id || user.id)

  const currentPlayer = game.players.find((p) => p.userId?.toString() === resolvedUserId)
  const isMyTurn = game.players[game.currentPlayerIndex]?.userId?.toString() === resolvedUserId

  // Count active players (those with chips > 0 and not sitting out)
  const activePlayers = game.players.filter((p) => !p.isSittingOut && p.chips > 0)
  const canStartGame = activePlayers.length >= game.minPlayers

  const handleFold = () => {
    socket.emit('fold', { roomId: game.roomId, userId: resolvedUserId })
  }

  const handleCall = () => {
    socket.emit('call', { roomId: game.roomId, userId: resolvedUserId })
  }

  const handleRaise = () => {
    const amount = prompt('Enter raise amount:')
    if (amount && !isNaN(amount)) {
      socket.emit('raise', { roomId: game.roomId, userId: resolvedUserId, amount: parseInt(amount) })
    }
  }

  const handleStartHand = () => {
    if (!canStartGame) {
      alert(`Need at least ${game.minPlayers} players with chips to start. Currently ${activePlayers.length} players ready.`)
      return
    }
    socket.emit('startHand', { roomId: game.roomId })
  }

  const handleShowHand = () => {
    socket.emit('showHand', { roomId: game.roomId, userId: resolvedUserId })
  }

  return (
    <div className="bg-poker-light rounded-2xl p-8">
      {/* Table */}
      <div className="poker-table relative h-96 flex items-center justify-center">
        {/* Pot - Moved to Bottom */}
        <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 translate-y-full z-10">
          <div className="bg-black/80 px-6 py-2 rounded-xl border border-poker-gold shadow-[0_0_15px_rgba(255,215,0,0.3)] flex flex-col items-center justify-center min-w-[100px]">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 text-center">POT</p>
            <p className="text-poker-gold text-2xl font-bold text-center">{game.pot}</p>
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
                className={`poker-card ${getCardStyle(card)} w-16 h-24 text-2xl`} // Increased size
              >
                {getCardImage(card) ? (
                  <img src={getCardImage(card)} alt={card} className="w-full h-full object-contain" />
                ) : card}
              </motion.div>
            ))}

          </div>
        )}

        {/* Players */}
        {game.players.map((player, index) => {
          const isActive = player.chips > 0 && !player.isSittingOut
          const isCurrentTurn = game.currentPlayerIndex === index

          return (
            <div
              key={index}
              className={`absolute player-slot ${isCurrentTurn ? 'ring-2 ring-poker-gold' : ''
                }`}
              style={{
                top: `${30 + Math.sin((index / game.players.length) * 2 * Math.PI) * 35}%`,
                left: `${50 + Math.cos((index / game.players.length) * 2 * Math.PI) * 40}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className={`bg-poker-darker rounded-lg p-3 min-w-[120px] text-center ${!isActive ? 'opacity-60' : ''
                }`}>
                <p className="text-white font-bold">{player.username}</p>
                <p className={`${player.chips > 0 ? 'text-poker-gold' : 'text-red-400'} font-semibold`}>
                  {player.chips} chips
                </p>

                {/* Hand Evaluation Display */}
                {(isMyTurn || game.stage === 'showdown' || game.stage === 'ended') &&
                  (player.userId === resolvedUserId || (game.stage === 'showdown' || game.stage === 'ended')) &&
                  player.cards && player.cards.length > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-poker-gold font-bold text-sm bg-black/50 px-2 py-1 rounded">
                        {game.stage === 'showdown' || game.stage === 'ended'
                          ? evaluateHand(player.cards, game.communityCards)
                          : (player.userId === resolvedUserId ? evaluateHand(player.cards, game.communityCards) : '')}
                      </span>
                    </div>
                  )}

                {/* Visual Cards */}
                {player.cards && player.cards.length > 0 ? (
                  <div className="flex justify-center gap-1 my-1">
                    {player.cards.map((card, idx) => {
                      const img = getCardImage(card);
                      return (
                        <div key={idx} className={`poker-card scale-75 origin-top ${getCardStyle(card)}`}>
                          {img ? <img src={img} alt={card} className="w-full h-full object-contain" /> : card}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  game.stage !== 'waiting' && !player.hasFolded && isActive && (
                    <div className="flex justify-center gap-1 my-1">
                      <CardBack />
                      <CardBack />
                    </div>
                  )
                )}

                {player.bet > 0 && <p className="text-sm text-gray-400">Bet: {player.bet}</p>}
                {player.hasFolded && <p className="text-red-400 text-sm">Folded</p>}
                {player.isAllIn && <p className="text-yellow-400 text-sm font-bold">ALL IN</p>}

              </div>
            </div>
          )
        })}
      </div>

      {/* Player Cards */}
      {currentPlayer && currentPlayer.cards && currentPlayer.cards.length > 0 && (
        <div className="mt-4 flex justify-center gap-4">
          <p className="text-gray-400 text-sm mr-4 self-center">Your cards:</p>
          {currentPlayer.cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`poker-card w-16 h-24 text-2xl ${getCardStyle(card)}`} // Explicit size for consistency
            >
              {getCardImage(card) ? (
                <img src={getCardImage(card)} alt={card} className="w-full h-full object-contain" />
              ) : (
                card
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="mt-6 flex flex-col items-center gap-4">
        {game.stage === 'waiting' && (
          <div className="text-center">
            <button
              onClick={handleStartHand}
              className={`btn-primary ${!canStartGame ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canStartGame}
            >
              Start Hand
            </button>
            {!canStartGame && (
              <p className="text-yellow-400 text-sm mt-2">
                ⚠️ Need {game.minPlayers} players with chips to start.
                Currently {activePlayers.length}/{game.minPlayers} ready.
              </p>
            )}
            {canStartGame && (
              <p className="text-green-400 text-sm mt-2">
                ✓ {activePlayers.length} players ready to play!
              </p>
            )}
          </div>
        )}

        {isMyTurn && game.stage !== 'waiting' && game.stage !== 'ended' && currentPlayer && !currentPlayer.hasFolded && (
          <div className="flex gap-4">
            <button onClick={handleFold} className="btn-danger px-6 py-3">
              Fold
            </button>
            <button onClick={handleCall} className="btn-secondary px-6 py-3">
              {game.currentBet === 0 ? 'Check' : `Call ${game.currentBet - currentPlayer.bet}`}
            </button>
            <button onClick={handleRaise} className="btn-primary px-6 py-3">
              Raise
            </button>
          </div>
        )}

        {game.stage === 'ended' && (
          <div className="text-center">
            <p className="text-2xl text-poker-gold font-bold mb-2">Hand Over!</p>
            <p className="text-white">
              Winner: <span className="text-green-400 font-bold">{game.winner?.username}</span>
            </p>
            <p className="text-gray-400">Hand: {game.winner?.hand}</p>
            <p className="text-poker-gold">Won: {game.winner?.amount} chips</p>
            <div className="flex gap-4 justify-center mt-4">
              <button
                onClick={handleStartHand}
                className="btn-primary"
                disabled={!canStartGame}
              >
                Start Next Hand
              </button>
              {currentPlayer && !currentPlayer.showHand && !currentPlayer.hasFolded && (
                <button
                  onClick={handleShowHand}
                  className="btn-secondary"
                >
                  Show Hand
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="mt-4 text-center text-gray-400">
        <p className="font-semibold">Stage: <span className="text-white uppercase">{game.stage}</span></p>
        <p>Current Bet: <span className="text-poker-gold">{game.currentBet}</span></p>
        <p className="text-sm mt-2">
          Blinds: <span className="text-white">{game.smallBlind}/{game.bigBlind}</span> |
          Players: <span className={activePlayers.length >= game.minPlayers ? 'text-green-400' : 'text-yellow-400'}>
            {activePlayers.length}/{game.players.length}
          </span>
        </p>
      </div>
    </div>
  )
}