/**
 * db.js – PostgreSQL Verbindung
 * ─────────────────────────────────────────────────────────────────────────
 * Railway setzt DATABASE_URL automatisch wenn PostgreSQL-Plugin aktiviert.
 * Lokal: DATABASE_URL in .env setzen oder API_MODE=mock lassen.
 * ─────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('railway')
        ? { rejectUnauthorized: false }
        : false,
    });
    pool.on('error', (err) => {
      console.error('[DB] Verbindungsfehler:', err.message);
    });
    console.log('[DB] PostgreSQL verbunden');
  }
  return pool;
}

async function query(sql, params = []) {
  const p = getPool();
  if (!p) throw new Error('Keine Datenbankverbindung');
  const result = await p.query(sql, params);
  return result;
}

async function isAvailable() {
  try {
    const p = getPool();
    if (!p) return false;
    await p.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

module.exports = { query, getPool, isAvailable };
