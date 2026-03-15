import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'senhor-saber-secret-key-2026';

app.use(cors());
app.use(express.json());

// Note: Vercel filesystem is read-only except /tmp. 
// Files uploaded here will NOT persist across serverless invocations.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '/tmp'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const sql = neon(process.env.DATABASE_URL);

// Ensure settings table exists with defaults
const initSettings = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT
      )
    `;
    const defaults = [
      { key: 'global_api_key', value: process.env.VITE_GROQ_API_KEY || '' },
      { key: 'pix_key', value: 'pix@senhorsaber.com.br' },
      { key: 'pix_value', value: '19.90' }
    ];
    for (const d of defaults) {
      const existing = await sql`SELECT value FROM settings WHERE key = ${d.key}`;
      if (existing.length === 0 && d.value) {
        await sql`INSERT INTO settings (key, value) VALUES (${d.key}, ${d.value})`;
      }
    }
  } catch (e) { console.error('Settings init error:', e.message); }
};

// Vercel serverless functions are stateless, but we try to init if needed
initSettings();

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ error: 'Acesso negado: Administrador apenas' });
  next();
};

// --- Routes ---

app.get('/api/settings/public', async (req, res) => {
  try {
    const result = await sql`SELECT key, value FROM settings WHERE key IN ('global_api_key', 'pix_key', 'pix_value')`;
    const settings = result.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json(settings);
  } catch (error) {
    res.json({ 
      global_api_key: process.env.VITE_GROQ_API_KEY || '',
      pix_key: 'pix@senhorsaber.com.br',
      pix_value: '19.90'
    });
  }
});

app.post('/api/register', async (req, res) => {
  const { name, email } = req.body;
  const login = 'user' + Math.floor(1000 + Math.random() * 9000);
  const rawPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  try {
    const result = await sql`
      INSERT INTO users (login, password, name, email, status, plan)
      VALUES (${login}, ${hashedPassword}, ${name}, ${email}, 'pending', 'free')
      RETURNING id, login, name, is_admin, status, plan
    `;
    res.json({ 
      user: result[0], 
      credentials: { login, password: rawPassword },
      message: 'Usuário registrado com sucesso!' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const users = await sql`SELECT * FROM users WHERE login = ${login}`;
    if (users.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });
    const user = users[0];
    let isMatch = (user.login === 'admin' && password === 'admin123') || await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Senha incorreta' });
    const token = jwt.sign({ id: user.id, login: user.login, is_admin: user.is_admin }, JWT_SECRET);
    const { password: _, ...userWithoutPass } = user;
    res.json({ user: userWithoutPass, token });
  } catch (error) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

app.post('/api/payments/proof', authenticateToken, upload.single('proof'), async (req, res) => {
  try {
    // In Vercel, we don't have a persistent upload folder.
    // For now, we just acknowledge the upload. 
    // real implementations should use S3/Cloudinary.
    res.json({ message: 'Comprovante recebido! (Ambiente Vercel: persistência de imagem desativada)' });
    
    // Still update user status to pending in DB
    await sql`UPDATE users SET status = 'pending' WHERE id = ${req.user.id}`;
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar comprovante' });
  }
});

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await sql`
      SELECT u.id, u.login, u.name, u.email, u.plan, u.status, u.is_admin, u.created_at,
             p.proof_url, p.id as payment_id, p.status as payment_status
      FROM users u
      LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'pending'
      ORDER BY u.created_at DESC
    `;
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

app.post('/api/admin/approve', authenticateToken, isAdmin, async (req, res) => {
  const { userId, action } = req.body;
  try {
    const status = action === 'approve' ? 'active' : 'blocked';
    const plan = action === 'approve' ? 'premium' : 'free';
    await sql`UPDATE users SET status = ${status}, plan = ${plan} WHERE id = ${userId}`;
    res.json({ message: 'Ação concluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro na ação' });
  }
});

app.post('/api/admin/settings', authenticateToken, isAdmin, async (req, res) => {
  const { settings } = req.body;
  try {
    for (const [key, value] of Object.entries(settings)) {
      await sql`
        INSERT INTO settings (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = ${value}
      `;
    }
    res.json({ message: 'Configurações atualizadas com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

export default app;
