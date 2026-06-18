const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new show (Movie + Screen + Time) and auto-generate its seat layout.
 * Uses a transaction to ensure atomicity.
 */
function createShow({ movieId, screenId, showTime, showDate }) {
  const db = getDb();
  const showId = uuidv4();

  const createShowTx = db.transaction(() => {
    // 1) Insert the show record
    db.prepare(`
      INSERT INTO shows (id, movie_id, screen_id, show_time, show_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(showId, movieId, screenId, showTime, showDate);

    // 2) Fetch screen dimensions to generate seat layout
    const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(screenId);
    if (!screen) throw new Error('Screen not found');

    // 3) Generate seats (A1, A2, … B1, B2, …)
    const insertSeat = db.prepare(`
      INSERT INTO seats (id, show_id, seat_label, row_label, col_number, status)
      VALUES (?, ?, ?, ?, ?, 'AVAILABLE')
    `);

    for (let r = 0; r < screen.total_rows; r++) {
      const rowLabel = String.fromCharCode(65 + r); // A, B, C …
      for (let c = 1; c <= screen.seats_per_row; c++) {
        insertSeat.run(uuidv4(), showId, `${rowLabel}${c}`, rowLabel, c);
      }
    }

    return showId;
  });

  createShowTx();

  // Return the full show with movie & screen info
  return db.prepare(`
    SELECT s.*, m.title AS movie_title, sc.name AS screen_name
    FROM shows s
    JOIN movies m ON m.id = s.movie_id
    JOIN screens sc ON sc.id = s.screen_id
    WHERE s.id = ?
  `).get(showId);
}

/**
 * Fetch all shows with joined movie and screen info.
 */
function getAllShows() {
  return getDb().prepare(`
    SELECT s.*, m.title AS movie_title, m.duration, m.genre,
           sc.name AS screen_name
    FROM shows s
    JOIN movies m ON m.id = s.movie_id
    JOIN screens sc ON sc.id = s.screen_id
    ORDER BY s.show_date, s.show_time
  `).all();
}

/**
 * Fetch a single show by id.
 */
function getShowById(id) {
  return getDb().prepare(`
    SELECT s.*, m.title AS movie_title, m.duration, m.genre,
           sc.name AS screen_name
    FROM shows s
    JOIN movies m ON m.id = s.movie_id
    JOIN screens sc ON sc.id = s.screen_id
    WHERE s.id = ?
  `).get(id);
}

module.exports = { createShow, getAllShows, getShowById };
