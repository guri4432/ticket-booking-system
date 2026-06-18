const express = require('express');
const router = express.Router();
const {
  createBooking,
  confirmBooking,
  cancelBooking,
  getBookingById,
  getAllBookings,
} = require('../models/bookingModel');

/**
 * POST /api/bookings
 * Body: { showId, userId, seatLabels: ["A1", "A2"] }
 *
 * Creates a booking in INITIATED status.
 * Pre-condition: seats must already be LOCKED by the user.
 */
router.post('/', (req, res) => {
  try {
    const { showId, userId, seatLabels } = req.body;

    if (!showId || !userId || !seatLabels || seatLabels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'showId, userId, and seatLabels (non-empty array) are required',
      });
    }

    const booking = createBooking({ showId, userId, seatLabels });
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/confirm
 * Transitions: INITIATED → CONFIRMED, seats LOCKED → BOOKED
 */
router.patch('/:id/confirm', (req, res) => {
  try {
    const result = confirmBooking(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/cancel
 * Transitions: INITIATED → CANCELLED, seats → AVAILABLE
 */
router.patch('/:id/cancel', (req, res) => {
  try {
    const result = cancelBooking(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bookings/:id
 */
router.get('/:id', (req, res) => {
  try {
    const booking = getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/bookings?userId=xxx
 */
router.get('/', (req, res) => {
  try {
    const bookings = getAllBookings(req.query.userId);
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
