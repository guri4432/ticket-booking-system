const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new movie.
 * @param {{ title: string, duration: number, genre?: string }} data
 * @returns {object} created movie record
 */
function createMovie({ title, duration, genre }) {
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO movies (id, title, duration, genre) VALUES (?, ?, ?, ?)
  `).run(id, title, duration, genre || null);

  return db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
}

/**
 * Fetch all movies.
 */
function getAllMovies() {
  return getDb().prepare('SELECT * FROM movies ORDER BY created_at DESC').all();
}

/**
 * Fetch a single movie by id.
 */
function getMovieById(id) {
  return getDb().prepare('SELECT * FROM movies WHERE id = ?').get(id);
}

module.exports = { createMovie, getAllMovies, getMovieById };
