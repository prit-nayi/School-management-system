const mysql = require('mysql2/promise')

let pool

function dbConfig() {
  return {
    host: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'schoolmini',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Students (
      Id INT AUTO_INCREMENT PRIMARY KEY,
      Name VARCHAR(120) NOT NULL,
      ClassName VARCHAR(50) NOT NULL,
      RollNo VARCHAR(50) NULL,
      Phone VARCHAR(50) NULL,
      CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Tasks (
      Id INT AUTO_INCREMENT PRIMARY KEY,
      StudentId INT NOT NULL,
      Title VARCHAR(200) NOT NULL,
      Description TEXT NULL,
      DueDate DATETIME NULL,
      Completed TINYINT(1) NOT NULL DEFAULT 0,
      CompletedAt DATETIME NULL,
      CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT FK_Tasks_Students FOREIGN KEY (StudentId) REFERENCES Students(Id) ON DELETE CASCADE
    )
  `)
}

async function connectDb() {
  const config = dbConfig()
  if (!config.user) throw new Error('DB_USER missing')

  pool = mysql.createPool(config)
  await pool.query('SELECT 1')
  await ensureSchema()
}

function getPool() {
  if (!pool) throw new Error('Database pool not initialized')
  return pool
}

module.exports = { connectDb, getPool }

