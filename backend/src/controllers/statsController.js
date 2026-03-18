/**
 * UITLEG VOOR DOCENT EN LEERLINGEN:
 * In deze behandelingscode (controller) berekenen we de statistieken (stats) van een gebruiker.
 * Het script leest alle beëindigde games en berekent de winst, verlies, en totale chips verdiensten.
 */
const Game = require('../models/Game')

exports.getMyStats = async (req, res) => {
  // UITLEG: Haalt alle spelletjes op waaraan deze specifieke ingelogde gebruiker heeft meegedaan, en telt de winst/verlies op.
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