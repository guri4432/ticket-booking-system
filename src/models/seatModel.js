const { getDb } = require('../database/db');

// Lock timeout in minutes — seats locked longer than this are auto-released
const LOCK_TIMEOUT_MINUTES = 5;

/**
 * Fetch the full seat layout for a show, grouped by row.
 * Automatically releases stale locks before returning.
 */
function getSeatLayout(showId) {
  const db = getDb();

  // Auto-release stale locks (seats locked longer than LOCK_TIMEOUT_MINUTES)
  releaseExpiredLocks(showId);

  const seats = db.prepare(`
    SELECT id, seat_label, row_label, col_number, status
    FROM seats
    WHERE show_id = ?
    ORDER BY row_label, col_number
  `).all(showId);

  // Group seats by row for a clean layout response
  const layout = {};
  for (const seat of seats) {
    if (!layout[seat.row_label]) {
      layout[seat.row_label] = [];
    }
    layout[seat.row_label].push({
      id: seat.id,
      label: seat.seat_label,
      column: seat.col_number,
      status: seat.status,
    });
  }

  return {
    showId,
    totalSeats: seats.length,
    available: seats.filter(s => s.status === 'AVAILABLE').length,
    locked: seats.filter(s => s.status === 'LOCKED').length,
    booked: seats.filter(s => s.status === 'BOOKED').length,
    layout,
  };
}

/**
 * Lock one or more seats for a user.
 * Returns { success, lockedSeats, failedSeats } so the caller knows which
 * seats could not be locked (already LOCKED or BOOKED).
 *
 * Uses a transaction to ensure atomicity — either all requested seats lock
 * or the entire operation reports partial success without leaving
 * inconsistent state.
 */
function lockSeats(showId, seatLabels, userId) {
  const db = getDb();

  // Auto-release stale locks first
  releaseExpiredLocks(showId);

  const lockResult = db.transaction(() => {
    const locked = [];
    const failed = [];

    for (const label of seatLabels) {
      const seat = db.prepare(`
        SELECT * FROM seats WHERE show_id = ? AND seat_label = ?
      `).get(showId, label);

      if (!seat) {
        failed.push({ label, reason: 'Seat does not exist' });
        continue;
      }

      if (seat.status === 'AVAILABLE') {
        db.prepare(`
          UPDATE seats
          SET status = 'LOCKED', locked_by = ?, locked_at = datetime('now')
          WHERE id = ?
        `).run(userId, seat.id);
        locked.push(label);
      } else if (seat.status === 'LOCKED' && seat.locked_by === userId) {
        // Same user re-locking — just refresh the timestamp
        db.prepare(`
          UPDATE seats SET locked_at = datetime('now') WHERE id = ?
        `).run(seat.id);
        locked.push(label);
      } else {
        failed.push({
          label,
          reason: seat.status === 'LOCKED'
            ? 'Seat is temporarily reserved by another user'
            : 'Seat is already booked',
        });
      }
    }

    return { locked, failed };
  })();

  return {
    success: lockResult.failed.length === 0,
    lockedSeats: lockResult.locked,
    failedSeats: lockResult.failed,
  };
}

/**
 * Unlock seats that were locked by a specific user.
 * Used when a user cancels selection before booking.
 */
function unlockSeats(showId, seatLabels, userId) {
  const db = getDb();

  const result = db.transaction(() => {
    const unlocked = [];
    const failed = [];

    for (const label of seatLabels) {
      const seat = db.prepare(`
        SELECT * FROM seats WHERE show_id = ? AND seat_label = ?
      `).get(showId, label);

      if (!seat) {
        failed.push({ label, reason: 'Seat does not exist' });
        continue;
      }

      if (seat.status === 'LOCKED' && seat.locked_by === userId) {
        db.prepare(`
          UPDATE seats
          SET status = 'AVAILABLE', locked_by = NULL, locked_at = NULL
          WHERE id = ?
        `).run(seat.id);
        unlocked.push(label);
      } else {
        failed.push({ label, reason: 'Seat is not locked by this user' });
      }
    }

    return { unlocked, failed };
  })();

  return result;
}

/**
 * Transition seats from LOCKED → BOOKED.
 * Only succeeds if every seat is currently LOCKED by the given user.
 */
function bookSeats(showId, seatLabels, userId) {
  const db = getDb();

  return db.transaction(() => {
    // Verify all seats are locked by this user
    for (const label of seatLabels) {
      const seat = db.prepare(`
        SELECT * FROM seats WHERE show_id = ? AND seat_label = ?
      `).get(showId, label);

      if (!seat) throw new Error(`Seat ${label} does not exist`);
      if (seat.status !== 'LOCKED' || seat.locked_by !== userId) {
        throw new Error(
          `Seat ${label} is not locked by this user (current status: ${seat.status})`
        );
      }
    }

    // All checks passed — mark as BOOKED
    const updateStmt = db.prepare(`
      UPDATE seats
      SET status = 'BOOKED', locked_by = NULL, locked_at = NULL
      WHERE show_id = ? AND seat_label = ?
    `);

    for (const label of seatLabels) {
      updateStmt.run(showId, label);
    }

    return true;
  })();
}

/**
 * Release seats back to AVAILABLE (used when a booking is cancelled).
 */
function releaseSeats(showId, seatLabels) {
  const db = getDb();

  const updateStmt = db.prepare(`
    UPDATE seats
    SET status = 'AVAILABLE', locked_by = NULL, locked_at = NULL
    WHERE show_id = ? AND seat_label = ?
  `);

  return db.transaction(() => {
    for (const label of seatLabels) {
      updateStmt.run(showId, label);
    }
  })();
}

/**
 * Auto-release seats that have been locked beyond the timeout threshold.
 */
function releaseExpiredLocks(showId) {
  const db = getDb();
  db.prepare(`
    UPDATE seats
    SET status = 'AVAILABLE', locked_by = NULL, locked_at = NULL
    WHERE show_id = ? AND status = 'LOCKED'
      AND locked_at < datetime('now', '-${LOCK_TIMEOUT_MINUTES} minutes')
  `).run(showId);
}

module.exports = {
  getSeatLayout,
  lockSeats,
  unlockSeats,
  bookSeats,
  releaseSeats,
  LOCK_TIMEOUT_MINUTES,
};
