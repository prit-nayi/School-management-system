function getEvaluationConfig() {
  const mode = (process.env.APP_MODE || 'evaluation').toLowerCase()
  const expiresAt = process.env.EVAL_EXPIRES_AT || ''
  const maxStudents = Number(process.env.EVAL_MAX_STUDENTS || 20)
  const maxTasks = Number(process.env.EVAL_MAX_TASKS || 50)

  return {
    mode,
    expiresAt,
    maxStudents: Number.isFinite(maxStudents) ? maxStudents : 20,
    maxTasks: Number.isFinite(maxTasks) ? maxTasks : 50,
  }
}

function isExpired(expiresAt) {
  if (!expiresAt) return false
  const exp = new Date(`${expiresAt}T23:59:59`)
  if (Number.isNaN(exp.getTime())) return false
  return new Date() > exp
}

function assertEvaluationWindow() {
  const cfg = getEvaluationConfig()
  if (cfg.mode !== 'evaluation') return
  if (isExpired(cfg.expiresAt)) {
    const err = new Error('Evaluation period has expired')
    err.status = 403
    throw err
  }
}

async function assertStudentLimit(pool) {
  const cfg = getEvaluationConfig()
  if (cfg.mode !== 'evaluation') return
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM Students')
  if (Number(rows[0]?.total || 0) >= cfg.maxStudents) {
    const err = new Error(`Evaluation limit reached: max ${cfg.maxStudents} students`)
    err.status = 403
    throw err
  }
}

async function assertTaskLimit(pool) {
  const cfg = getEvaluationConfig()
  if (cfg.mode !== 'evaluation') return
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM Tasks')
  if (Number(rows[0]?.total || 0) >= cfg.maxTasks) {
    const err = new Error(`Evaluation limit reached: max ${cfg.maxTasks} tasks`)
    err.status = 403
    throw err
  }
}

module.exports = {
  getEvaluationConfig,
  assertEvaluationWindow,
  assertStudentLimit,
  assertTaskLimit,
}

