const express = require('express')
const router = express.Router()
const { getMyStats } = require('../controllers/statsController')
const auth = require('../middleware/auth')

router.get('/me', auth, getMyStats)

module.exports = router