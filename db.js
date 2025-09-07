
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
dotenv.config();
const DB_FILE = process.env.SQLITE_FILE || 'pets.sqlite';

const db = new sqlite3.Database(DB_FILE);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    age INTEGER,
    owner TEXT
  )`);
  const stmt = db.prepare('INSERT INTO pets (name, type, age, owner) VALUES (?, ?, ?, ?)');
  stmt.run('Luna', 'dog', 4, 'Elizabeth');
  stmt.run('Michi', 'cat', 2, 'Jorge');
  stmt.finalize();
});
db.close(() => console.log(`SQLite DB initialized at ${DB_FILE}`));
