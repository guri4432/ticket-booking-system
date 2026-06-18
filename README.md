# 🎬 Movie Booking System — Full Stack Application

A full-stack movie ticket booking application built using **Node.js, Express.js, SQLite, HTML, CSS, and JavaScript**.

This application allows users to browse movie shows, view seat availability, select seats, create bookings, and confirm or cancel reservations. It also includes a robust backend system that prevents double booking through an efficient seat-locking mechanism.

---

## 📌 Table of Contents

* Project Overview
* Features
* Tech Stack
* Project Architecture
* Getting Started
* Booking Workflow
* Seat Locking Logic
* API Reference
* Database Schema
* Project Structure
* Future Improvements

---

# 📖 Project Overview

The Movie Booking System is a full-stack web application that simulates a real-world movie ticket booking platform.

The system manages:

* Movie creation
* Screen management
* Show scheduling
* Seat generation
* Seat availability
* Seat locking
* Booking creation
* Booking confirmation
* Booking cancellation
* Double-booking prevention

The project demonstrates how modern booking systems maintain data consistency when multiple users try to reserve the same seat simultaneously.

---

# ✨ Features

### Frontend Features

* Interactive user interface
* Dynamic movie and show display
* Seat selection interface
* Booking management pages

### Backend Features

* RESTful API architecture
* Movie management
* Screen management
* Show scheduling
* Dynamic seat generation
* Booking lifecycle management
* Automatic lock expiration
* Double-booking prevention

---

# 🛠️ Tech Stack

| Layer             | Technology                |
| ----------------- | ------------------------- |
| Frontend          | HTML, CSS, JavaScript     |
| Runtime           | Node.js                   |
| Backend Framework | Express.js                |
| Database          | SQLite (`better-sqlite3`) |
| UUID Generator    | uuid v4                   |

---

# 🏗️ Project Architecture

```text
User Interface

↓

Frontend (HTML, CSS, JavaScript)

↓

Express.js Server

↓

Routes

↓

Models

↓

SQLite Database
```

---

# 🚀 Getting Started

## Prerequisites

Install:

* Node.js (v18 or above)
* VS Code (recommended)

## Installation

Clone repository:

```bash
git clone <repository-url>

cd movie-booking-system
```

Install dependencies:

```bash
npm install
```

Seed sample data:

```bash
npm run seed
```

Start server:

```bash
npm start
```

Development mode:

```bash
npm run dev
```

Open browser:

```text
http://localhost:3000
```

---

# 🎟️ Booking Workflow

The application follows a structured workflow.

```text
Create Movie

↓

Create Screen

↓

Create Show

↓

Generate Seat Layout

↓

Fetch Available Seats

↓

Select Seats

↓

Lock Seats

↓

Create Booking

↓

Confirm Booking

or

Cancel Booking
```

---

# 🔄 Status Transitions

## Seat Status

| Status    | Meaning                      |
| --------- | ---------------------------- |
| AVAILABLE | Seat is available            |
| LOCKED    | Seat is temporarily reserved |
| BOOKED    | Seat is permanently booked   |

## Booking Status

| Status    | Meaning            |
| --------- | ------------------ |
| INITIATED | Booking created    |
| CONFIRMED | Booking successful |
| CANCELLED | Booking cancelled  |

---

# 🔒 Seat Locking Logic

The system prevents multiple users from booking the same seat simultaneously.

## How It Works

1. User selects seats.
2. The system attempts to lock those seats.
3. If seats are already locked or booked, the request is rejected.
4. Locks automatically expire after 5 minutes.
5. All operations are executed inside SQLite transactions.

### Example

```text
User A selects A1

↓

Seat A1 → LOCKED

↓

User B selects A1

↓

Request Rejected

↓

User A confirms booking

↓

Seat A1 → BOOKED
```

This mechanism prevents double booking.

---

# 🌐 API Reference

All APIs return JSON responses.

## Movies

| Method | Endpoint        |
| ------ | --------------- |
| POST   | /api/movies     |
| GET    | /api/movies     |
| GET    | /api/movies/:id |

---

## Screens

| Method | Endpoint         |
| ------ | ---------------- |
| POST   | /api/screens     |
| GET    | /api/screens     |
| GET    | /api/screens/:id |

---

## Shows

| Method | Endpoint       |
| ------ | -------------- |
| POST   | /api/shows     |
| GET    | /api/shows     |
| GET    | /api/shows/:id |

---

## Seats

| Method | Endpoint                  |
| ------ | ------------------------- |
| GET    | /api/seats/:showId        |
| POST   | /api/seats/:showId/lock   |
| POST   | /api/seats/:showId/unlock |

---

## Bookings

| Method | Endpoint                  |
| ------ | ------------------------- |
| POST   | /api/bookings             |
| GET    | /api/bookings             |
| GET    | /api/bookings/:id         |
| PATCH  | /api/bookings/:id/confirm |
| PATCH  | /api/bookings/:id/cancel  |

---

# 🗄️ Database Schema

## Movies

```text
id
title
duration
genre
created_at
```

## Screens

```text
id
name
total_rows
seats_per_row
created_at
```

## Shows

```text
id
movie_id
screen_id
show_time
show_date
created_at
```

## Seats

```text
id
show_id
seat_label
status
locked_by
locked_at
```

## Bookings

```text
id
show_id
user_id
status
created_at
updated_at
```

---

# 📁 Project Structure

```text
movie-booking-system/

public/
├── css/
├── js/
└── index.html

src/
├── database/
│   └── db.js

├── models/
│   ├── bookingModel.js
│   ├── movieModel.js
│   ├── screenModel.js
│   ├── seatModel.js
│   └── showModel.js

├── routes/
│   ├── bookingRoutes.js
│   ├── movieRoutes.js
│   ├── screenRoutes.js
│   ├── seatRoutes.js
│   └── showRoutes.js

├── server.js

└── seed.js

package.json

package-lock.json

README.md
```

---

# 🔮 Future Improvements

* User authentication
* Payment gateway integration
* Admin dashboard
* Email notifications
* Movie posters and images
* Search and filter functionality
* Cloud database deployment

---

# 👨‍💻 Author

**Gursimran Singh**

B.Tech (AI & ML) | Chandigarh University

---

# 📄 License

ISC
