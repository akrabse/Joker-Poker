const Game = require('../models/Game')

exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user.id

    const games = await Game.find({
      'players.userId': userId,
      status: 'finished',
    })

    let totalGames = 0
    let totalWins = 0
    let totalLosses = 0
    let netChips = 0

    games.forEach((game) => {
      const player = game.players.find(
        (p) => p.userId.toString() === userId
      )

      if (!player) return

      totalGames++

      netChips += player.chips

      if (game.winner && game.winner.userId.toString() === userId) {
        totalWins++
      } else {
        totalLosses++
      }
    })

    res.json({
      totalGames,
      totalWins,
      totalLosses,
      netChips,
      winRate: totalGames
        ? ((totalWins / totalGames) * 100).toFixed(1)
        : 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}