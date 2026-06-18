const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new screen.
 * @param {{ name: string, totalRows?: number, seatsPerRow?: number }} data
 */
function createScreen({ name, totalRows = 5, seatsPerRow = 10 }) {
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO screens (id, name, total_rows, seats_per_row) VALUES (?, ?, ?, ?)
  `).run(id, name, totalRows, seatsPerRow);

  return db.prepare('SELECT * FROM screens WHERE id = ?').get(id);
}

/**
 * Fetch all screens.
 */
function getAllScreens() {
  return getDb().prepare('SELECT * FROM screens ORDER BY name').all();
}

/**
 * Fetch a single screen by id.
 */
function getScreenById(id) {
  return getDb().prepare('SELECT * FROM screens WHERE id = ?').get(id);
}

module.exports = { createScreen, getAllScreens, getScreenById };
