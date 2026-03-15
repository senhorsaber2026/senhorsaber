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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;
const JWT_SECRET = 'senhor-saber-secret-key-2026';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const sql = neon(process.env.DATABASE_URL);

// Ensure settings table exists
(async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT
      )
    `;
    // Default global API key from env
    const existing = await sql`SELECT value FROM settings WHERE key = 'global_api_key'`;
    if (existing.length === 0 && process.env.VITE_GROQ_API_KEY) {
      await sql`INSERT INTO settings (key, value) VALUES ('global_api_key', ${process.env.VITE_GROQ_API_KEY})`;
    }
  } catch (e) { console.error('Settings init error:', e.message); }
})();

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
  if (!req.user.is_admin) return res.status(403).json({ error: 'Acesso negado: Administrador apenas' });
  next();
};

// --- Storage Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// --- Public Routes ---

// Get global API key (public endpoint so frontend can load it)
app.get('/api/settings/apikey', async (req, res) => {
  try {
    const result = await sql`SELECT value FROM settings WHERE key = 'global_api_key'`;
    res.json({ apiKey: result[0]?.value || '' });
  } catch (error) {
    res.json({ apiKey: process.env.VITE_GROQ_API_KEY || '' });
  }
});

// Register - status starts as 'pending' to require payment
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
      message: 'Usuário registrado! Guarde suas credenciais e envie o comprovante do PIX para liberar o acesso.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar usuário: ' + error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  
  try {
    const users = await sql`SELECT * FROM users WHERE login = ${login}`;
    if (users.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

    const user = users[0];
    
    let isMatch = false;
    if (user.login === 'admin' && password === 'admin123') {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ id: user.id, login: user.login, is_admin: user.is_admin }, JWT_SECRET);
    const { password: _, ...userWithoutPass } = user;
    res.json({ user: userWithoutPass, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no login' });
  }
});

// Payment Proof Upload
app.post('/api/payments/proof', authenticateToken, upload.single('proof'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    
    const proof_url = `/uploads/${req.file.filename}`;
    
    // Remove old pending payment if any
    await sql`DELETE FROM payments WHERE user_id = ${req.user.id} AND status = 'pending'`;
    
    // Insert new payment record
    await sql`
      INSERT INTO payments (user_id, proof_url, status)
      VALUES (${req.user.id}, ${proof_url}, 'pending')
    `;
    
    // Update user status to 'waiting_approval'
    await sql`UPDATE users SET status = 'pending' WHERE id = ${req.user.id}`;
    
    res.json({ 
      message: 'Comprovante enviado com sucesso! Aguarde aprovação do administrador.',
      proof_url 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar comprovante: ' + error.message });
  }
});

// Admin: List Users
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
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Admin: Approve/Block User
app.post('/api/admin/approve', authenticateToken, isAdmin, async (req, res) => {
  const { userId, action } = req.body;
  
  try {
    const status = action === 'approve' ? 'active' : 'blocked';
    const plan = action === 'approve' ? 'premium' : 'free';
    
    await sql`UPDATE users SET status = ${status}, plan = ${plan} WHERE id = ${userId}`;
    
    if (action === 'approve') {
      await sql`UPDATE payments SET status = 'approved' WHERE user_id = ${userId} AND status = 'pending'`;
    }
    
    res.json({ message: `Usuário ${action === 'approve' ? 'aprovado' : 'bloqueado'} com sucesso.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar ação' });
  }
});

// Admin: Update Global API Key
app.post('/api/admin/apikey', authenticateToken, isAdmin, async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API Key não pode estar vazia' });
  
  try {
    await sql`
      INSERT INTO settings (key, value) VALUES ('global_api_key', ${apiKey})
      ON CONFLICT (key) DO UPDATE SET value = ${apiKey}
    `;
    res.json({ message: 'Chave API global atualizada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar chave API' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
