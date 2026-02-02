import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { gamesAPI } from '../utils/api'

export default function RoomEntry({ user, onLogout }) {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateRoom = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await gamesAPI.create()
      navigate(`/game/${response.data.roomId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await gamesAPI.join(roomCode.toUpperCase())
      navigate(`/game/${roomCode.toUpperCase()}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-darker via-poker-dark to-poker-darker flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-poker-light rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-700"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Welcome, {user.username}</h1>
            <button
              onClick={onLogout}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Logout
            </button>
          </div>
          <div className="bg-poker-darker rounded-lg p-4">
            <p className="text-gray-400 text-sm">Your Chips</p>
            <p className="text-4xl font-bold text-poker-gold">{user.chips}</p>
          </div>
        </div>

        {/* Create Room */}
        <div className="mb-6">
          <button
            onClick={handleCreateRoom}
            className="w-full btn-primary text-lg py-4"
            disabled={loading}
          >
            🎲 Create New Room
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-4 text-gray-400 text-sm">OR</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        {/* Join Room */}
        <form onSubmit={handleJoinRoom} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 font-semibold">
              Enter Room Code
            </label>
            <input
              type="text"
              placeholder="e.g., ABC123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="input-field w-full text-center text-2xl tracking-widest"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-secondary text-lg py-4"
            disabled={loading || !roomCode}
          >
            Join Room
          </button>
        </form>

        {/* Info */}
        <div className="mt-8 p-4 bg-poker-darker rounded-lg">
          <h3 className="text-white font-semibold mb-2">How to Play:</h3>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Create a room and share the code with friends</li>
            <li>• Or enter a friend's room code to join</li>
            <li>• Minimum 2 players to start</li>
            <li>• Maximum 8 players per table</li>
          </ul>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="fixed bottom-4 text-center text-white/50 text-sm">
        <p>© 2026 Joker. All rights reserved. Not for real gambling.</p>
      </div>
    </div>
  )
}
