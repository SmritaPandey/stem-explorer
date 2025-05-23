import { Pool } from 'pg';
// import dotenv from 'dotenv'; // Next.js handles .env.local loading

// dotenv.config({ path: process.cwd() + '/backend/.env' }); // Ensure .env from backend folder is loaded

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  ssl: {
    rejectUnauthorized: false // Required for Supabase direct connections, use with caution
  }
});

pool.on('connect', () => {
  console.log('PostgreSQL pool connected successfully');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool connection error:', err);
  process.exit(-1);
});

export default pool;
