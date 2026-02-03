import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSocket } from '../utils/socket'
import { gamesAPI } from '../utils/api'
import PokerTable from '../components/PokerTable'
import Chat from '../components/Chat'
import StatsPanel from '../components/StatsPanel'

export default function GameTable({ user, onLogout, onUserUpdate }) {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [socket, setSocket] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [messages, setMessages] = useState([])
  const [currentUserChips, setCurrentUserChips] = useState(user?.chips || 0)

  useEffect(() => {
    if (!user) return

    const socketInstance = getSocket()
    setSocket(socketInstance)

    // Join room - USING user.id (not user._id)
    socketInstance.emit('joinRoom', {
      roomId,
      userId: user.id,
      username: user.username,
    })

    // Socket listeners
    socketInstance.on('userUpdate', ({ chips }) => {
      // Update local user chips state
      setCurrentUserChips(chips)
      // Also update parent component if callback provided
      if (onUserUpdate) {
        onUserUpdate({ ...user, chips })
      }
      console.log(`💰 User chips updated: ${chips}`)
    })

    socketInstance.on('playerBuyIn', ({ game, message }) => {
      setGame(game)
      setMessages((prev) => [...prev, { text: message, type: 'system' }])
    })

    socketInstance.on('playerDisconnected', ({ message }) => {
      setMessages((prev) => [...prev, { text: message, type: 'system' }])
    })

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

    socketInstance.on('playerLeft', ({ game, message }) => {
      setGame(game)
      setMessages((prev) => [...prev, { text: message, type: 'system' }])
    })

    socketInstance.on('message', (message) => {
      setMessages((prev) => [...prev, message])
    })

    socketInstance.on('error', ({ message }) => {
      alert(message)
    })

    return () => {
      socketInstance.emit('leaveRoom', { roomId, userId: user.id, username: user.username })
      socketInstance.off('userUpdate')
      socketInstance.off('playerBuyIn')
      socketInstance.off('playerDisconnected')
      socketInstance.off('gameState')
      socketInstance.off('playerJoined')
      socketInstance.off('handStarted')
      socketInstance.off('playerAction')
      socketInstance.off('handEnded')
      socketInstance.off('playerLeft')
      socketInstance.off('message')
      socketInstance.off('error')
    }
  }, [roomId, user, onUserUpdate])

  const handleLeave = async () => {
    try {
      await gamesAPI.leave(roomId)
      navigate('/room-entry')
    } catch (err) {
      alert('Error leaving room')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-poker-dark flex items-center justify-center">
        <p className="text-white text-xl">Loading user...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-poker-dark flex items-center justify-center">
        <p className="text-white text-xl">Loading game...</p>
      </div>
    )
  }

  const currentPlayer = game.players.find((p) => p.userId.toString() === user.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-darker via-poker-dark to-poker-darker p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-white text-2xl font-bold">Room: {roomId}</h2>
          <p className="text-gray-400">Players: {game.players.length}/{game.maxPlayers}</p>
          <p className="text-gray-400">
            Active Players: {game.players.filter(p => p.chips > 0).length}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Account Chips Display */}
          <div className="bg-poker-darker rounded-lg px-4 py-2 mr-2">
            <p className="text-gray-400 text-xs">Account Balance</p>
            <p className="text-poker-gold font-bold text-lg">{currentUserChips} chips</p>
          </div>
          
          {/* Game Chips Display */}
          {currentPlayer && (
            <div className="bg-poker-darker rounded-lg px-4 py-2 mr-2">
              <p className="text-gray-400 text-xs">At Table</p>
              <p className="text-green-400 font-bold text-lg">{currentPlayer.chips} chips</p>
            </div>
          )}
          
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
        <StatsPanel
          user={user}
          game={game}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  )
}