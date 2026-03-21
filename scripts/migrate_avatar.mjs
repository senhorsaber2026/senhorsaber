import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
    console.log('Coluna avatar_url adicionada com sucesso!');
  } catch (e) {
    console.error('Erro na migração:', e);
  }
}

migrate();
