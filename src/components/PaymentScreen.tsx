import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Check, AlertCircle, RefreshCw, QrCode, Copy, LogOut, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PaymentScreen: React.FC = () => {
  const { userProfile, logout, setUserProfile, pixInfo } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const copyPix = () => {
    navigator.clipboard.writeText(pixInfo.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userProfile) return;

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('proof', file);

    try {
      const res = await fetch('/api/payments/proof', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userProfile.token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar comprovante');
      
      setSuccess(true);
      // Update local user profile to reflect 'pending' status
      if (setUserProfile && userProfile) {
        const updated = { ...userProfile, status: 'pending' as const };
        setUserProfile(updated);
        localStorage.setItem('user_profile_real', JSON.stringify(updated));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', background: 'var(--bg-holo)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</motion.div>
          <h1 style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--holo-primary)', fontSize: '1.3rem', marginBottom: '0.25rem' }}>SENHOR SABER</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Olá, <strong style={{ color: 'var(--text-primary)' }}>{userProfile?.name || userProfile?.login}</strong> 👋</p>
        </div>

        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <Clock size={40} style={{ color: '#f59e0b', margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Comprovante Enviado!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Seu comprovante foi recebido e está em análise. O administrador irá liberar seu acesso em breve.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1rem' }}>Você será notificado quando o acesso for liberado. Tente fazer login novamente mais tarde.</p>
            <button className="btn-secondary" onClick={logout} style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}>
              <LogOut size={14} /> Sair e Voltar Depois
            </button>
          </motion.div>
        ) : (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            {/* PIX Section */}
            <div style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(168,85,247,0.05))', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
              <QrCode size={28} style={{ color: 'var(--holo-primary)', margin: '0 auto 0.5rem', display: 'block' }} />
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Valor da Assinatura Mensal</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>R$ {pixInfo.value}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Acesso ilimitado a todos os recursos por 30 dias</p>
              
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Chave PIX (e-mail)</p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input className="input-holo" readOnly value={pixInfo.key}
                  style={{ flex: 1, fontSize: '0.85rem', textAlign: 'center', background: 'rgba(0,245,255,0.04)' }} />
                <button className="btn-primary" onClick={copyPix} style={{ padding: '0.5rem 0.75rem', minWidth: 'auto' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Upload Section */}
            <form onSubmit={handleUpload}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                📎 Após pagar, envie o comprovante:
              </p>

              <label style={{ display: 'block', position: 'relative', border: `2px dashed ${file ? 'var(--holo-primary)' : 'var(--border-holo)'}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: file ? 'rgba(0,245,255,0.04)' : 'transparent', marginBottom: '1rem' }}>
                <input
                  type="file"
                  onChange={e => { setFile(e.target.files?.[0] || null); setError(''); }}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  accept="image/*,.pdf"
                />
                <Upload size={22} style={{ color: file ? 'var(--holo-primary)' : 'var(--text-muted)', marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
                {file ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--holo-primary)', fontWeight: 600 }}>{file.name}</p>
                ) : (
                  <>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Clique para escolher o arquivo</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Imagem ou PDF · Máx. 10MB</p>
                  </>
                )}
              </label>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? (
                  <><RefreshCw className="animate-spin" size={15} /> Enviando...</>
                ) : (
                  <><Check size={15} /> Confirmar Pagamento</>
                )}
              </button>
            </form>

            {/* Logout option */}
            <button onClick={logout} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <LogOut size={12} /> Fazer login com outra conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
