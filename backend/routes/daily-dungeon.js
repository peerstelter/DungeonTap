const express = require('express')
const { getDb }   = require('../db/schema')
const { hashPin } = require('./users')

const router = express.Router()

// GET /api/daily-dungeon/seed
// Returns today's shared dungeon seed so all players get the same run
router.get('/seed', (req, res) => {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const seed = hashSeed(`dungeontap-daily-${today}`)
  res.json({ date: today, seed })
})

// GET /api/daily-dungeon/hero?name=...
// Returns today's saved hero for the given username (no auth — stats are not sensitive)
router.get('/hero', (req, res) => {
  const name = String(req.query.name || '').trim()
  if (!name) return res.json({ hero: null })

  const today = new Date().toISOString().slice(0, 10)
  const db  = getDb()
  const row = db.prepare(
    'SELECT hero_data FROM daily_heroes WHERE user_name = ? AND date = ?'
  ).get(name, today)

  if (!row) return res.json({ hero: null })
  try {
    return res.json({ hero: JSON.parse(row.hero_data) })
  } catch {
    return res.json({ hero: null })
  }
})

// POST /api/daily-dungeon/hero  { name, pin, hero }
// Upserts the daily hero for the given user — PIN required to prevent spoofing
router.post('/hero', (req, res) => {
  const { name, pin, hero } = req.body || {}
  if (!name || !pin || !hero) return res.status(400).json({ error: 'missing_fields' })

  const db   = getDb()
  const user = db.prepare('SELECT pin_hash FROM users WHERE name = ?').get(name)
  if (!user || user.pin_hash !== hashPin(name, pin)) {
    return res.status(403).json({ error: 'wrong_pin' })
  }

  const today = new Date().toISOString().slice(0, 10)
  db.prepare(`
    INSERT INTO daily_heroes (user_name, date, hero_data, updated_at)
    VALUES (?, ?, ?, unixepoch())
    ON CONFLICT(user_name, date) DO UPDATE SET
      hero_data  = excluded.hero_data,
      updated_at = excluded.updated_at
  `).run(name, today, JSON.stringify(hero))

  return res.json({ ok: true })
})

function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

module.exports = router
