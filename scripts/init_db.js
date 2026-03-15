import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function init() {
  console.log('Initializing database...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        plan VARCHAR(20) DEFAULT 'free',
        status VARCHAR(20) DEFAULT 'active',
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Table "users" created or already exists.');

    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        proof_url TEXT,
        amount DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Table "payments" created or already exists.');

    // Create default admin if not exists
    const adminExists = await sql`SELECT * FROM users WHERE login = 'admin' LIMIT 1`;
    if (adminExists.length === 0) {
      // For simplicity in this demo, password is 'admin123' (will be hashed in real app, but here we can just do it)
      await sql`
        INSERT INTO users (login, password, name, is_admin, status, plan)
        VALUES ('admin', 'admin123', 'Administrador', TRUE, 'active', 'premium')
      `;
      console.log('Default admin user created (admin / admin123).');
    }

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

init();
