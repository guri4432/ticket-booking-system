const express = require('express');
const router = express.Router();
const { createShow, getAllShows, getShowById } = require('../models/showModel');
const { getMovieById } = require('../models/movieModel');
const { getScreenById } = require('../models/screenModel');

/**
 * POST /api/shows
 * Body: { movieId, screenId, showTime, showDate }
 */
router.post('/', (req, res) => {
  try {
    const { movieId, screenId, showTime, showDate } = req.body;

    if (!movieId || !screenId || !showTime || !showDate) {
      return res.status(400).json({
        success: false,
        error: 'movieId, screenId, showTime, and showDate are all required',
      });
    }

    // Validate that movie and screen exist
    if (!getMovieById(movieId)) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }
    if (!getScreenById(screenId)) {
      return res.status(404).json({ success: false, error: 'Screen not found' });
    }

    const show = createShow({ movieId, screenId, showTime, showDate });
    res.status(201).json({ success: true, data: show });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        success: false,
        error: 'A show already exists for this screen at the given date & time',
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/shows
 */
router.get('/', (_req, res) => {
  try {
    const shows = getAllShows();
    res.json({ success: true, data: shows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/shows/:id
 */
router.get('/:id', (req, res) => {
  try {
    const show = getShowById(req.params.id);
    if (!show) {
      return res.status(404).json({ success: false, error: 'Show not found' });
    }
    res.json({ success: true, data: show });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
