import { Pool, Client } from 'pg';
import path from 'path';
import fs from 'fs';

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection on startup
export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✓ Database connected:', result.rows[0]);
    client.release();
  } catch (err) {
    console.error('✗ Failed to connect to database:', err);
    throw err;
  }
}

// Run migrations
export async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT * FROM migrations WHERE name = $1',
        [file]
      );

      if (rows.length === 0) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        console.log(`Running migration: ${file}`);
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      }
    }

    await client.query('COMMIT');
    console.log('✓ All migrations completed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
