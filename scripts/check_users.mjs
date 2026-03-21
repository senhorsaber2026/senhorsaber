import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

const users = await sql`SELECT id, login, name, email, status, is_admin FROM users ORDER BY id`;
console.log('Usuários no banco:');
console.table(users);
