// PostgreSQL Database Connection
import { Pool } from 'pg';

// Connection configuration for PostgreSQL
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hikaricha_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create connection pool
const pool = new Pool(connectionConfig);

// Database connection function
export async function getConnection() {
  return pool;
}

// Helper function to execute queries
export async function executeQuery(query: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Close connection pool (for graceful shutdown)
export async function closeConnection() {
  await pool.end();
}

export default { getConnection, executeQuery, closeConnection };
