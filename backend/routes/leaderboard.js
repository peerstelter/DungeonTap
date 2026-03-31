const express = require('express')
const crypto  = require('node:crypto')
const { getDb } = require('../db/schema')

const router = express.Router()
const MAX_ENTRIES = 50

function hashPin(name, pin) {
  return crypto.createHmac('sha256', 'dungeontap-v1')
    .update(`${name.toLowerCase()}:${pin}`)
    .digest('hex')
}

// GET /api/leaderboard?type=global|daily
router.get('/', (req, res) => {
  const db   = getDb()
  const type = req.query.type === 'daily' ? 'daily' : 'global'

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

  // PIN verification (optional — anonymous runs always pass)
  if (pin) {
    const hash = hashPin(playerName, String(pin))
    const existing = db.prepare('SELECT pin_hash FROM users WHERE name = ?').get(playerName)

    if (existing) {
      if (existing.pin_hash !== hash) {
        return res.status(403).json({ error: 'wrong_pin' })
      }
    } else {
      // First time this name is used with a PIN — register it
      db.prepare('INSERT INTO users (name, pin_hash) VALUES (?, ?)').run(playerName, hash)
    }
  }

  const score = calcScore(floor, xp, gold, kills)
  const today = new Date().toISOString().slice(0, 10)

  const result = db.prepare(`
    INSERT INTO runs (name, class, floor, xp, gold, kills, level, score, seed, is_daily, daily_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    playerName, cls,
    Math.floor(floor), Math.floor(xp ?? 0), Math.floor(gold ?? 0),
    Math.floor(kills ?? 0), Math.floor(level ?? 1),
    score,
    seed ?? null,
    isDaily ? 1 : 0,
    isDaily ? today : null,
  )

  res.status(201).json({ id: result.lastInsertRowid, score })
})

function calcScore(floor, xp, gold, kills) {
  return Math.round((floor * 100) + (xp ?? 0) * 2 + (gold ?? 0) + (kills ?? 0) * 15)
}

module.exports = router
