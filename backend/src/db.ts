import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Environment ke hisab se SSL enable karein (Production ke liye zaroori hai)
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('render.com') || process.env.DATABASE_URL?.includes('supabase.co');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/supportiq',
  ssl: isProduction ? { rejectUnauthorized: false } : false
});