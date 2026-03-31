const express = require('express')
const crypto  = require('node:crypto')
const { getDb } = require('../db/schema')

const router = express.Router()

function hashPin(name, pin) {
  return crypto.createHmac('sha256', 'dungeontap-v1')
    .update(`${name.toLowerCase()}:${pin}`)
    .digest('hex')
}

// GET /api/users/check?name=...
// Returns { available: true } or { available: false, hasPin: true/false }
router.get('/check', (req, res) => {
  const name = String(req.query.name || '').slice(0, 20).trim()
  if (name.length < 2) return res.json({ available: false, reason: 'too_short' })

  const db = getDb()
  const existing = db.prepare('SELECT pin_hash FROM users WHERE name = ?').get(name)
  if (!existing) return res.json({ available: true })
  return res.json({ available: false, hasPin: !!existing.pin_hash })
})

// POST /api/users/register  { name, pin }
// Register a new name+PIN. Returns 409 if name taken without matching PIN.
router.post('/register', (req, res) => {
  const name = String(req.body.name || '').slice(0, 20).trim()
  const pin  = String(req.body.pin  || '')

  if (name.length < 2) return res.status(400).json({ error: 'name_too_short' })
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'invalid_pin' })

  const hash = hashPin(name, pin)
  const db = getDb()
  const existing = db.prepare('SELECT pin_hash FROM users WHERE name = ?').get(name)

  if (existing) {
    if (existing.pin_hash === hash) {
      // Correct PIN for existing name — all good (re-registering same device)
      return res.json({ ok: true, created: false })
    }
    return res.status(409).json({ error: 'name_taken' })
  }

  db.prepare('INSERT INTO users (name, pin_hash) VALUES (?, ?)').run(name, hash)
  return res.status(201).json({ ok: true, created: true })
})

module.exports = { router, hashPin }
