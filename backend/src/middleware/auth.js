const jwt = require('jsonwebtoken')
const authRoutes = require('../routes/auth')

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [, token] = header.split(' ')

  if (!token) return res.status(401).json({ message: 'Missing token' })

  const secret =
    typeof authRoutes.getJwtSecret === 'function' ? authRoutes.getJwtSecret() : process.env.JWT_SECRET

  try {
    const payload = jwt.verify(token, secret)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

module.exports = { requireAuth }

