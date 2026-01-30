import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSocket } from '../utils/socket'
import { gamesAPI } from '../utils/api'
import PokerTable from '../components/PokerTable'
import Chat from '../components/Chat'
import StatsPanel from '../components/StatsPanel'
import BuyInModal from '../components/BuyInModal'

export default function GameTable({ user, onLogout }) {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [socket, setSocket] = useState(null)
  const [showBuyIn, setShowBuyIn] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const socketInstance = getSocket()
    setSocket(socketInstance)

    // Join room
    socketInstance.emit('joinRoom', {
      roomId,
      userId: user._id,
      username: user.username,
    })

    // Socket listeners
    socketInstance.on('gameState', ({ game }) => {
      setGame(game)
    })

    socketInstance.on('playerJoined', ({ game, message }) => {
      setGame(game)
      setMessages((prev) => [...prev, { text: message, type: 'system' }])
    })

    socketInstance.on('handStarted', ({ game }) => {
      setGame(game)
      setMessages((prev) => [...prev, { text: 'New hand started!', type: 'system' }])
    })

    socketInstance.on('playerAction', ({ action, game }) => {
      setGame(game)
    })

    socketInstance.on('handEnded', ({ game, winner }) => {
      setGame(game)
      setMessages((prev) => [
        ...prev,
        { text: `${winner.username} wins ${winner.amount} chips!`, type: 'system' },
      ])
    })

    socketInstance.on('message', (message) => {
      setMessages((prev) => [...prev, message])
    })

    socketInstance.on('error', ({ message }) => {
      alert(message)
    })

    return () => {
      socketInstance.emit('leaveRoom', { roomId, userId: user._id, username: user.username })
      socketInstance.off('gameState')
      socketInstance.off('playerJoined')
      socketInstance.off('handStarted')
      socketInstance.off('playerAction')
      socketInstance.off('handEnded')
      socketInstance.off('message')
    }
  }, [roomId, user])

  const handleBuyIn = async (amount) => {
    try {
      await gamesAPI.buyIn(roomId, amount)
      socket.emit('buyIn', { roomId, userId: user._id, amount })
      setShowBuyIn(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Buy-in failed')
    }
  }

  const handleLeave = async () => {
    try {
      await gamesAPI.leave(roomId)
      navigate('/room-entry')
    } catch (err) {
      alert('Error leaving room')
    }
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-poker-dark flex items-center justify-center">
        <p className="text-white text-xl">Loading game...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-darker via-poker-dark to-poker-darker p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-white text-2xl font-bold">Room: {roomId}</h2>
          <p className="text-gray-400">Players: {game.players.length}/{game.maxPlayers}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-secondary px-4 py-2"
          >
            📊 Stats
          </button>
          <button onClick={handleLeave} className="btn-danger px-4 py-2">
            Leave Table
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Poker Table */}
        <div className="lg:col-span-3">
          <PokerTable game={game} user={user} socket={socket} />
        </div>

        {/* Chat */}
        <div className="lg:col-span-1">
          <Chat messages={messages} socket={socket} roomId={roomId} user={user} />
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <StatsPanel user={user} onClose={() => setShowStats(false)} />
      )}

      {/* Buy-in Modal */}
      {showBuyIn && (
        <BuyInModal
          userChips={user.chips}
          onBuyIn={handleBuyIn}
          onClose={() => setShowBuyIn(false)}
        />
      )}
    </div>
  )
}
