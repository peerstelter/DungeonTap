const express = require('express')
const { getDb } = require('../db/schema')

const router = express.Router()
const MAX_ENTRIES = 50

// GET /api/leaderboard?type=global|daily
router.get('/', (req, res) => {
  const db = getDb()
  const type = req.query.type === 'daily' ? 'daily' : 'global'

  let rows
  if (type === 'daily') {
    const today = new Date().toISOString().slice(0, 10)
    rows = db.prepare(`
      SELECT id, name, class, floor, xp, gold, score
      FROM runs
      WHERE is_daily = 1 AND daily_date = ?
      ORDER BY score DESC
      LIMIT ?
    `).all(today, MAX_ENTRIES)
  } else {
    rows = db.prepare(`
      SELECT id, name, class, floor, xp, gold, score
      FROM runs
      ORDER BY score DESC
      LIMIT ?
    `).all(MAX_ENTRIES)
  }

  res.json(rows)
})

// POST /api/leaderboard
router.post('/', (req, res) => {
  const { name, class: cls, floor, xp, gold, seed, isDaily } = req.body

  if (!cls || !['warrior', 'mage', 'rogue'].includes(cls)) {
    return res.status(400).json({ error: 'Invalid class' })
  }
  if (typeof floor !== 'number' || floor < 1 || floor > 100) {
    return res.status(400).json({ error: 'Invalid floor' })
  }

  const score = calcScore(floor, xp, gold)
  const playerName = String(name || 'Anonym').slice(0, 20).trim() || 'Anonym'
  const today = new Date().toISOString().slice(0, 10)

  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO runs (name, class, floor, xp, gold, score, seed, is_daily, daily_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    playerName, cls,
    Math.floor(floor), Math.floor(xp ?? 0), Math.floor(gold ?? 0),
    score,
    seed ?? null,
    isDaily ? 1 : 0,
    isDaily ? today : null,
  )

  res.status(201).json({ id: result.lastInsertRowid, score })
})

function calcScore(floor, xp, gold) {
  return Math.round((floor * 100) + (xp ?? 0) * 2 + (gold ?? 0))
}

module.exports = router
