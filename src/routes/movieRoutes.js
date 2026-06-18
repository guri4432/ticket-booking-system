const express = require('express');
const router = express.Router();
const { createMovie, getAllMovies, getMovieById } = require('../models/movieModel');

/**
 * POST /api/movies
 * Body: { title, duration, genre? }
 */
router.post('/', (req, res) => {
  try {
    const { title, duration, genre } = req.body;

    if (!title || !duration) {
      return res.status(400).json({
        success: false,
        error: 'title and duration are required',
      });
    }

    const movie = createMovie({ title, duration: Number(duration), genre });
    res.status(201).json({ success: true, data: movie });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/movies
 */
router.get('/', (_req, res) => {
  try {
    const movies = getAllMovies();
    res.json({ success: true, data: movies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/movies/:id
 */
router.get('/:id', (req, res) => {
  try {
    const movie = getMovieById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }
    res.json({ success: true, data: movie });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
