import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Check, AlertCircle, RefreshCw, QrCode } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PaymentScreen: React.FC = () => {
  const { userProfile } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userProfile) return;

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('proof', file);

    try {
      const res = await fetch('http://localhost:3001/api/payments/proof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userProfile.token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar comprovante');
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: '#10b981', marginBottom: '1rem' }}>
          <Check size={48} style={{ margin: '0 auto' }} />
        </motion.div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Comprovante Enviado!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nossa equipe analisará seu pagamento em breve. Seu acesso será liberado assim que confirmado.</p>
        <button className="btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '1.5rem' }}>Entendido</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.25rem', maxWidth: 500, margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(0,245,255,0.1)', width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <QrCode size={30} color="var(--holo-primary)" />
          </div>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.2rem', color: 'var(--holo-primary)' }}>PAGAMENTO PIX</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Assinatura Premium Senhor Saber</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-holo)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Valor da Assinatura</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>R$ 19,90</p>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Plano Mensal com acesso ilimitado</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Chave PIX (CNPJ/E-mail):</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="input-holo" readOnly value="pix@senhorsaber.com.br" style={{ flex: 1, fontSize: '0.9rem' }} />
            <button className="btn-ghost" onClick={() => navigator.clipboard.writeText('pix@senhorsaber.com.br')}><Check size={14} /></button>
          </div>
        </div>

        <form onSubmit={handleUpload}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Enviar Comprovante:</p>
          <div style={{ position: 'relative', border: '2px dashed var(--border-holo)', borderRadius: '12px', padding: '2rem', textAlign: 'center', marginBottom: '1rem', cursor: 'pointer' }}>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} accept="image/*,.pdf" />
            <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{file ? file.name : 'Clique ou arraste o arquivo'}</p>
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={14} /> {error}</div>}

          <button className="btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <><Check size={18} /> Confirmar Pagamento</>}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
        <p>Ao realizar o pagamento, concordar com os termos de uso.</p>
      </div>
    </div>
  );
};
