import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { statsAPI } from '../utils/api'

export default function StatsPanel({ user, onClose }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await statsAPI.getMyStats()
      setStats(response.data)
    } catch (err) {
      console.error('Failed to load stats')
    }
  }

  if (!stats) return null

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      className="fixed left-0 top-0 h-full w-80 bg-poker-light shadow-2xl p-6 overflow-y-auto z-50"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Your Stats</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-poker-darker rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Chips</p>
          <p className="text-poker-gold text-3xl font-bold">{stats.chips}</p>
        </div>

        <div className="bg-poker-darker rounded-lg p-4">
          <p className="text-gray-400 text-sm">Hands Played</p>
          <p className="text-white text-2xl font-bold">{stats.stats.handsPlayed}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-poker-darker rounded-lg p-4">
            <p className="text-gray-400 text-sm">Won</p>
            <p className="text-green-400 text-xl font-bold">{stats.stats.handsWon}</p>
          </div>
          <div className="bg-poker-darker rounded-lg p-4">
            <p className="text-gray-400 text-sm">Lost</p>
            <p className="text-red-400 text-xl font-bold">{stats.stats.handsLost}</p>
          </div>
        </div>

        <div className="bg-poker-darker rounded-lg p-4">
          <p className="text-gray-400 text-sm">Net Profit/Loss</p>
          <p
            className={`text-2xl font-bold ${
              stats.netProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {stats.netProfitLoss >= 0 ? '+' : ''}
            {stats.netProfitLoss}
          </p>
        </div>

        <div className="bg-poker-darker rounded-lg p-4">
          <h3 className="text-white font-bold mb-2">Recent Games</h3>
          <div className="space-y-2">
            {stats.gameHistory.slice(-5).reverse().map((game, i) => (
              <div key={i} className="text-sm border-b border-gray-700 pb-2">
                <p className="text-gray-400">
                  {new Date(game.timestamp).toLocaleString()}
                </p>
                <div className="flex justify-between">
                  <span
                    className={
                      game.result === 'win'
                        ? 'text-green-400'
                        : game.result === 'loss'
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }
                  >
                    {game.result.toUpperCase()}
                  </span>
                  <span className="text-white font-bold">
                    {game.result === 'win' ? '+' : game.result === 'loss' ? '-' : ''}
                    {game.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
