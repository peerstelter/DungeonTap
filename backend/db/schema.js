const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs = require('fs')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'dungeontap.db')

let db

function getDb() {
  if (db) return db
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  db = new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return db
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL DEFAULT 'Anonym',
      class     TEXT    NOT NULL,
      floor     INTEGER NOT NULL DEFAULT 1,
      xp        INTEGER NOT NULL DEFAULT 0,
      gold      INTEGER NOT NULL DEFAULT 0,
      score     INTEGER NOT NULL DEFAULT 0,
      seed      INTEGER,
      is_daily  INTEGER NOT NULL DEFAULT 0,
      daily_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_runs_score ON runs (score DESC);
    CREATE INDEX IF NOT EXISTS idx_runs_daily ON runs (daily_date, score DESC);
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    UNIQUE NOT NULL,
      pin_hash   TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Additive migrations — safe to run on every startup
  const addColumn = (col, def) => {
    try { db.exec(`ALTER TABLE runs ADD COLUMN ${col} ${def}`) } catch {}
  }
  addColumn('kills', 'INTEGER NOT NULL DEFAULT 0')
  addColumn('level', 'INTEGER NOT NULL DEFAULT 1')
}

module.exports = { getDb }
