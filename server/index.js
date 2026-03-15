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
const upload = multer({ storage });

// --- Routes ---

// Register
app.post('/api/register', async (req, res) => {
  const { name, email } = req.body;
  
  // Auto-generate credentials
  const login = 'user' + Math.floor(1000 + Math.random() * 9000);
  const rawPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  try {
    const result = await sql`
      INSERT INTO users (login, password, name, email, status, plan)
      VALUES (${login}, ${hashedPassword}, ${name}, ${email}, 'active', 'free')
      RETURNING id, login, name, is_admin
    `;
    
    res.json({ 
      user: result[0], 
      credentials: { login, password: rawPassword },
      message: 'Usuário registrado com sucesso. Guarde suas credenciais!' 
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
    
    // Check if it's the default admin (plaintext for now)
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
    const proof_url = `/uploads/${req.file.filename}`;
    await sql`
      INSERT INTO payments (user_id, proof_url, status)
      VALUES (${req.user.id}, ${proof_url}, 'pending')
    `;
    
    // Set user status to pending
    await sql`UPDATE users SET status = 'pending' WHERE id = ${req.user.id}`;
    
    res.json({ message: 'Comprovante enviado com sucesso. Aguarde aprovação.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar comprovante' });
  }
});

// Admin: List Users
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await sql`
      SELECT u.*, p.proof_url, p.id as payment_id, p.status as payment_status
      FROM users u
      LEFT JOIN payments p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `;
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Admin: Approve User
app.post('/api/admin/approve', authenticateToken, isAdmin, async (req, res) => {
  const { userId, action } = req.body; // action: 'approve' | 'reject'
  
  try {
    const status = action === 'approve' ? 'active' : 'blocked';
    const plan = action === 'approve' ? 'premium' : 'free';
    
    await sql`UPDATE users SET status = ${status}, plan = ${plan} WHERE id = ${userId}`;
    if (action === 'approve') {
       await sql`UPDATE payments SET status = 'approved' WHERE user_id = ${userId}`;
    }
    
    res.json({ message: `Usuário ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar ação' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
