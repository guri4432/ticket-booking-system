const express = require('express');
const cors = require('cors');
const path = require('path');

const { initializeDatabase, getDb } = require('./database/db');

// Import route modules
const movieRoutes = require('./routes/movieRoutes');
const screenRoutes = require('./routes/screenRoutes');
const showRoutes = require('./routes/showRoutes');
const seatRoutes = require('./routes/seatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend from public/ folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Request logger
app.use((req, _res, next) => {

  if (!req.url.startsWith('/api')) {
    return next();
  }

  console.log(
    `${new Date().toISOString()} ${req.method} ${req.url}`
  );

  next();
});

// ── API Routes ────────────────────────────────────────

app.use('/api/movies', movieRoutes);

app.use('/api/screens', screenRoutes);

app.use('/api/shows', showRoutes);

app.use('/api/seats', seatRoutes);

app.use('/api/bookings', bookingRoutes);

// Health check

app.get('/api/health', (_req, res) => {

  res.json({

    status: 'ok',

    timestamp: new Date().toISOString()

  });

});

// 404 handler

app.use((_req, res) => {

  res.status(404).json({

    success: false,

    error: 'Route not found'

  });

});

// Global error handler

app.use((err, _req, res, _next) => {

  console.error('Unhandled error:', err);

  res.status(500).json({

    success: false,

    error: 'Internal server error'

  });

});

// ── Start ─────────────────────────────────────────────

initializeDatabase();

// Auto-seed database if empty

try {

  const db = getDb();

  const result = db
    .prepare('SELECT COUNT(*) AS total FROM shows')
    .get();

  if (result.total === 0) {

    console.log('🌱 No shows found. Running seed...');

    require('./seed');

    console.log('✅ Database seeded automatically');

  }

} catch (err) {

  console.error('Auto seed failed:', err);

}

app.listen(PORT, () => {

  console.log(
    `🎬 Movie Booking System API running on port ${PORT}`
  );

});

module.exports = app;