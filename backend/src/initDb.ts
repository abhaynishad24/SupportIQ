import { pool } from './db.js';

const createTables = async () => {
  const query = `
    DO $$ BEGIN
      CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'REJECTED';

    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check;

    UPDATE users
    SET role = CASE WHEN LOWER(email) = 'nishadabhay549@gmail.com' THEN 'ADMIN' ELSE 'USER' END;

    ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('USER', 'ADMIN'));

    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;

    CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'General',
        priority ticket_priority DEFAULT 'MEDIUM',
        status ticket_status DEFAULT 'OPEN',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        attachment_url TEXT,
        attachment_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
    );

    ALTER TABLE tickets
      ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
  `;

  try {
    await pool.query(query);
    console.log("Users table and columns verified/updated successfully in PostgreSQL!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating table:", error);
    process.exit(1);
  }
};

createTables();
