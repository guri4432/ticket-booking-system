const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { bookSeats, releaseSeats } = require('./seatModel');

/**
 * Create a new booking in INITIATED status.
 * Expects that the seats have already been LOCKED by the user.
 *
 * @param {{ showId: string, userId: string, seatLabels: string[] }} data
 */
function createBooking({ showId, userId, seatLabels }) {
  const db = getDb();
  const bookingId = uuidv4();

  return db.transaction(() => {
    // 1) Verify each requested seat is currently LOCKED by this user
    const seatIds = [];
    for (const label of seatLabels) {
      const seat = db.prepare(`
        SELECT * FROM seats WHERE show_id = ? AND seat_label = ?
      `).get(showId, label);

      if (!seat) {
        throw new Error(`Seat ${label} does not exist for this show`);
      }
      if (seat.status !== 'LOCKED' || seat.locked_by !== userId) {
        throw new Error(
          `Seat ${label} is not locked by user ${userId}. ` +
          `Current status: ${seat.status}, locked_by: ${seat.locked_by || 'none'}`
        );
      }
      seatIds.push(seat.id);
    }

    // 2) Create the booking record
    db.prepare(`
      INSERT INTO bookings (id, show_id, user_id, status) VALUES (?, ?, ?, 'INITIATED')
    `).run(bookingId, showId, userId);

    // 3) Link seats to booking
    const linkStmt = db.prepare(`
      INSERT INTO booking_seats (booking_id, seat_id) VALUES (?, ?)
    `);
    for (const seatId of seatIds) {
      linkStmt.run(bookingId, seatId);
    }

    return {
      id: bookingId,
      showId,
      userId,
      status: 'INITIATED',
      seats: seatLabels,
    };
  })();
}

/**
 * Confirm a booking: INITIATED → CONFIRMED.
 * Transitions the linked seats from LOCKED → BOOKED.
 */
function confirmBooking(bookingId) {
  const db = getDb();

  return db.transaction(() => {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'INITIATED') {
      throw new Error(`Cannot confirm booking in status: ${booking.status}`);
    }

    // Fetch the seat labels linked to this booking
    const seatRows = db.prepare(`
      SELECT s.seat_label
      FROM booking_seats bs
      JOIN seats s ON s.id = bs.seat_id
      WHERE bs.booking_id = ?
    `).all(bookingId);

    const seatLabels = seatRows.map(r => r.seat_label);

    // Transition seats LOCKED → BOOKED
    bookSeats(booking.show_id, seatLabels, booking.user_id);

    // Update booking status
    db.prepare(`
      UPDATE bookings SET status = 'CONFIRMED', updated_at = datetime('now') WHERE id = ?
    `).run(bookingId);

    return {
      id: bookingId,
      status: 'CONFIRMED',
      seats: seatLabels,
    };
  })();
}

/**
 * Cancel a booking: INITIATED → CANCELLED.
 * Releases the linked seats back to AVAILABLE.
 */
function cancelBooking(bookingId) {
  const db = getDb();

  return db.transaction(() => {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'INITIATED') {
      throw new Error(`Cannot cancel booking in status: ${booking.status}`);
    }

    // Fetch the seat labels linked to this booking
    const seatRows = db.prepare(`
      SELECT s.seat_label
      FROM booking_seats bs
      JOIN seats s ON s.id = bs.seat_id
      WHERE bs.booking_id = ?
    `).all(bookingId);

    const seatLabels = seatRows.map(r => r.seat_label);

    // Release seats back to AVAILABLE
    releaseSeats(booking.show_id, seatLabels);

    // Update booking status
    db.prepare(`
      UPDATE bookings SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ?
    `).run(bookingId);

    return {
      id: bookingId,
      status: 'CANCELLED',
      seats: seatLabels,
    };
  })();
}

/**
 * Fetch a booking by id with its linked seats.
 */
function getBookingById(bookingId) {
  const db = getDb();

  const booking = db.prepare(`
    SELECT b.*, m.title AS movie_title, sc.name AS screen_name,
           sh.show_time, sh.show_date
    FROM bookings b
    JOIN shows sh ON sh.id = b.show_id
    JOIN movies m  ON m.id  = sh.movie_id
    JOIN screens sc ON sc.id = sh.screen_id
    WHERE b.id = ?
  `).get(bookingId);

  if (!booking) return null;

  const seats = db.prepare(`
    SELECT s.seat_label, s.status
    FROM booking_seats bs
    JOIN seats s ON s.id = bs.seat_id
    WHERE bs.booking_id = ?
    ORDER BY s.row_label, s.col_number
  `).all(bookingId);

  return { ...booking, seats };
}

/**
 * Fetch all bookings (optionally filtered by user).
 */
function getAllBookings(userId) {
  const db = getDb();

  let query = `
    SELECT b.*, m.title AS movie_title, sc.name AS screen_name,
           sh.show_time, sh.show_date
    FROM bookings b
    JOIN shows sh ON sh.id = b.show_id
    JOIN movies m  ON m.id  = sh.movie_id
    JOIN screens sc ON sc.id = sh.screen_id
  `;

  if (userId) {
    query += ` WHERE b.user_id = ?`;
    return db.prepare(query + ' ORDER BY b.created_at DESC').all(userId);
  }

  return db.prepare(query + ' ORDER BY b.created_at DESC').all();
}

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  getBookingById,
  getAllBookings,
};
