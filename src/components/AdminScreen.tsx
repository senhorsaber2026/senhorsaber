import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Eye, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminScreen: React.FC = () => {
  const { userProfile } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    if (!userProfile?.token) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${userProfile.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (userId: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userProfile?.token}`
        },
        body: JSON.stringify({ userId, action })
      });
      if (!res.ok) throw new Error('Erro ao processar ação');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.2rem', color: 'var(--holo-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck /> ÁREA ADMIN
        </h2>
        <button className="btn-secondary" onClick={fetchUsers} disabled={loading} style={{ padding: '0.5rem' }}>
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {users.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name || 'Sem nome'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Login: <span style={{ color: 'var(--holo-primary)' }}>{u.login}</span> | ID: {u.id}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status App: <span style={{ color: u.status === 'active' ? '#10b981' : '#f59e0b' }}>{u.status.toUpperCase()}</span></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</p>
                 <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: u.plan === 'premium' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)', color: u.plan === 'premium' ? '#f59e0b' : '#fff' }}>
                   {u.plan.toUpperCase()}
                 </span>
              </div>
            </div>

            {u.proof_url && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye size={14} color="var(--holo-primary)" />
                  <span style={{ fontSize: '0.75rem' }}>Comprovante: {u.payment_status}</span>
                </div>
                <a href={`http://localhost:3001${u.proof_url}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--holo-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Ver Arquivo <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-primary" onClick={() => handleAction(u.id, 'approve')} disabled={u.status === 'active'} style={{ flex: 1, justifyContent: 'center', background: '#10b981', color: '#fff', border: 'none' }}>
                <CheckCircle size={14} /> Aprovar
              </button>
              <button className="btn-secondary" onClick={() => handleAction(u.id, 'reject')} disabled={u.status === 'blocked'} style={{ flex: 1, justifyContent: 'center', borderColor: '#ef4444', color: '#ef4444' }}>
                <XCircle size={14} /> Bloquear
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
