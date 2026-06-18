/* ═══════════════════════════════════════════════════════════════
   CineBook — Frontend Application Logic
   Single-page app driving the movie booking workflow
   ═══════════════════════════════════════════════════════════════ */

const API = window.location.origin + '/api';

// ── State ─────────────────────────────────────────────────────
const state = {
  userId: 'user_' + Math.random().toString(36).substring(2, 8),
  currentShow: null,
  selectedSeats: [],
  currentBookingId: null,
};

// Set user display on load
document.addEventListener('DOMContentLoaded', () => {
  const initial = state.userId.charAt(5).toUpperCase();
  document.getElementById('userAvatar').textContent = initial;
  document.getElementById('userName').textContent = state.userId;
  loadShows();
});

/* ═══════════════════════════════════════════════════════════════
   Navigation
   ═══════════════════════════════════════════════════════════════ */

function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show target page
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  // Load data for the page
  if (page === 'shows') loadShows();
  if (page === 'bookings') loadBookings();

  // Reset selections when navigating away from seats
  if (page !== 'seats') {
    state.selectedSeats = [];
  }
}

/* ═══════════════════════════════════════════════════════════════
   API Helpers
   ═══════════════════════════════════════════════════════════════ */

async function apiCall(endpoint, options = {}) {
  const url = `${API}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data.data;
}

function showLoading() {
  document.getElementById('loadingOverlay').classList.add('visible');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('visible');
}

/* ═══════════════════════════════════════════════════════════════
   Toast Notifications
   ═══════════════════════════════════════════════════════════════ */

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('exit');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ═══════════════════════════════════════════════════════════════
   Shows Page
   ═══════════════════════════════════════════════════════════════ */

async function loadShows() {
  const grid = document.getElementById('showsGrid');

  try {
    const shows = await apiCall('/shows');

    if (shows.length === 0) {
      grid.innerHTML = `
        <div class="empty-bookings" style="grid-column: 1/-1">
          <div class="empty-bookings-icon">🎬</div>
          <h3>No Shows Available</h3>
          <p>Run <code>npm run seed</code> to add sample shows</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = shows.map(show => `
      <div class="show-card" onclick="selectShow('${show.id}')" id="show-${show.id}">
        <span class="show-card-genre">${escapeHtml(show.genre || 'General')}</span>
        <h2 class="show-card-title">${escapeHtml(show.movie_title)}</h2>
        <div class="show-card-meta">
          <div class="meta-item">
            <div class="meta-icon">🕐</div>
            <div>
              <div class="meta-label">Showtime</div>
              <div class="meta-value">${escapeHtml(show.show_time)}</div>
            </div>
          </div>
          <div class="meta-item">
            <div class="meta-icon">📅</div>
            <div>
              <div class="meta-label">Date</div>
              <div class="meta-value">${formatDate(show.show_date)}</div>
            </div>
          </div>
          <div class="meta-item">
            <div class="meta-icon">🖥️</div>
            <div>
              <div class="meta-label">Screen</div>
              <div class="meta-value">${escapeHtml(show.screen_name)}</div>
            </div>
          </div>
          <div class="meta-item">
            <div class="meta-icon">⏱️</div>
            <div>
              <div class="meta-label">Duration</div>
              <div class="meta-value">${show.duration} min</div>
            </div>
          </div>
        </div>
        <div class="show-card-footer">
          <span class="seats-badge">🎟️ Select Seats →</span>
          <div class="book-arrow">
            <svg width="16" height="16" fill="none" stroke="white" stroke-width="2"><path d="M6 12l4-4-4-4"/></svg>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    grid.innerHTML = `<p style="color:var(--danger)">Failed to load shows: ${escapeHtml(err.message)}</p>`;
  }
}

async function selectShow(showId) {
  showLoading();
  try {
    const show = await apiCall(`/shows/${showId}`);
    state.currentShow = show;
    state.selectedSeats = [];
    navigateTo('seats');
    renderShowBanner(show);
    await loadSeatLayout(showId);
  } catch (err) {
    showToast('Failed to load show details', 'error');
  } finally {
    hideLoading();
  }
}

function renderShowBanner(show) {
  document.getElementById('showInfoBanner').innerHTML = `
    <h2 class="banner-title">${escapeHtml(show.movie_title)}</h2>
    <div class="banner-divider"></div>
    <div class="banner-detail">
      <span class="banner-detail-label">Screen</span>
      <span class="banner-detail-value">${escapeHtml(show.screen_name)}</span>
    </div>
    <div class="banner-divider"></div>
    <div class="banner-detail">
      <span class="banner-detail-label">Time</span>
      <span class="banner-detail-value">${escapeHtml(show.show_time)}</span>
    </div>
    <div class="banner-divider"></div>
    <div class="banner-detail">
      <span class="banner-detail-label">Date</span>
      <span class="banner-detail-value">${formatDate(show.show_date)}</span>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════
   Seat Map
   ═══════════════════════════════════════════════════════════════ */

async function loadSeatLayout(showId) {
  try {
    const data = await apiCall(`/seats/${showId}`);
    renderSeatMap(data.layout);
    updateSummary();
  } catch (err) {
    showToast('Failed to load seat layout', 'error');
  }
}

function renderSeatMap(layout) {
  const map = document.getElementById('seatMap');
  const rows = Object.keys(layout).sort();

  map.innerHTML = rows.map(rowLabel => {
    const seats = layout[rowLabel];
    return `
      <div class="seat-row">
        <span class="row-label">${rowLabel}</span>
        ${seats.map(seat => {
          const status = seat.status.toLowerCase();
          const isSelected = state.selectedSeats.includes(seat.label);
          const cls = isSelected ? 'selected' : status;
          const clickable = status === 'available' || isSelected;
          return `
            <div
              class="seat ${cls}"
              data-label="${seat.label}"
              data-status="${status}"
              ${clickable ? `onclick="toggleSeat('${seat.label}')"` : ''}
              title="${seat.label} — ${seat.status}"
            >${seat.label.replace(rowLabel, '')}</div>
          `;
        }).join('')}
        <span class="row-label">${rowLabel}</span>
      </div>
    `;
  }).join('');
}

function toggleSeat(label) {
  const idx = state.selectedSeats.indexOf(label);
  if (idx > -1) {
    state.selectedSeats.splice(idx, 1);
  } else {
    if (state.selectedSeats.length >= 10) {
      showToast('Maximum 10 seats per booking', 'warning');
      return;
    }
    state.selectedSeats.push(label);
  }

  // Update seat visual
  const seatEl = document.querySelector(`.seat[data-label="${label}"]`);
  if (seatEl) {
    if (idx > -1) {
      seatEl.classList.remove('selected');
      seatEl.classList.add('available');
    } else {
      seatEl.classList.remove('available');
      seatEl.classList.add('selected');
    }
  }

  updateSummary();
}

function updateSummary() {
  const details = document.getElementById('summaryDetails');
  const actions = document.getElementById('summaryActions');

  if (state.selectedSeats.length === 0) {
    details.innerHTML = '<p class="empty-state">Select seats to continue</p>';
    actions.style.display = 'none';
    return;
  }

  // Sort seats for nice display
  const sorted = [...state.selectedSeats].sort((a, b) => {
    const rowA = a[0], rowB = b[0];
    if (rowA !== rowB) return rowA.localeCompare(rowB);
    return parseInt(a.slice(1)) - parseInt(b.slice(1));
  });

  details.innerHTML = `
    <div class="summary-row">
      <span class="summary-label">Movie</span>
      <span class="summary-value">${escapeHtml(state.currentShow.movie_title)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Show</span>
      <span class="summary-value">${escapeHtml(state.currentShow.show_time)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Seats (${sorted.length})</span>
    </div>
    <div class="summary-seats">
      ${sorted.map(s => `<span class="seat-chip">${s}</span>`).join('')}
    </div>
  `;

  actions.style.display = 'block';
}

/* ═══════════════════════════════════════════════════════════════
   Booking Workflow
   ═══════════════════════════════════════════════════════════════ */

async function handleLockSeats() {
  if (state.selectedSeats.length === 0) return;

  const btn = document.getElementById('btnLockSeats');
  btn.disabled = true;
  btn.textContent = 'Locking…';

  try {
    // Step 1: Lock the seats
    await apiCall(`/seats/${state.currentShow.id}/lock`, {
      method: 'POST',
      body: {
        seatLabels: state.selectedSeats,
        userId: state.userId,
      },
    });

    showToast(`${state.selectedSeats.length} seat(s) locked successfully!`, 'success');

    // Step 2: Create booking (INITIATED)
    const booking = await apiCall('/bookings', {
      method: 'POST',
      body: {
        showId: state.currentShow.id,
        userId: state.userId,
        seatLabels: state.selectedSeats,
      },
    });

    state.currentBookingId = booking.id;

    // Step 3: Show confirmation page
    showConfirmPage(booking);

  } catch (err) {
    showToast(err.message, 'error');
    // Refresh seat layout to show updated statuses
    await loadSeatLayout(state.currentShow.id);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lock Seats';
  }
}

function showConfirmPage(booking) {
  const sorted = [...booking.seats].sort();

  document.getElementById('confirmContainer').innerHTML = `
    <div class="confirm-card" id="confirmCard">
      <div class="confirm-icon">🎟️</div>
      <h2 class="confirm-title">Confirm Your Booking?</h2>
      <p class="confirm-subtitle">Your seats are locked and reserved for you</p>

      <div class="confirm-details">
        <div class="confirm-detail-row">
          <span class="confirm-detail-label">Movie</span>
          <span class="confirm-detail-value">${escapeHtml(state.currentShow.movie_title)}</span>
        </div>
        <div class="confirm-detail-row">
          <span class="confirm-detail-label">Screen</span>
          <span class="confirm-detail-value">${escapeHtml(state.currentShow.screen_name)}</span>
        </div>
        <div class="confirm-detail-row">
          <span class="confirm-detail-label">Time</span>
          <span class="confirm-detail-value">${escapeHtml(state.currentShow.show_time)} · ${formatDate(state.currentShow.show_date)}</span>
        </div>
        <div class="confirm-detail-row">
          <span class="confirm-detail-label">Seats</span>
          <span class="confirm-detail-value">${sorted.join(', ')}</span>
        </div>
        <div class="confirm-detail-row">
          <span class="confirm-detail-label">Quantity</span>
          <span class="confirm-detail-value">${sorted.length} ticket(s)</span>
        </div>
      </div>

      <div class="confirm-actions" id="confirmActions">
        <button class="btn btn-danger" onclick="handleCancelBooking()">Cancel</button>
        <button class="btn btn-success" onclick="handleConfirmBooking()">✓ Confirm Booking</button>
      </div>

      <div class="booking-id-display">Booking ID: ${booking.id}</div>
    </div>
  `;

  navigateTo('confirm');
}

async function handleConfirmBooking() {
  showLoading();
  try {
    await apiCall(`/bookings/${state.currentBookingId}/confirm`, {
      method: 'PATCH',
    });

    // Show success state
    const card = document.getElementById('confirmCard');
    card.classList.add('ticket-confirmed');

    document.getElementById('confirmContainer').innerHTML = `
      <div class="confirm-card ticket-confirmed">
        <div class="confirm-icon">🎉</div>
        <h2 class="confirm-title">Booking Confirmed!</h2>
        <p class="confirm-subtitle">Enjoy your movie. Your tickets are ready!</p>

        <div class="confirm-details">
          <div class="confirm-detail-row">
            <span class="confirm-detail-label">Movie</span>
            <span class="confirm-detail-value">${escapeHtml(state.currentShow.movie_title)}</span>
          </div>
          <div class="confirm-detail-row">
            <span class="confirm-detail-label">Time</span>
            <span class="confirm-detail-value">${escapeHtml(state.currentShow.show_time)} · ${formatDate(state.currentShow.show_date)}</span>
          </div>
          <div class="confirm-detail-row">
            <span class="confirm-detail-label">Screen</span>
            <span class="confirm-detail-value">${escapeHtml(state.currentShow.screen_name)}</span>
          </div>
          <div class="confirm-detail-row">
            <span class="confirm-detail-label">Seats</span>
            <span class="confirm-detail-value">${state.selectedSeats.sort().join(', ')}</span>
          </div>
          <div class="confirm-detail-row">
            <span class="confirm-detail-label">Status</span>
            <span class="confirm-detail-value" style="color:var(--success)">✓ CONFIRMED</span>
          </div>
        </div>

        <div class="confirm-actions">
          <button class="btn btn-primary btn-lg" onclick="navigateTo('shows')">Browse More Shows</button>
        </div>

        <div class="booking-id-display">Booking ID: ${state.currentBookingId}</div>
      </div>
    `;

    showToast('Booking confirmed! Enjoy the movie 🎬', 'success');
    state.selectedSeats = [];
    state.currentBookingId = null;

  } catch (err) {
    showToast(`Confirmation failed: ${err.message}`, 'error');
  } finally {
    hideLoading();
  }
}

async function handleCancelBooking() {
  showLoading();
  try {
    await apiCall(`/bookings/${state.currentBookingId}/cancel`, {
      method: 'PATCH',
    });

    showToast('Booking cancelled — seats released', 'info');
    state.selectedSeats = [];
    state.currentBookingId = null;
    navigateTo('shows');

  } catch (err) {
    showToast(`Cancel failed: ${err.message}`, 'error');
  } finally {
    hideLoading();
  }
}

/* ═══════════════════════════════════════════════════════════════
   My Bookings Page
   ═══════════════════════════════════════════════════════════════ */

async function loadBookings() {
  const list = document.getElementById('bookingsList');

  try {
    const bookings = await apiCall(`/bookings?userId=${state.userId}`);

    if (bookings.length === 0) {
      list.innerHTML = `
        <div class="empty-bookings">
          <div class="empty-bookings-icon">🎫</div>
          <h3>No Bookings Yet</h3>
          <p style="color:var(--text-muted)">Book a show to see your tickets here</p>
          <button class="btn btn-primary" style="margin-top:20px" onclick="navigateTo('shows')">Browse Shows</button>
        </div>
      `;
      return;
    }

    // Fetch full details for each booking
    const detailed = await Promise.all(
      bookings.map(b => apiCall(`/bookings/${b.id}`))
    );

    list.innerHTML = detailed.map(booking => {
      const statusClass = booking.status.toLowerCase();
      const seats = booking.seats
        ? booking.seats.map(s => s.seat_label || s).join(', ')
        : '—';

      return `
        <div class="booking-card">
          <div class="booking-info">
            <div class="booking-movie-title">${escapeHtml(booking.movie_title)}</div>
            <div class="booking-meta">
              <span>🖥️ ${escapeHtml(booking.screen_name)}</span>
              <span>🕐 ${escapeHtml(booking.show_time)}</span>
              <span>📅 ${formatDate(booking.show_date)}</span>
            </div>
            <div class="booking-seats-list">
              ${(booking.seats || []).map(s => {
                const label = s.seat_label || s;
                return `<span class="seat-chip">${escapeHtml(label)}</span>`;
              }).join('')}
            </div>
          </div>
          <span class="status-badge status-${statusClass}">${booking.status}</span>
        </div>
      `;
    }).join('');

  } catch (err) {
    list.innerHTML = `<p style="color:var(--danger)">Failed to load bookings: ${escapeHtml(err.message)}</p>`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
