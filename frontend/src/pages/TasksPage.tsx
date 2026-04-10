import { useEffect, useMemo, useState } from 'react'
import { api, type Student, type Task } from '../lib/api'
import { clearToken } from '../lib/auth'
import Navbar from '../components/Navbar'

function toLocalDateInputValue(d = new Date()) {
  const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}

function fmtDate(d?: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString()
}

export default function TasksPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const studentById = useMemo(() => {
    const map = new Map<string, Student>()
    for (const s of students) map.set(s._id, s)
    return map
  }, [students])

  async function loadAll() {
    setError(null)
    setLoading(true)
    try {
      const [sRes, tRes] = await Promise.all([api.get('/api/students'), api.get('/api/tasks')])
      setStudents(sRes.data.students)
      setTasks(tRes.data.tasks)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function addTask(input: { studentId: string; title: string; description?: string; dueDate?: string }) {
    const res = await api.post('/api/tasks', input)
    setTasks((prev) => [res.data.task, ...prev])
  }

  async function toggleTask(id: string) {
    const res = await api.patch(`/api/tasks/${id}/toggle`)
    setTasks((prev) => prev.map((t) => (t._id === id ? res.data.task : t)))
  }

  async function deleteTask(id: string) {
    await api.delete(`/api/tasks/${id}`)
    setTasks((prev) => prev.filter((t) => t._id !== id))
  }

  function logout() {
    clearToken()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <div className="muted">Loading…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="eval-banner">Evaluation Build - Non-Commercial Use Only</div>
      <Navbar onRefresh={loadAll} onLogout={logout} />
      <div className="header">
        <div>
          <h1>Tasks</h1>
          <div className="muted">Manage all assignments here.</div>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
        <div className="card-title">
          <h2>Task List</h2>
          <span className="pill">{tasks.length}</span>
        </div>
        <TaskForm students={students} onAdd={addTask} />
        <div className="list">
          {tasks.map((t) => (
            <div key={t._id} className={`row task ${t.completed ? 'done' : ''}`}>
              <div className="row-main">
                <div className="row-title">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTask(t._id)}
                    aria-label="Toggle completed"
                  />
                  <span>{t.title}</span>
                </div>
                <div className="row-sub">
                  <span className="tag">
                    {t.student?.name || studentById.get(t.student?._id)?.name || 'Unknown'} • Class{' '}
                    {t.student?.className || studentById.get(t.student?._id)?.className || '?'}
                  </span>
                  {t.dueDate ? <span className="tag">Due {fmtDate(t.dueDate)}</span> : null}
                  {t.completedAt ? <span className="tag">Completed {fmtDate(t.completedAt)}</span> : null}
                </div>
                {t.description ? <div className="row-desc">{t.description}</div> : null}
              </div>
              <div className="row-actions">
                <button className="btn danger" onClick={() => deleteTask(t._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 ? <div className="muted">No tasks yet.</div> : null}
        </div>
      </div>
    </div>
  )
}

function TaskForm({
  students,
  onAdd,
}: {
  students: Student[]
  onAdd: (input: { studentId: string; title: string; description?: string; dueDate?: string }) => Promise<void>
}) {
  const [studentId, setStudentId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const minDueDate = toLocalDateInputValue()

  useEffect(() => {
    if (!studentId && students[0]?._id) setStudentId(students[0]._id)
  }, [studentId, students])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (dueDate && dueDate < minDueDate) {
      setError('Due date cannot be earlier than today')
      return
    }

    setLoading(true)
    try {
      await onAdd({
        studentId,
        title,
        description: description || undefined,
        dueDate: dueDate || undefined,
      })
      setTitle('')
      setDescription('')
      setDueDate('')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to assign task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form compact" onSubmit={submit}>
      <div className="row2">
        <label className="field">
          <span>Student</span>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={students.length === 0}>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} (Class {s.className})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Due date (optional)</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={minDueDate} />
        </label>
      </div>
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Math homework" />
      </label>
      <label className="field">
        <span>Description (optional)</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Page 12, Q1–Q10" />
      </label>
      {students.length === 0 ? <div className="muted">Add a student first.</div> : null}
      {error ? <div className="error">{error}</div> : null}
      <button className="btn primary" disabled={loading || !title.trim() || !studentId || students.length === 0}>
        {loading ? 'Assigning…' : 'Assign task'}
      </button>
    </form>
  )
}

