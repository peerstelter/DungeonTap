const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

// Ensure data dir exists
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const leaderboardRouter = require('./routes/leaderboard')
const dailyDungeonRouter = require('./routes/daily-dungeon')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}))
app.use(express.json({ limit: '16kb' }))

app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/daily-dungeon', dailyDungeonRouter)

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`DungeonTap backend running on port ${PORT}`)
})
