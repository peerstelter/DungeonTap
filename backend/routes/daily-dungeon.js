const express = require('express')

const router = express.Router()

// GET /api/daily-dungeon/seed
// Returns today's shared dungeon seed so all players get the same run
router.get('/seed', (req, res) => {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const seed = hashSeed(`dungeontap-daily-${today}`)
  res.json({ date: today, seed })
})

function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

module.exports = router
