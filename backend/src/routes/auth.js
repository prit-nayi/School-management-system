const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

// --- Bridge (e.g. Vercel without MySQL): edit these for login; env JWT_SECRET overrides BRIDGE_JWT_SECRET ---
const BRIDGE_ADMIN_EMAIL = 'admin@school.local'
const BRIDGE_ADMIN_PASSWORD = 'admin123'
const BRIDGE_JWT_SECRET = 'replace-with-a-long-random-string-for-production'

function getJwtSecret() {
  return process.env.JWT_SECRET || BRIDGE_JWT_SECRET
}

const router = express.Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' })

  const { email, password } = parsed.data

  /*
  // --- Original: admin from environment (.env), optional bcrypt hash (not SQL) ---
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

  if (!adminEmail || (!adminPassword && !adminPasswordHash)) {
    return res.status(500).json({ message: 'Server admin credentials not configured' })
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  const ok = adminPasswordHash
    ? await bcrypt.compare(password, adminPasswordHash)
    : password === adminPassword

  if (!ok) return res.status(401).json({ message: 'Invalid email or password' })

  const token = jwt.sign({ role: 'admin', email: adminEmail }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

  return res.json({ token })
  */

  // --- Bridge: verify against credentials in this file ---
  if (email.toLowerCase() !== BRIDGE_ADMIN_EMAIL.toLowerCase()) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }
  if (password !== BRIDGE_ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  const token = jwt.sign({ role: 'admin', email: BRIDGE_ADMIN_EMAIL }, getJwtSecret(), {
    expiresIn: '7d',
  })

  return res.json({ token })
})

module.exports = router
module.exports.getJwtSecret = getJwtSecret
