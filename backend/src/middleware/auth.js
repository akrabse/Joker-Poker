/**
 * UITLEG VOOR DOCENT EN LEERLINGEN:
 * Dit is een 'middleware'. Het fungeert als een poortwachter tussen de aanvraag van de gebruiker en de server.
 * Voordat een speler gegevens mag opvragen of acties mag doen, checkt dit script of hij wel succesvol is ingelogd via een digitale token.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware - Verifies JWT token and attaches user to request
 * Used for all authenticated routes
 */
const protect = async (req, res, next) => {
  // UITLEG: Hier pakken we de 'Authorization' token (digitale sleutel) uit. Klopt de token niet, dan krijgt men een 'Authentication required' fout. 
  // Als deze wel klopt, mag het programma verder gaan ('next()').
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Admin middleware - Checks if authenticated user is an admin
 * Must be used after protect middleware
 */
const admin = async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

module.exports = { protect, admin };
