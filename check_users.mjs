import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function check() {
  try {
    const users = await sql`SELECT id, login, name, is_admin FROM users`;
    console.log('USUÁRIOS ENCONTRADOS:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('ERRO AO BUSCAR USUÁRIOS:', error.message);
  }
}

check();
