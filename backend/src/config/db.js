/**
 * UITLEG VOOR DOCENT EN LEERLINGEN:
 * In dit bestand maken we de verbinding met de MongoDB database via Mongoose.
 * De database slaat alle spelers, chips en game historie op zodat niets verloren gaat.
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  // UITLEG: Hier proberen we asynchroon (op de achtergrond) verbinding te maken met de MongoDB URI.
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
