import mysql from 'mysql2/promise';

// Railway database connection
export async function getConnection() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'password',
    database: process.env.MYSQLDATABASE || 'railway',
    port: parseInt(process.env.MYSQLPORT || '3306'),
    ssl: {
      rejectUnauthorized: true
    }
  });

  return connection;
}

// Helper function to execute queries
export async function executeQuery(query: string, params?: any[]) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

export default { getConnection, executeQuery };