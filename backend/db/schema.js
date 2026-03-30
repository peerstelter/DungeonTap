const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'dungeontap.db')

let db

function getDb() {
  if (db) return db
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
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

    CREATE INDEX IF NOT EXISTS idx_runs_score     ON runs (score DESC);
    CREATE INDEX IF NOT EXISTS idx_runs_daily     ON runs (daily_date, score DESC);
  `)
}

module.exports = { getDb }
