# 🎬 Movie Booking System — Backend API

A Node.js + Express backend service that manages movie show scheduling, seat availability, and the complete booking workflow with **double-booking prevention** via seat locking.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Booking Flow](#booking-flow)
- [Seat Locking Logic](#seat-locking-logic)
- [API Reference](#api-reference)
  - [Movies](#movies)
  - [Screens](#screens)
  - [Shows](#shows)
  - [Seats](#seats)
  - [Bookings](#bookings)
- [Database Schema](#database-schema)

---

## Tech Stack

| Layer        | Technology     |
|------------- |--------------- |
| Runtime      | Node.js        |
| Framework    | Express.js     |
| Database     | SQLite (via `better-sqlite3`) |
| UUID         | `uuid` v4      |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd movie-booking-system

# Install dependencies
npm install

# (Optional) Seed the database with sample data
npm run seed

# Start the server
npm start

# Or start in dev mode (auto-restart on file changes)
npm run dev
```

The server starts at **`http://localhost:3000`** by default.  
Override the port with the `PORT` environment variable.

---

## Booking Flow

The application follows a strict sequential workflow to ensure data integrity:

```
1.  Create Movie          POST /api/movies
          ↓
2.  Create Screen         POST /api/screens
          ↓
3.  Create Show           POST /api/shows
    (links Movie + Screen + Time; auto-generates seat layout)
          ↓
4.  Fetch Seat Layout     GET  /api/seats/:showId
          ↓
5.  Select & Lock Seats   POST /api/seats/:showId/lock
    (seats transition: AVAILABLE → LOCKED)
          ↓
6.  Create Booking        POST /api/bookings
    (booking created in INITIATED status)
          ↓
7a. Confirm Booking       PATCH /api/bookings/:id/confirm
    (seats transition: LOCKED → BOOKED, booking → CONFIRMED)
          — or —
7b. Cancel Booking        PATCH /api/bookings/:id/cancel
    (seats transition: LOCKED → AVAILABLE, booking → CANCELLED)
```

### Status Transitions

**Seat Statuses:**
| Status      | Meaning |
|------------ |-------- |
| `AVAILABLE` | Seat is free and can be selected |
| `LOCKED`    | Seat is temporarily reserved by a user (5-minute timeout) |
| `BOOKED`    | Seat is confirmed and cannot be changed |

**Booking Statuses:**
| Status      | Meaning |
|------------ |-------- |
| `INITIATED` | Booking created, payment pending |
| `CONFIRMED` | Payment successful, seats booked |
| `CANCELLED` | Booking cancelled, seats released |

---

## Seat Locking Logic

The locking mechanism prevents double-booking under concurrent access:

### How It Works

1. **Lock Request:** When a user selects seats, the system attempts to lock them atomically inside a SQLite transaction.
2. **Conflict Detection:** If any seat is already `LOCKED` (by another user) or `BOOKED`, the lock request for that seat is **rejected** with a reason.
3. **Idempotent Re-lock:** If the same user tries to lock a seat they already hold, the lock timestamp is refreshed (no error).
4. **Auto-Expiry:** Locks older than **5 minutes** are automatically released when the seat layout is fetched or a new lock is attempted. This prevents abandoned locks from blocking seats indefinitely.
5. **Transactional Safety:** All seat state transitions (lock, book, release) happen inside SQLite transactions, ensuring atomicity even under concurrent requests.

### Conflict Scenario

```
User A selects seat A1    →  POST /api/seats/:showId/lock  { seatLabels: ["A1"], userId: "userA" }
                          →  ✅ Seat A1 is now LOCKED by User A

User B selects seat A1    →  POST /api/seats/:showId/lock  { seatLabels: ["A1"], userId: "userB" }
                          →  ❌ 409 Conflict: "Seat is temporarily reserved by another user"

User A confirms booking   →  PATCH /api/bookings/:id/confirm
                          →  ✅ Seat A1 is now BOOKED
```

---

## API Reference

All endpoints return JSON in the format:
```json
{
  "success": true | false,
  "data": { ... },
  "error": "message (only on failure)"
}
```

### Health Check

| Method | Endpoint       | Description       |
|------- |--------------- |------------------ |
| GET    | `/api/health`  | Server health check |

---

### Movies

| Method | Endpoint          | Description        |
|------- |------------------ |------------------- |
| POST   | `/api/movies`     | Create a movie     |
| GET    | `/api/movies`     | List all movies    |
| GET    | `/api/movies/:id` | Get movie by ID    |

**POST /api/movies — Request Body:**
```json
{
  "title": "Avengers: Endgame",
  "duration": 181,
  "genre": "Action"
}
```

---

### Screens

| Method | Endpoint           | Description        |
|------- |------------------- |------------------- |
| POST   | `/api/screens`     | Create a screen    |
| GET    | `/api/screens`     | List all screens   |
| GET    | `/api/screens/:id` | Get screen by ID   |

**POST /api/screens — Request Body:**
```json
{
  "name": "Screen 1",
  "totalRows": 5,
  "seatsPerRow": 10
}
```

---

### Shows

| Method | Endpoint         | Description      |
|------- |----------------- |----------------- |
| POST   | `/api/shows`     | Create a show    |
| GET    | `/api/shows`     | List all shows   |
| GET    | `/api/shows/:id` | Get show by ID   |

**POST /api/shows — Request Body:**
```json
{
  "movieId": "<movie-uuid>",
  "screenId": "<screen-uuid>",
  "showTime": "6:00 PM",
  "showDate": "2026-06-17"
}
```

> Creating a show automatically generates the full seat layout (rows × columns) for that show.

---

### Seats

| Method | Endpoint                    | Description               |
|------- |---------------------------- |-------------------------- |
| GET    | `/api/seats/:showId`        | Get seat layout for show  |
| POST   | `/api/seats/:showId/lock`   | Lock selected seats       |
| POST   | `/api/seats/:showId/unlock` | Unlock selected seats     |

**POST /api/seats/:showId/lock — Request Body:**
```json
{
  "seatLabels": ["A1", "A2", "A3"],
  "userId": "user123"
}
```

**Response (conflict):**
```json
{
  "success": false,
  "message": "Some seats could not be locked",
  "data": {
    "success": false,
    "lockedSeats": ["A1"],
    "failedSeats": [
      { "label": "A2", "reason": "Seat is temporarily reserved by another user" }
    ]
  }
}
```

---

### Bookings

| Method | Endpoint                       | Description         |
|------- |------------------------------- |-------------------- |
| POST   | `/api/bookings`                | Create a booking    |
| GET    | `/api/bookings`                | List all bookings   |
| GET    | `/api/bookings?userId=xxx`     | List user bookings  |
| GET    | `/api/bookings/:id`            | Get booking by ID   |
| PATCH  | `/api/bookings/:id/confirm`    | Confirm booking     |
| PATCH  | `/api/bookings/:id/cancel`     | Cancel booking      |

**POST /api/bookings — Request Body:**
```json
{
  "showId": "<show-uuid>",
  "userId": "user123",
  "seatLabels": ["A1", "A2"]
}
```

> ⚠️ Seats **must** be locked by the user before creating a booking.

---

## Database Schema

```
movies
├── id (PK)
├── title
├── duration
├── genre
└── created_at

screens
├── id (PK)
├── name (UNIQUE)
├── total_rows
├── seats_per_row
└── created_at

shows
├── id (PK)
├── movie_id (FK → movies)
├── screen_id (FK → screens)
├── show_time
├── show_date
├── created_at
└── UNIQUE(screen_id, show_time, show_date)

seats
├── id (PK)
├── show_id (FK → shows)
├── seat_label (e.g. "A1")
├── row_label
├── col_number
├── status (AVAILABLE | LOCKED | BOOKED)
├── locked_by
├── locked_at
└── UNIQUE(show_id, seat_label)

bookings
├── id (PK)
├── show_id (FK → shows)
├── user_id
├── status (INITIATED | CONFIRMED | CANCELLED)
├── created_at
└── updated_at

booking_seats (junction)
├── booking_id (FK → bookings)
└── seat_id (FK → seats)
```

---

## Project Structure

```
movie-booking-system/
├── src/
│   ├── database/
│   │   └── db.js            # SQLite initialization & schema
│   ├── models/
│   │   ├── movieModel.js    # Movie CRUD operations
│   │   ├── screenModel.js   # Screen CRUD operations
│   │   ├── showModel.js     # Show creation with seat generation
│   │   ├── seatModel.js     # Seat locking & availability logic
│   │   └── bookingModel.js  # Booking lifecycle management
│   ├── routes/
│   │   ├── movieRoutes.js   # /api/movies endpoints
│   │   ├── screenRoutes.js  # /api/screens endpoints
│   │   ├── showRoutes.js    # /api/shows endpoints
│   │   ├── seatRoutes.js    # /api/seats endpoints
│   │   └── bookingRoutes.js # /api/bookings endpoints
│   ├── server.js            # Express app entry point
│   └── seed.js              # Database seeder
├── data/                    # SQLite database files (auto-created)
├── package.json
├── .gitignore
└── README.md
```

---

## License

ISC
