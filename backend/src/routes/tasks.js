const express = require('express')
const { z } = require('zod')
const { getPool } = require('../config/db')
const { assertEvaluationWindow, assertTaskLimit } = require('../config/evaluation')

const router = express.Router()
const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/

const createSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(), // ISO string
})

router.get('/', async (_req, res) => {
  const [rows] = await getPool().query(`
    SELECT
      t.Id, t.Title, t.Description, t.DueDate, t.Completed, t.CompletedAt, t.CreatedAt, t.UpdatedAt,
      s.Id AS StudentId, s.Name AS StudentName, s.ClassName AS StudentClassName
    FROM Tasks t
    INNER JOIN Students s ON s.Id = t.StudentId
    ORDER BY t.CreatedAt DESC
  `)
  const tasks = rows.map((r) => ({
    _id: String(r.Id),
    student: {
      _id: String(r.StudentId),
      name: r.StudentName,
      className: r.StudentClassName,
    },
    title: r.Title,
    description: r.Description ?? undefined,
    dueDate: r.DueDate?.toISOString(),
    completed: Boolean(r.Completed),
    completedAt: r.CompletedAt?.toISOString(),
    createdAt: r.CreatedAt?.toISOString(),
    updatedAt: r.UpdatedAt?.toISOString(),
  }))
  res.json({ tasks })
})

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' })
  const pool = getPool()

  try {
    assertEvaluationWindow()
    await assertTaskLimit(pool)
  } catch (err) {
    return res.status(err.status || 403).json({ message: err.message || 'Evaluation mode restriction' })
  }

  const { studentId, title, description, dueDate } = parsed.data
  if (dueDate) {
    let dueDay
    if (dateOnlyRegex.test(dueDate)) {
      dueDay = dueDate
    } else {
      const parsedDate = new Date(dueDate)
      if (Number.isNaN(parsedDate.getTime())) return res.status(400).json({ message: 'Invalid due date' })
      dueDay = parsedDate.toISOString().slice(0, 10)
    }
    const today = new Date().toISOString().slice(0, 10)
    if (dueDay < today) {
      return res.status(400).json({ message: 'Due date cannot be earlier than today' })
    }
  }

  const studentIdNum = Number(studentId)
  if (!Number.isInteger(studentIdNum)) return res.status(400).json({ message: 'Invalid student id' })

  const [studentRows] = await pool.query(
    `
      SELECT Id, Name, ClassName
      FROM Students
      WHERE Id = ?
      LIMIT 1
    `,
    [studentIdNum]
  )
  const student = studentRows[0]
  if (!student) return res.status(404).json({ message: 'Student not found' })

  const [insertResult] = await pool.query(
    `
      INSERT INTO Tasks (StudentId, Title, Description, DueDate, Completed, CompletedAt)
      VALUES (?, ?, ?, ?, 0, NULL)
    `,
    [studentIdNum, title, description ?? null, dueDate ? new Date(dueDate) : null]
  )
  const [taskRows] = await pool.query(
    `
      SELECT Id, Title, Description, DueDate, Completed, CompletedAt, CreatedAt, UpdatedAt
      FROM Tasks
      WHERE Id = ?
    `,
    [insertResult.insertId]
  )
  const t = taskRows[0]
  res.status(201).json({
    task: {
      _id: String(t.Id),
      student: {
        _id: String(student.Id),
        name: student.Name,
        className: student.ClassName,
      },
      title: t.Title,
      description: t.Description ?? undefined,
      dueDate: t.DueDate?.toISOString(),
      completed: Boolean(t.Completed),
      completedAt: t.CompletedAt?.toISOString(),
      createdAt: t.CreatedAt?.toISOString(),
      updatedAt: t.UpdatedAt?.toISOString(),
    },
  })
})

router.patch('/:id/toggle', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid task id' })

  const [existingRows] = await getPool().query(
    `
      SELECT Id, StudentId, Completed
      FROM Tasks
      WHERE Id = ?
      LIMIT 1
    `,
    [id]
  )
  const task = existingRows[0]
  if (!task) return res.status(404).json({ message: 'Task not found' })

  const next = !Boolean(task.Completed)
  await getPool().query(
    `
      UPDATE Tasks
      SET Completed = ?, CompletedAt = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END, UpdatedAt = CURRENT_TIMESTAMP
      WHERE Id = ?
    `,
    [next ? 1 : 0, next ? 1 : 0, id]
  )

  const [joinedRows] = await getPool().query(
    `
      SELECT
        t.Id, t.Title, t.Description, t.DueDate, t.Completed, t.CompletedAt, t.CreatedAt, t.UpdatedAt,
        s.Id AS StudentId, s.Name AS StudentName, s.ClassName AS StudentClassName
      FROM Tasks t
      INNER JOIN Students s ON s.Id = t.StudentId
      WHERE t.Id = ?
    `,
    [id]
  )
  const r = joinedRows[0]
  res.json({
    task: {
      _id: String(r.Id),
      student: {
        _id: String(r.StudentId),
        name: r.StudentName,
        className: r.StudentClassName,
      },
      title: r.Title,
      description: r.Description ?? undefined,
      dueDate: r.DueDate?.toISOString(),
      completed: Boolean(r.Completed),
      completedAt: r.CompletedAt?.toISOString(),
      createdAt: r.CreatedAt?.toISOString(),
      updatedAt: r.UpdatedAt?.toISOString(),
    },
  })
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid task id' })
  const [deleted] = await getPool().query(
    `
      DELETE FROM Tasks
      WHERE Id = ?
    `,
    [id]
  )
  if (deleted.affectedRows === 0) return res.status(404).json({ message: 'Task not found' })
  res.json({ ok: true })
})

module.exports = router

