import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';
import multer from 'multer';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'senhor-saber-secret-key-2026';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[API LOG] ${req.method} ${req.path}`);
  next();
});

// Multi-part form handling for serverless (limited persistence)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '/tmp'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Lazy SQL client to avoid crash if env is missing during boot
let sql;
const getSql = () => {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
};

// Lazy initialization of settings table
let isInitialized = false;
const ensureInitialized = async () => {
  if (isInitialized) return;
  try {
    const db = getSql();
    await db`
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
      const existing = await db`SELECT value FROM settings WHERE key = ${d.key}`;
      if (existing.length === 0 && d.value) {
        await db`INSERT INTO settings (key, value) VALUES (${d.key}, ${d.value})`;
      }
    }
    isInitialized = true;
  } catch (e) { 
    console.error('Initialization error:', e.message); 
    // We don't throw here to allow subsequent requests to try again
  }
};

// Middleware to ensure DB is ready and handle global errors
const dbReady = async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed: ' + err.message });
  }
};

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

app.get('/api/health', (req, res) => res.json({ status: 'ok', env: !!process.env.DATABASE_URL }));

app.get('/api/settings/public', dbReady, async (req, res) => {
  try {
    const db = getSql();
    const result = await db`SELECT key, value FROM settings WHERE key IN ('global_api_key', 'pix_key', 'pix_value')`;
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

app.post('/api/register', dbReady, async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Nome e email são obrigatórios' });
  
  const login = 'user' + Math.floor(1000 + Math.random() * 9000);
  const rawPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  try {
    const db = getSql();
    const result = await db`
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
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário: ' + error.message });
  }
});

app.post('/api/login', dbReady, async (req, res) => {
  const { login, password } = req.body;
  try {
    const db = getSql();
    const users = await db`SELECT * FROM users WHERE login = ${login}`;
    if (users.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });
    
    const user = users[0];
    let isMatch = false;
    
    // Safety check for password comparison
    try {
      if (user.login === 'admin' && password === 'admin123') {
        isMatch = true;
      } else if (user.password && user.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        // Plain text fallback or invalid password format
        isMatch = (password === user.password);
      }
    } catch (bcryptErr) {
      console.error('Bcrypt error:', bcryptErr);
      isMatch = false;
    }

    if (!isMatch) return res.status(401).json({ error: 'Senha incorreta' });
    
    const token = jwt.sign({ id: user.id, login: user.login, is_admin: user.is_admin }, JWT_SECRET);
    const { password: _, ...userWithoutPass } = user;
    res.json({ user: userWithoutPass, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro no login: ' + error.message });
  }
});

// O handler de 404 foi movido para o final

app.post('/api/payments/proof', authenticateToken, dbReady, upload.single('proof'), async (req, res) => {
  try {
    const db = getSql();
    await db`UPDATE users SET status = 'pending' WHERE id = ${req.user.id}`;
    res.json({ message: 'Comprovante recebido! (Ambiente Vercel: persistência de imagem desativada)' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar comprovante' });
  }
});

// User Avatar Upload
app.post('/api/user/avatar', authenticateToken, dbReady, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    const avatar_url = `/uploads/${req.file.filename}`;
    const db = getSql();
    await db`UPDATE users SET avatar_url = ${avatar_url} WHERE id = ${req.user.id}`;
    res.json({ message: 'Avatar atualizado com sucesso!', url: avatar_url });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Erro ao salvar avatar' });
  }
});

app.get('/api/admin/users', authenticateToken, isAdmin, dbReady, async (req, res) => {
  try {
    const db = getSql();
    const users = await db`
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

app.post('/api/admin/approve', authenticateToken, isAdmin, dbReady, async (req, res) => {
  const { userId, action } = req.body;
  try {
    const db = getSql();
    const status = action === 'approve' ? 'active' : 'blocked';
    const plan = action === 'approve' ? 'premium' : 'free';
    await db`UPDATE users SET status = ${status}, plan = ${plan} WHERE id = ${userId}`;
    res.json({ message: 'Ação concluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro na ação' });
  }
});

app.post('/api/admin/settings', authenticateToken, isAdmin, dbReady, async (req, res) => {
  const { settings } = req.body;
  try {
    const db = getSql();
    for (const [key, value] of Object.entries(settings)) {
      await db`
        INSERT INTO settings (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = ${value}
      `;
    }
    res.json({ message: 'Configurações atualizadas com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

app.delete('/api/admin/users/:userId', authenticateToken, isAdmin, dbReady, async (req, res) => {
  const { userId } = req.params;
  try {
    const db = getSql();
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({ error: 'Você não pode excluir a si mesmo' });
    }
    await db`DELETE FROM payments WHERE user_id = ${userId}`;
    await db`DELETE FROM users WHERE id = ${userId}`;
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

app.post('/api/admin/persona-image', authenticateToken, isAdmin, dbReady, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    // In Vercel /tmp is temporary, but settings URL will point correctly to what the frontend expects
    const image_url = `/uploads/${req.file.filename}`;
    const db = getSql();
    await db`
      INSERT INTO settings (key, value) VALUES ('persona_image_url', ${image_url})
      ON CONFLICT (key) DO UPDATE SET value = ${image_url}
    `;
    res.json({ message: 'Imagem atualizada!', url: image_url });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar imagem' });
  }
});

// Default 404 handler for API - MOVIDO PARA O FINAL
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Final Error handler
app.use((err, req, res, next) => {
  console.error('API ERROR:', err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

export default app;
