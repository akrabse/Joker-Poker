import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSocket } from '../utils/socket'
import { gamesAPI } from '../utils/api'
import PokerTable from '../components/PokerTable'
import Chat from '../components/Chat'
import StatsPanel from '../components/StatsPanel'
import BuyInModal from '../components/BuyInModal'
import Toast from '../components/Toast'

export default function GameTable({ user, onLogout, onUserUpdate }) {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [socket, setSocket] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [messages, setMessages] = useState([])
  const [currentUserChips, setCurrentUserChips] = useState(user?.chips || 0)
  const [showBuyInModal, setShowBuyInModal] = useState(false)

  const toastRef = useRef(null)

  // Use refs to store stable references that won't trigger re-renders
  const userRef = useRef(user)
  const onUserUpdateRef = useRef(onUserUpdate)

  // Keep refs updated
  useEffect(() => {
    userRef.current = user
    onUserUpdateRef.current = onUserUpdate
  }, [user, onUserUpdate])

  useEffect(() => {
    if (!user) return

    const socketInstance = getSocket()
    setSocket(socketInstance)

    // Resolve a stable userId (support both user._id and user.id)
    const resolvedUserId = user._id || user.id
    const username = user.username

    // Join room - send the canonical DB id
    socketInstance.emit('joinRoom', {
      roomId,
      userId: String(resolvedUserId),
      username,
    })

    // Socket listeners
    socketInstance.on('userUpdate', ({ chips }) => {
      // Update local user chips state
      setCurrentUserChips(chips)
      // Also update parent component if callback provided
      if (onUserUpdateRef.current && userRef.current) {
        onUserUpdateRef.current({ ...userRef.current, chips })
      }
      console.log(`💰 User chips updated: ${chips}`)
    })

    const pushSystemMessage = (text) => {
      setMessages((prev) => {
        // Avoid duplicate identical system messages (e.g. repeated join msgs)
        if (prev.some((m) => m.type === 'system' && m.text === text)) return prev
        return [...prev, { text, type: 'system' }]
      })
    }

    socketInstance.on('playerBuyIn', ({ game, message }) => {
      setGame(game)
      pushSystemMessage(message)
    })

    socketInstance.on('playerDisconnected', ({ message }) => {
      pushSystemMessage(message)
    })

    socketInstance.on('gameState', ({ game }) => {
      setGame(game)

      // key moment: check if we should show buy-in modal
      // If we are in the game but have 0 chips, prompt buy-in
      const resolvedUserId = user._id || user.id
      const myPlayer = game.players.find(p => p.userId.toString() === String(resolvedUserId))
      if (myPlayer && myPlayer.chips === 0 && userRef.current.chips > 0) {
        setShowBuyInModal(true)
      }
    })

    socketInstance.on('playerJoined', ({ game, message }) => {
      setGame(game)
      pushSystemMessage(message)
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
      pushSystemMessage(message)
    })

    socketInstance.on('message', (message) => {
      setMessages((prev) => [...prev, message])
    })

    socketInstance.on('error', ({ message }) => {
      toastRef.current?.show(message, 'error')
    })

    socketInstance.on('buyInSuccess', ({ userChips, gameChips }) => {
      setCurrentUserChips(userChips)
      setShowBuyInModal(false)
      toastRef.current?.show(`Successfully bought in!`, 'success')
    })

    // Cleanup only on actual unmount (navigating away from page)
    return () => {
      socketInstance.emit('leaveRoom', { roomId, userId: String(resolvedUserId), username })
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
      socketInstance.off('buyInSuccess')
    }
    // Only depend on roomId - user values are captured at mount time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const handleLeave = async () => {
    // Prevent leaving if game is active/in-hand (unless sitting out or waiting)
    if (game && game.stage !== 'waiting' && game.stage !== 'ended') {
      // Check if I am involved in the hand (not folded)
      const resolvedUserId = user._id || user.id
      const myPlayer = game.players.find(p => p.userId.toString() === String(resolvedUserId))

      if (myPlayer && !myPlayer.hasFolded && myPlayer.chips > 0) {
        toastRef.current?.show("Cannot leave table during an active hand! Fold first.", 'error')
        return
      }
    }

    try {
      await gamesAPI.leave(roomId)
      navigate('/room-entry')
    } catch (err) {
      toastRef.current?.show('Error leaving room', 'error')
    }
  }

  const handleBuyIn = (amount) => {
    const resolvedUserId = user._id || user.id
    if (socket) {
      socket.emit('buyIn', { roomId, userId: String(resolvedUserId), amount })
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

  const resolvedUserId = user._id || user.id
  const currentPlayer = game.players.find((p) => p.userId.toString() === String(resolvedUserId))
  const tableChips = currentPlayer?.chips || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-darker via-poker-dark to-poker-darker p-4">
      <Toast ref={toastRef} />

      {showBuyInModal && (
        <BuyInModal
          userChips={currentUserChips}
          onBuyIn={handleBuyIn}
          onClose={() => setShowBuyInModal(false)}
        />
      )}

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
          <div className="bg-poker-darker rounded-lg px-4 py-2 mr-2 border border-gray-700">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Account Balance</p>
            <p className="text-yellow-500 font-bold">{currentUserChips} chips</p>
          </div>

          {/* Table Chips Display */}
          <div className="bg-poker-darker rounded-lg px-4 py-2 mr-2 border border-green-900/50">
            <p className="text-gray-400 text-xs uppercase tracking-wider">At Table</p>
            <p className="text-green-400 font-bold">{tableChips} chips</p>
          </div>

          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 bg-poker-light hover:bg-poker-light/80 text-white px-4 py-2 rounded-lg transition-colors border border-gray-600"
          >
            <span className="text-xl">📊</span>
            Stats
          </button>
          <button
            onClick={handleLeave}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-bold shadow-lg shadow-red-900/20"
          >
            Leave Table
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
        {/* Main Table Area */}
        <div className="lg:col-span-3">
          <PokerTable game={game} user={user} socket={socket} />
        </div>

        {/* Chat Area */}
        <div className="h-full">
          <Chat messages={messages} socket={socket} roomId={roomId} user={user} />
        </div>
      </div>

      {showStats && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowStats(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <StatsPanel user={user} onClose={() => setShowStats(false)} />
          </div>
        </div>
      )}
    </div>
  )
}