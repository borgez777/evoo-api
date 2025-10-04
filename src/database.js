import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

const db = new Database('evoo.db');

// tabela de usuários
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// tabela de logs de emails
db.exec(`
  CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    to_email TEXT,
    subject TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

export const createUser = (email, password) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const apiKey = randomUUID();
  const userId = randomUUID();
  
  const stmt = db.prepare('INSERT INTO users (id, email, password, api_key) VALUES (?, ?, ?, ?)');
  stmt.run(userId, email, hashedPassword, apiKey);
  
  return { userId, apiKey };
};

export const getUserByApiKey = (apiKey) => {
  const stmt = db.prepare('SELECT * FROM users WHERE api_key = ?');
  return stmt.get(apiKey);
};

export const logEmail = (userId, toEmail, subject) => {
  const stmt = db.prepare('INSERT INTO email_logs (user_id, to_email, subject) VALUES (?, ?, ?)');
  stmt.run(userId, toEmail, subject);
};

export default db;

export const getEmailCount = (userId, hours = 24) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM email_logs 
    WHERE user_id = ? AND sent_at > datetime('now', '-' || ? || ' hours')
  `);
  return stmt.get(userId, hours).count;
};

export const getEmailHistory = (userId, limit = 50) => {
  const stmt = db.prepare(`
    SELECT to_email, subject, sent_at 
    FROM email_logs 
    WHERE user_id = ? 
    ORDER BY sent_at DESC 
    LIMIT ?
  `);
  return stmt.all(userId, limit);
};