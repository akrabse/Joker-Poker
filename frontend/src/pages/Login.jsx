import { useState } from 'react'
import { motion } from 'framer-motion'
import { authAPI } from '../utils/api'

export default function Login({ onLogin }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = isRegister
        ? await authAPI.register(username, password)
        : await authAPI.login(username, password)

      onLogin(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.guest()
      onLogin(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Guest login failed')
    } finally {
      setLoading(false)
    }
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-darker via-poker-dark to-poker-darker flex items-center justify-center p-4">
      <div className="perspective-1000">
        <motion.div
          className="relative w-96 h-[500px]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Card Back - Blank */}
          <div className="card-back absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-white mb-4">♠ ♥</h1>
              <h2 className="text-3xl font-bold text-white mb-2">JOKER</h2>
              <p className="text-white/70 mb-8">Poker</p>
              <button
                onClick={flipCard}
                className="btn-primary"
                disabled={loading}
              >
                Click to Enter
              </button>
            </div>
          </div>

          {/* Card Front - Login Form */}
          <div
            className="card-front absolute inset-0 bg-white rounded-xl shadow-2xl p-8"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-poker-dark">
                    {isRegister ? 'Register' : 'Login'}
                  </h2>
                  <p className="text-gray-600 mt-2">Join the table</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 text-poker-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-poker-gold"
                      required
                      minLength={3}
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 text-poker-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-poker-gold"
                      required
                      minLength={6}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : isRegister ? 'Register' : 'Login'}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-poker-dark hover:text-poker-green font-semibold"
                  >
                    {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGuestLogin}
                  className="w-full btn-secondary"
                  disabled={loading}
                >
                  Continue as Guest
                </button>

                <button
                  onClick={flipCard}
                  className="w-full py-2 text-gray-600 hover:text-poker-dark"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Disclaimer */}
      <div className="fixed bottom-4 text-center text-white/50 text-sm">
        <p>© 2026 Joker. All rights reserved.</p>
        <p>18+ only. Not for real gambling. Entertainment purposes only.</p>
      </div>
    </div>
  )
}
