/**
 * UITLEG VOOR DOCENT EN LEERLINGEN:
 * Hiermee worden de statistieken routes gekoppeld aan de statsController.
 * We geven hierbij aan dat je 'auth' (ingelogd) moet zijn, zodat iemand nooit resultaten van een ander opvraagt.
 */
const express = require('express')
const router = express.Router()
const { getMyStats } = require('../controllers/statsController')
const auth = require('../middleware/auth')

router.get('/me', auth, getMyStats)

module.exports = router