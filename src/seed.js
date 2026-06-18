/**
 * Seed script — populates the database with sample data for testing.
 * Run with: npm run seed
 */

const { initializeDatabase, getDb } = require('./database/db');
const { createMovie } = require('./models/movieModel');
const { createScreen } = require('./models/screenModel');
const { createShow } = require('./models/showModel');

function seed() {
  console.log('🌱 Seeding database...\n');
  initializeDatabase();

  // ── Movies ────────────────────────────────────────────────────────────
  const movies = [
    { title: 'Avengers: Endgame', duration: 181, genre: 'Action' },
    { title: 'Inception', duration: 148, genre: 'Sci-Fi' },
    { title: 'The Dark Knight', duration: 152, genre: 'Action' },
    { title: 'Interstellar', duration: 169, genre: 'Sci-Fi' },
  ];

  const createdMovies = movies.map(m => {
    const movie = createMovie(m);
    console.log(`  🎬 Created movie: ${movie.title} (${movie.id})`);
    return movie;
  });

  // ── Screens ───────────────────────────────────────────────────────────
  const screens = [
    { name: 'Screen 1', totalRows: 5, seatsPerRow: 10 },
    { name: 'Screen 2', totalRows: 4, seatsPerRow: 8 },
    { name: 'Screen 3', totalRows: 6, seatsPerRow: 12 },
  ];

  const createdScreens = screens.map(s => {
    const screen = createScreen(s);
    console.log(`  🖥️  Created screen: ${screen.name} (${screen.id})`);
    return screen;
  });

  // ── Shows ─────────────────────────────────────────────────────────────
  const showConfigs = [
    { movieIdx: 0, screenIdx: 0, showTime: '10:00 AM', showDate: '2026-06-17' },
    { movieIdx: 0, screenIdx: 1, showTime: '02:00 PM', showDate: '2026-06-17' },
    { movieIdx: 1, screenIdx: 0, showTime: '06:00 PM', showDate: '2026-06-17' },
    { movieIdx: 2, screenIdx: 2, showTime: '09:00 PM', showDate: '2026-06-17' },
    { movieIdx: 3, screenIdx: 1, showTime: '06:00 PM', showDate: '2026-06-18' },
  ];

  showConfigs.forEach(({ movieIdx, screenIdx, showTime, showDate }) => {
    const show = createShow({
      movieId: createdMovies[movieIdx].id,
      screenId: createdScreens[screenIdx].id,
      showTime,
      showDate,
    });
    console.log(`  🎟️  Created show: ${show.movie_title} @ ${show.screen_name} ${showTime} on ${showDate}`);
  });

  // Print summary
  const db = getDb();
  const movieCount = db.prepare('SELECT COUNT(*) AS c FROM movies').get().c;
  const screenCount = db.prepare('SELECT COUNT(*) AS c FROM screens').get().c;
  const showCount = db.prepare('SELECT COUNT(*) AS c FROM shows').get().c;
  const seatCount = db.prepare('SELECT COUNT(*) AS c FROM seats').get().c;

  console.log('\n✅ Seeding complete!');
  console.log(`   Movies:  ${movieCount}`);
  console.log(`   Screens: ${screenCount}`);
  console.log(`   Shows:   ${showCount}`);
  console.log(`   Seats:   ${seatCount}`);
}

seed();
