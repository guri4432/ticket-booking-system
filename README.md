# 🎬 Movie Booking System (Full Stack)

A Full Stack Movie Ticket Booking System built using Node.js, Express.js, SQLite and a simple frontend UI.

The system allows users to:

- Create movies, screens and shows
- View seat availability
- Lock seats temporarily
- Book movie tickets
- Prevent double booking during concurrent access
- Confirm or cancel bookings

---

# 🚀 Features

### 🎥 Show Management

- Create movies
- Create screens
- Create shows by linking Movie + Screen + Time
- Automatically generate seat layouts

### 💺 Seat Availability

Each seat can have one of three states:

- AVAILABLE
- LOCKED
- BOOKED

Users can view seat layouts before booking.

---

### 🎫 Booking Workflow

Booking follows this sequence:

Movie → Screen → Show → Seat Selection → Lock Seat → Create Booking → Confirm/Cancel Booking

---

### 🔒 Double Booking Prevention

The application prevents multiple users from booking the same seat simultaneously.

Implemented using:

- Temporary seat locking
- Database validation
- SQLite transactions

---

# 🛠️ Tech Stack

## Backend

- Node.js
- Express.js
- SQLite
- better-sqlite3
- UUID

## Frontend

- HTML
- CSS
- JavaScript

---

# 📂 Project Structure

```text
movie-booking-system/

├── public/
│
│   ├── index.html
│
│   ├── css/
│   │   └── styles.css
│
│   └── js/
│       └── app.js
│
├── src/
│
│   ├── database/
│   │   └── db.js
│
│   ├── models/
│   │   ├── movieModel.js
│   │   ├── screenModel.js
│   │   ├── showModel.js
│   │   ├── seatModel.js
│   │   └── bookingModel.js
│
│   ├── routes/
│   │   ├── movieRoutes.js
│   │   ├── screenRoutes.js
│   │   ├── showRoutes.js
│   │   ├── seatRoutes.js
│   │   └── bookingRoutes.js
│
│   ├── seed.js
│   └── server.js
│
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

# ⚙️ Installation

Clone repository

```bash
git clone https://github.com/guri4432/ticket-booking-system.git

cd ticket-booking-system
```

Install dependencies

```bash
npm install
```

(Optional) Seed sample data

```bash
npm run seed
```

Start server

```bash
npm start
```

Development mode

```bash
npm run dev
```

Server runs at:

```text
http://localhost:3000
```

---

# 🎫 Booking Flow

## Step 1

Create Movie

```text
POST /api/movies
```

↓

## Step 2

Create Screen

```text
POST /api/screens
```

↓

## Step 3

Create Show

```text
POST /api/shows
```

↓

## Step 4

Fetch Seat Layout

```text
GET /api/seats/:showId
```

↓

## Step 5

Lock Seats

```text
POST /api/seats/:showId/lock
```

↓

## Step 6

Create Booking

```text
POST /api/bookings
```

↓

## Step 7

Confirm Booking

```text
PATCH /api/bookings/:id/confirm
```

OR

Cancel Booking

```text
PATCH /api/bookings/:id/cancel
```

---

# 💺 Seat States

| State | Description |
|------|-------------|
| AVAILABLE | Seat is free |
| LOCKED | Temporarily reserved |
| BOOKED | Successfully booked |

---

# 🎟️ Booking States

| State | Description |
|------|-------------|
| INITIATED | Booking created |
| CONFIRMED | Booking successful |
| CANCELLED | Booking cancelled |

---

# 🔐 Seat Locking Logic

When a user selects seats:

1. System locks the seats temporarily.
2. Other users cannot book those seats.
3. If booking is confirmed:

```text
LOCKED → BOOKED
```

4. If booking is cancelled:

```text
LOCKED → AVAILABLE
```

This prevents double booking.

---

# 📡 API Endpoints

## Movies

| Method | Endpoint |
|--------|----------|
| POST | /api/movies |
| GET | /api/movies |
| GET | /api/movies/:id |

---

## Screens

| Method | Endpoint |
|--------|----------|
| POST | /api/screens |
| GET | /api/screens |
| GET | /api/screens/:id |

---

## Shows

| Method | Endpoint |
|--------|----------|
| POST | /api/shows |
| GET | /api/shows |
| GET | /api/shows/:id |

---

## Seats

| Method | Endpoint |
|--------|----------|
| GET | /api/seats/:showId |
| POST | /api/seats/:showId/lock |
| POST | /api/seats/:showId/unlock |

---

## Bookings

| Method | Endpoint |
|--------|----------|
| POST | /api/bookings |
| GET | /api/bookings |
| GET | /api/bookings/:id |
| PATCH | /api/bookings/:id/confirm |
| PATCH | /api/bookings/:id/cancel |

---

# 🌐 Deployment

This project can be deployed on:

- Render
- Vercel (Frontend only)
- Netlify (Frontend only)

Recommended:

- Backend → Render
- Frontend → Render

---

# 👨‍💻 Author

Gursimran Singh

Chandigarh University

B.E CSE (AI & ML)

GitHub: https://github.com/guri4432

---

# 📄 License

ISC License