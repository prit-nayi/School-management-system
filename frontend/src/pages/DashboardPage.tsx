import { useEffect, useState } from 'react'
import { api, type Student, type Task } from '../lib/api'
import { clearToken } from '../lib/auth'
import Navbar from '../components/Navbar'

function fmtDate(d?: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString()
}

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadAll() {
    setError(null)
    setLoading(true)
    try {
      const [sRes, tRes] = await Promise.all([api.get('/api/students'), api.get('/api/tasks')])
      setStudents(sRes.data.students)
      setTasks(tRes.data.tasks)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

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
          <h1>Dashboard</h1>
          <div className="muted">Quick overview with latest entries.</div>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid">
        <div className="card">
          <div className="card-title">
            <h2>Latest Students</h2>
            <span className="pill">{students.length}</span>
          </div>
          <div className="list">
            {students.slice(0, 5).map((s) => (
              <div key={s._id} className="row">
                <div className="row-main">
                  <div className="row-title">
                    <span>{s.name}</span>
                    <span className="tag">Class {s.className}</span>
                    {s.rollNo ? <span className="tag">Roll {s.rollNo}</span> : null}
                  </div>
                  {s.phone ? <div className="row-sub">Phone: {s.phone}</div> : null}
                </div>
              </div>
            ))}
            {students.length === 0 ? <div className="muted">No students yet.</div> : null}
          </div>
          <div className="eval-footer">Showing latest 5 students. Open Students page from navbar.</div>
        </div>

        <div className="card">
          <div className="card-title">
            <h2>Latest Tasks / Assignments</h2>
            <span className="pill">{tasks.length}</span>
          </div>
          <div className="list">
            {tasks.slice(0, 5).map((t) => (
              <div key={t._id} className={`row task ${t.completed ? 'done' : ''}`}>
                <div className="row-main">
                  <div className="row-title">
                    <span>{t.title}</span>
                  </div>
                  <div className="row-sub">
                    <span className="tag">
                      {t.student?.name || 'Unknown'} • Class {t.student?.className || '?'}
                    </span>
                    {t.dueDate ? <span className="tag">Due {fmtDate(t.dueDate)}</span> : null}
                    {t.completedAt ? <span className="tag">Completed {fmtDate(t.completedAt)}</span> : null}
                  </div>
                  {t.description ? <div className="row-desc">{t.description}</div> : null}
                </div>
              </div>
            ))}
            {tasks.length === 0 ? <div className="muted">No tasks yet.</div> : null}
          </div>
          <div className="eval-footer">Showing latest 5 tasks. Open Tasks page from navbar.</div>
        </div>
      </div>
      <div className="eval-footer">For technical assessment, testing, and demonstration only.</div>
    </div>
  )
}

