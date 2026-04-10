const express = require('express')
const { z } = require('zod')
const { getPool } = require('../config/db')
const { assertEvaluationWindow, assertStudentLimit } = require('../config/evaluation')

const router = express.Router()
const phoneRegex = /^\d{10}$/
const phoneSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v === '' || phoneRegex.test(v), { message: 'Phone must be exactly 10 digits' })
  .transform((v) => (v === '' ? undefined : v))

const createSchema = z.object({
  name: z.string().min(1),
  className: z.string().min(1),
  rollNo: z.string().optional(),
  phone: phoneSchema.optional(),
})

const updateSchema = createSchema.partial()

router.get('/', async (_req, res) => {
  const [rows] = await getPool().query(
    `
      SELECT Id, Name, ClassName, RollNo, Phone, CreatedAt, UpdatedAt
      FROM Students
      ORDER BY CreatedAt DESC
    `
  )
  const students = rows.map((r) => ({
    _id: String(r.Id),
    name: r.Name,
    className: r.ClassName,
    rollNo: r.RollNo ?? undefined,
    phone: r.Phone ?? undefined,
    createdAt: r.CreatedAt?.toISOString(),
    updatedAt: r.UpdatedAt?.toISOString(),
  }))
  res.json({ students })
})

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' })
  const pool = getPool()

  try {
    assertEvaluationWindow()
    await assertStudentLimit(pool)
  } catch (err) {
    return res.status(err.status || 403).json({ message: err.message || 'Evaluation mode restriction' })
  }

  const { name, className, rollNo, phone } = parsed.data
  const [insertResult] = await pool.query(
    `
      INSERT INTO Students (Name, ClassName, RollNo, Phone)
      VALUES (?, ?, ?, ?)
    `,
    [name, className, rollNo ?? null, phone ?? null]
  )
  const [rows] = await pool.query(
    `
      SELECT Id, Name, ClassName, RollNo, Phone, CreatedAt, UpdatedAt
      FROM Students
      WHERE Id = ?
    `,
    [insertResult.insertId]
  )
  const r = rows[0]
  const student = {
    _id: String(r.Id),
    name: r.Name,
    className: r.ClassName,
    rollNo: r.RollNo ?? undefined,
    phone: r.Phone ?? undefined,
    createdAt: r.CreatedAt?.toISOString(),
    updatedAt: r.UpdatedAt?.toISOString(),
  }
  res.status(201).json({ student })
})

router.put('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' })
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid student id' })

  const [existingRows] = await getPool().query(
    `
      SELECT Id, Name, ClassName, RollNo, Phone
      FROM Students
      WHERE Id = ?
      LIMIT 1
    `,
    [id]
  )
  const existing = existingRows[0]
  if (!existing) return res.status(404).json({ message: 'Student not found' })

  const next = {
    name: parsed.data.name ?? existing.Name,
    className: parsed.data.className ?? existing.ClassName,
    rollNo: parsed.data.rollNo !== undefined ? parsed.data.rollNo : existing.RollNo,
    phone: parsed.data.phone !== undefined ? parsed.data.phone : existing.Phone,
  }

  await getPool().query(
    `
      UPDATE Students
      SET Name = ?, ClassName = ?, RollNo = ?, Phone = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE Id = ?
    `,
    [next.name, next.className, next.rollNo ?? null, next.phone ?? null, id]
  )
  const [rows] = await getPool().query(
    `
      SELECT Id, Name, ClassName, RollNo, Phone, CreatedAt, UpdatedAt
      FROM Students
      WHERE Id = ?
    `,
    [id]
  )
  const r = rows[0]
  const student = {
    _id: String(r.Id),
    name: r.Name,
    className: r.ClassName,
    rollNo: r.RollNo ?? undefined,
    phone: r.Phone ?? undefined,
    createdAt: r.CreatedAt?.toISOString(),
    updatedAt: r.UpdatedAt?.toISOString(),
  }
  res.json({ student })
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid student id' })
  const [deleted] = await getPool().query(
    `
      DELETE FROM Students
      WHERE Id = ?
    `,
    [id]
  )
  if (deleted.affectedRows === 0) return res.status(404).json({ message: 'Student not found' })
  res.json({ ok: true })
})

module.exports = router

