const express = require('express');
const router = express.Router();
const { getSeatLayout, lockSeats, unlockSeats } = require('../models/seatModel');

/**
 * GET /api/seats/:showId
 * Returns the full seat layout for a show with availability counts.
 */
router.get('/:showId', (req, res) => {
  try {
    const layout = getSeatLayout(req.params.showId);
    res.json({ success: true, data: layout });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/seats/:showId/lock
 * Body: { seatLabels: ["A1", "A2"], userId: "user123" }
 *
 * Attempts to lock the requested seats for the given user.
 * Returns which seats were locked and which failed (with reasons).
 */
router.post('/:showId/lock', (req, res) => {
  try {
    const { seatLabels, userId } = req.body;
    const { showId } = req.params;

    if (!seatLabels || !Array.isArray(seatLabels) || seatLabels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'seatLabels must be a non-empty array (e.g. ["A1", "A2"])',
      });
    }
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const result = lockSeats(showId, seatLabels, userId);

    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: 'Some seats could not be locked',
        data: result,
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/seats/:showId/unlock
 * Body: { seatLabels: ["A1"], userId: "user123" }
 *
 * Releases seats that were locked by the specified user.
 */
router.post('/:showId/unlock', (req, res) => {
  try {
    const { seatLabels, userId } = req.body;
    const { showId } = req.params;

    if (!seatLabels || !Array.isArray(seatLabels) || seatLabels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'seatLabels must be a non-empty array',
      });
    }
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const result = unlockSeats(showId, seatLabels, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
