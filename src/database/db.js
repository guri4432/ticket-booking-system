const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Create data folder automatically if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'movie_booking.db');

let db;

/**
 * Initialize the SQLite database and create all required tables.
 * Uses WAL journal mode for better concurrent read performance.
 */
function initializeDatabase() {
  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ── Movies ──────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      duration    INTEGER NOT NULL,          -- minutes
      genre       TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── Screens ─────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS screens (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE,
      total_rows  INTEGER NOT NULL DEFAULT 5,
      seats_per_row INTEGER NOT NULL DEFAULT 10,
      created_at  TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── Shows ───────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS shows (
      id          TEXT PRIMARY KEY,
      movie_id    TEXT NOT NULL REFERENCES movies(id),
      screen_id   TEXT NOT NULL REFERENCES screens(id),
      show_time   TEXT NOT NULL,
      show_date   TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      UNIQUE(screen_id, show_time, show_date)
    );
  `);

  // ── Seats ───────────────────────────────────────────────────────────
  // One row per seat per show, tracks current status
  db.exec(`
    CREATE TABLE IF NOT EXISTS seats (
      id          TEXT PRIMARY KEY,
      show_id     TEXT NOT NULL REFERENCES shows(id),
      seat_label  TEXT NOT NULL,              -- e.g. "A1", "B5"
      row_label   TEXT NOT NULL,              -- e.g. "A", "B"
      col_number  INTEGER NOT NULL,           -- e.g. 1, 5
      status      TEXT NOT NULL DEFAULT 'AVAILABLE'
                  CHECK(status IN ('AVAILABLE', 'LOCKED', 'BOOKED')),
      locked_by   TEXT,                       -- user / session id
      locked_at   TEXT,                       -- timestamp when locked
      UNIQUE(show_id, seat_label)
    );
  `);

  // ── Bookings ────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id          TEXT PRIMARY KEY,
      show_id     TEXT NOT NULL REFERENCES shows(id),
      user_id     TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'INITIATED'
                  CHECK(status IN ('INITIATED', 'CONFIRMED', 'CANCELLED')),
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── Booking–Seat junction ───────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS booking_seats (
      booking_id  TEXT NOT NULL REFERENCES bookings(id),
      seat_id     TEXT NOT NULL REFERENCES seats(id),
      PRIMARY KEY (booking_id, seat_id)
    );
  `);

  console.log('✅ Database initialized successfully');
  return db;
}

/**
 * Return the active database instance (initializing if needed).
 */
function getDb() {
  if (!db) {
    initializeDatabase();
  }
  return db;
}

module.exports = { initializeDatabase, getDb };
