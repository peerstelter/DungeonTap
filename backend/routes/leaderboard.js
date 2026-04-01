const express = require('express')
const { getDb } = require('../db/schema')
const { hashPin } = require('./users')

const router = express.Router()
const MAX_ENTRIES = 50

// Returns ISO week string like "2026-W14"
function getISOWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// GET /api/leaderboard?type=global|daily|weekly
router.get('/', (req, res) => {
  const db   = getDb()
  const type = req.query.type

  let rows
  if (type === 'daily') {
    const today = new Date().toISOString().slice(0, 10)
    rows = db.prepare(`
      SELECT id, name, class, floor, xp, gold, kills, level, score, created_at
      FROM runs
      WHERE is_daily = 1 AND daily_date = ?
      ORDER BY score DESC
      LIMIT ?
    `).all(today, MAX_ENTRIES)
  } else if (type === 'weekly') {
    const week = getISOWeek()
    rows = db.prepare(`
      SELECT id, name, class, floor, xp, gold, kills, level, score, created_at
      FROM runs
      WHERE week = ?
      ORDER BY score DESC
      LIMIT ?
    `).all(week, MAX_ENTRIES)
  } else {
    rows = db.prepare(`
      SELECT id, name, class, floor, xp, gold, kills, level, score, created_at
      FROM runs
      ORDER BY score DESC
      LIMIT ?
    `).all(MAX_ENTRIES)
  }

  res.json(rows)
})

// POST /api/leaderboard
router.post('/', (req, res) => {
  const { name, pin, class: cls, floor, xp, gold, kills, level, seed, isDaily } = req.body

  if (!cls || !['warrior', 'mage', 'rogue'].includes(cls)) {
    return res.status(400).json({ error: 'invalid_class' })
  }
  if (typeof floor !== 'number' || floor < 1 || floor > 100) {
    return res.status(400).json({ error: 'invalid_floor' })
  }

  const playerName = String(name || 'Anonym').slice(0, 20).trim() || 'Anonym'
  const db = getDb()

  // Skip PIN check for anonymous submissions
  const isAnonymous = playerName === 'Anonym' || !pin

  if (!isAnonymous) {
    const hash = hashPin(playerName, String(pin))
    const existing = db.prepare('SELECT pin_hash FROM users WHERE name = ?').get(playerName)

    if (existing) {
      // Name is registered — PIN must match
      if (existing.pin_hash !== hash) {
        return res.status(403).json({ error: 'wrong_pin' })
      }
    } else {
      // Name not yet registered — claim it now
      try {
        db.prepare('INSERT INTO users (name, pin_hash) VALUES (?, ?)').run(playerName, hash)
      } catch {
        // UNIQUE constraint: another request registered the same name just now
        return res.status(409).json({ error: 'name_taken' })
      }
    }
  }

  const score = calcScore(floor, xp, gold, kills)
  const today = new Date().toISOString().slice(0, 10)
  const week  = getISOWeek()

  const result = db.prepare(`
    INSERT INTO runs (name, class, floor, xp, gold, kills, level, score, seed, is_daily, daily_date, week)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    playerName, cls,
    Math.floor(floor), Math.floor(xp ?? 0), Math.floor(gold ?? 0),
    Math.floor(kills ?? 0), Math.floor(level ?? 1),
    score,
    seed ?? null,
    isDaily ? 1 : 0,
    isDaily ? today : null,
    week,
  )

  res.status(201).json({ id: result.lastInsertRowid, score })
})

function calcScore(floor, xp, gold, kills) {
  return Math.round((floor * 100) + (xp ?? 0) * 2 + (gold ?? 0) + (kills ?? 0) * 15)
}

module.exports = router
