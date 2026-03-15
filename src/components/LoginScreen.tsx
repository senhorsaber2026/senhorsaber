import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, RefreshCw, LogIn, Copy, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginScreen: React.FC = () => {
  const { login, register } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ login: '', password: '', name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<{ login: string, password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login({ login: formData.login, password: formData.password });
      } else {
        const creds = await register({ name: formData.name, email: formData.email });
        setCredentials(creds);
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const copyCreds = () => {
    if (!credentials) return;
    navigator.clipboard.writeText(`Login: ${credentials.login}\nSenha: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', background: 'var(--bg-holo)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</motion.div>
          <h1 style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--holo-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>SENHOR SABER</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{mode === 'login' ? 'Entre na sua conta' : 'Crie seu acesso inteligente'}</p>
        </div>

        <AnimatePresence mode="wait">
          {credentials ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ color: '#10b981', fontWeight: 600, marginBottom: '1rem' }}>Acesso Gerado!</p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'left', fontFamily: 'monospace', fontSize: '1.1rem', position: 'relative' }}>
                  <p style={{ color: 'var(--holo-primary)' }}>Login: {credentials.login}</p>
                  <p style={{ color: 'var(--text-primary)' }}>Senha: {credentials.password}</p>
                  <button onClick={copyCreds} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Copie suas credenciais antes de prosseguir.</p>
              </div>
              <button className="btn-primary" onClick={() => { setCredentials(null); setMode('login'); }} style={{ width: '100%', justifyContent: 'center' }}>Ir para Login</button>
            </motion.div>
          ) : (
            <motion.form key={mode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleAuth}>
              {mode === 'register' && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nome Completo</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                      <input className="input-holo" placeholder="Ex: João Silva" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ paddingLeft: '2.5rem' }} required />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>E-mail</label>
                    <div style={{ position: 'relative' }}>
                      <LogIn size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                      <input className="input-holo" type="email" placeholder="email@exemplo.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ paddingLeft: '2.5rem' }} required />
                    </div>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Login</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                      <input className="input-holo" placeholder="user1234" value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} style={{ paddingLeft: '2.5rem' }} required />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Senha</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                      <input className="input-holo" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ paddingLeft: '2.5rem' }} required />
                    </div>
                  </div>
                </>
              )}

              {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

              <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : (mode === 'login' ? 'Entrar' : 'Gerar Acesso')}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {mode === 'login' ? 'Não tem acesso?' : 'Já tem acesso?'}
                <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: 'var(--holo-primary)', fontWeight: 600, marginLeft: '0.5rem', cursor: 'pointer' }}>
                  {mode === 'login' ? 'Criar agora' : 'Fazer login'}
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
