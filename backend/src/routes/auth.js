const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

const router = express.Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' })

  const { email, password } = parsed.data

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
})

module.exports = router

