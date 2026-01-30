import { useState } from 'react'
import { authAPI, statsAPI } from '../utils/api'
import { useNavigate } from 'react-router-dom'

export default function AdminPanel() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [users, setUsers] = useState([])
  const [targetUsername, setTargetUsername] = useState('')
  const [chipAmount, setChipAmount] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await authAPI.adminLogin(username, password)
      localStorage.setItem('adminToken', response.data.token)
      setIsAuthenticated(true)
      loadUsers()
    } catch (err) {
      setMessage('Invalid admin credentials')
    }
  }

  const loadUsers = async () => {
    try {
      const response = await statsAPI.getAllUsers()
      setUsers(response.data.users)
    } catch (err) {
      setMessage('Failed to load users')
    }
  }

  const handleAddChips = async (e) => {
    e.preventDefault()
    try {
      await statsAPI.addChips(targetUsername, parseInt(chipAmount))
      setMessage(`Successfully added ${chipAmount} chips to ${targetUsername}`)
      setTargetUsername('')
      setChipAmount('')
      loadUsers()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to add chips')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-poker-dark flex items-center justify-center p-4">
        <div className="bg-poker-light rounded-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Admin Panel</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Admin Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field w-full"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
            />
            {message && <p className="text-red-400">{message}</p>}
            <button type="submit" className="btn-primary w-full">
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary w-full"
            >
              Back to Game
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-poker-dark p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Admin Dashboard</h1>

        {/* Add Chips Form */}
        <div className="bg-poker-light rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Add Chips to User</h2>
          <form onSubmit={handleAddChips} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Username"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              className="input-field"
              required
            />
            <input
              type="number"
              placeholder="Chip Amount"
              value={chipAmount}
              onChange={(e) => setChipAmount(e.target.value)}
              className="input-field"
              min="1"
              required
            />
            <button type="submit" className="btn-primary">
              Add Chips
            </button>
          </form>
          {message && (
            <p className="mt-4 text-poker-gold">{message}</p>
          )}
        </div>

        {/* Users List */}
        <div className="bg-poker-light rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">All Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead className="border-b border-gray-600">
                <tr>
                  <th className="text-left py-3 px-4">Username</th>
                  <th className="text-left py-3 px-4">Chips</th>
                  <th className="text-left py-3 px-4">Hands Played</th>
                  <th className="text-left py-3 px-4">Win Rate</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-700">
                    <td className="py-3 px-4">{user.username}</td>
                    <td className="py-3 px-4">{user.chips}</td>
                    <td className="py-3 px-4">{user.stats.handsPlayed}</td>
                    <td className="py-3 px-4">
                      {user.stats.handsPlayed > 0
                        ? ((user.stats.handsWon / user.stats.handsPlayed) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded ${
                          user.isOnline ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                      >
                        {user.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
