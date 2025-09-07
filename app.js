
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const upload = multer();
const PORT = process.env.PORT || 8000;
const DB_FILE = process.env.SQLITE_FILE || 'pets.sqlite';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function getDb() {
  return new sqlite3.Database(DB_FILE, (err) => {
    if (err) console.error('DB open error:', err.message);
  });
}

app.get('/pets', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM pets', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
    db.close();
  });
});

app.post('/pets', upload.none(), (req, res) => {
  const { name, type, age, owner } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name y type son requeridos' });
  const db = getDb();
  const sql = 'INSERT INTO pets (name, type, age, owner) VALUES (?, ?, ?, ?)';
  db.run(sql, [name, type, age || null, owner || null], function(err) {
    if (err) return res.status(500).json({ error: 'DB insert error' });
    res.status(201).json({ id: this.lastID, name, type, age: age || null, owner: owner || null });
    db.close();
  });
});

function fetchPet(db, id, cb) {
  db.get('SELECT * FROM pets WHERE id = ?', [id], (err, row) => cb(err, row));
}

app.get('/pet/:id', (req, res) => {
  const db = getDb();
  fetchPet(db, req.params.id, (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
    db.close();
  });
});

app.put('/pet/:id', upload.none(), (req, res) => {
  const { name, type, age, owner } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name y type son requeridos' });
  const db = getDb();
  const sql = 'UPDATE pets SET name = ?, type = ?, age = ?, owner = ? WHERE id = ?';
  db.run(sql, [name, type, age || null, owner || null, req.params.id], function(err) {
    if (err) { db.close(); return res.status(500).json({ error: 'DB update error' }); }
    if (this.changes === 0) { db.close(); return res.status(404).json({ error: 'Not found' }); }
    fetchPet(db, req.params.id, (err2, row) => {
      if (err2) return res.status(500).json({ error: 'DB error after update' });
      res.json(row);
      db.close();
    });
  });
});

app.delete('/pet/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM pets WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'DB delete error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: `Pet ${req.params.id} deleted` });
    db.close();
  });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Pets API listening on http://0.0.0.0:${PORT}`));
