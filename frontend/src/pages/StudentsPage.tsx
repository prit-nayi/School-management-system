import { useEffect, useState } from 'react'
import { api, type Student } from '../lib/api'
import { clearToken } from '../lib/auth'
import Navbar from '../components/Navbar'

const PHONE_REGEX = /^\d{10}$/

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadStudents() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/students')
      setStudents(res.data.students)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  async function addStudent(input: { name: string; className: string; rollNo?: string; phone?: string }) {
    const res = await api.post('/api/students', input)
    setStudents((prev) => [res.data.student, ...prev])
  }

  async function updateStudent(id: string, patch: Partial<Student>) {
    const res = await api.put(`/api/students/${id}`, patch)
    setStudents((prev) => prev.map((s) => (s._id === id ? res.data.student : s)))
  }

  async function deleteStudent(id: string) {
    await api.delete(`/api/students/${id}`)
    setStudents((prev) => prev.filter((s) => s._id !== id))
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
      <Navbar onRefresh={loadStudents} onLogout={logout} />
      <div className="header">
        <div>
          <h1>Students</h1>
          <div className="muted">Manage all students here.</div>
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
        <div className="card-title">
          <h2>Student List</h2>
          <span className="pill">{students.length}</span>
        </div>
        <StudentForm onAdd={addStudent} />
        <div className="list">
          {students.map((s) => (
            <StudentRow key={s._id} student={s} onUpdate={updateStudent} onDelete={deleteStudent} />
          ))}
          {students.length === 0 ? <div className="muted">No students yet.</div> : null}
        </div>
      </div>
    </div>
  )
}

function StudentForm({
  onAdd,
}: {
  onAdd: (input: { name: string; className: string; rollNo?: string; phone?: string }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [className, setClassName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) {
      setError('Phone must be exactly 10 digits')
      return
    }
    setLoading(true)
    try {
      await onAdd({ name, className, rollNo: rollNo || undefined, phone: phone || undefined })
      setName('')
      setClassName('')
      setRollNo('')
      setPhone('')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form compact" onSubmit={submit}>
      <div className="row2">
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul" />
        </label>
        <label className="field">
          <span>Class</span>
          <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="10" />
        </label>
      </div>
      <div className="row2">
        <label className="field">
          <span>Roll No (optional)</span>
          <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="23" />
        </label>
        <label className="field">
          <span>Phone (optional)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            maxLength={10}
            inputMode="numeric"
          />
        </label>
      </div>
      {error ? <div className="error">{error}</div> : null}
      <button className="btn primary" disabled={loading || !name.trim() || !className.trim()}>
        {loading ? 'Adding…' : 'Add student'}
      </button>
    </form>
  )
}

function StudentRow({
  student,
  onUpdate,
  onDelete,
}: {
  student: Student
  onUpdate: (id: string, patch: Partial<Student>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(student.name)
  const [className, setClassName] = useState(student.className)
  const [rollNo, setRollNo] = useState(student.rollNo || '')
  const [phone, setPhone] = useState(student.phone || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) {
      setError('Phone must be exactly 10 digits')
      return
    }
    setLoading(true)
    try {
      await onUpdate(student._id, {
        name,
        className,
        rollNo: rollNo || undefined,
        phone: phone || undefined,
      })
      setEditing(false)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row">
      <div className="row-main">
        {editing ? (
          <>
            <div className="row2">
              <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Student name" placeholder="Name" />
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                aria-label="Student class"
                placeholder="Class"
              />
            </div>
            <div className="row2">
              <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="Roll no" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Phone"
                maxLength={10}
                inputMode="numeric"
              />
            </div>
            {error ? <div className="error">{error}</div> : null}
          </>
        ) : (
          <>
            <div className="row-title">
              <span>{student.name}</span>
              <span className="tag">Class {student.className}</span>
              {student.rollNo ? <span className="tag">Roll {student.rollNo}</span> : null}
            </div>
            {student.phone ? <div className="row-sub">Phone: {student.phone}</div> : null}
          </>
        )}
      </div>
      <div className="row-actions">
        {editing ? (
          <>
            <button className="btn primary" disabled={loading || !name.trim() || !className.trim()} onClick={save}>
              Save
            </button>
            <button className="btn" onClick={() => setEditing(false)} disabled={loading}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button className="btn danger" onClick={() => onDelete(student._id)}>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

