const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const { connectDb } = require('./config/db')
const { getEvaluationConfig } = require('./config/evaluation')
const { requireAuth } = require('./middleware/auth')

const authRoutes = require('./routes/auth')
const studentRoutes = require('./routes/students')
const taskRoutes = require('./routes/tasks')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  const evaluation = getEvaluationConfig()
  res.json({ ok: true, mode: evaluation.mode, expiresAt: evaluation.expiresAt || null })
})

app.use('/api/auth', authRoutes)
app.use('/api/students', requireAuth, studentRoutes)
app.use('/api/tasks', requireAuth, taskRoutes)

const port = process.env.PORT || 5000

async function start() {
  const disableDb = process.env.DISABLE_DB === 'true' || process.env.DISABLE_DB === '1'

  if (disableDb) {
    // eslint-disable-next-line no-console
    console.warn(
      'DISABLE_DB: API started without MySQL. Login uses bridge credentials in src/routes/auth.js; /api/students and /api/tasks will fail until a database is connected.',
    )
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on http://localhost:${port}`)
    })
    return
  }

  if (!process.env.DB_SERVER) throw new Error('DB_SERVER missing')
  if (!process.env.DB_NAME) throw new Error('DB_NAME missing')
  if (!process.env.DB_USER) throw new Error('DB_USER missing')
  if (!process.env.DB_PASSWORD) throw new Error('DB_PASSWORD missing')
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing')

  await connectDb()
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`)
  })
}

start().catch((err) => {
  if (err?.code === 'ECONNREFUSED' || err?.code === 'ER_ACCESS_DENIED_ERROR' || err?.code === 'ER_BAD_DB_ERROR') {
    // eslint-disable-next-line no-console
    console.error('Could not connect to MySQL.')
    // eslint-disable-next-line no-console
    console.error('Start MySQL and verify DB_SERVER, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in backend/.env')
    // eslint-disable-next-line no-console
    console.error(`Current DB_SERVER: ${process.env.DB_SERVER || '(not set)'}`)
    // eslint-disable-next-line no-console
    console.error(`Current DB_NAME: ${process.env.DB_NAME || '(not set)'}`)
  } else {
    // eslint-disable-next-line no-console
    console.error(err)
  }
  process.exit(1)
})

