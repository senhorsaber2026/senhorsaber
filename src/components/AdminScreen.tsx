import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Eye, ExternalLink, RefreshCw, ShieldCheck, Key, Save, DollarSign, Trash2, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminScreen: React.FC = () => {
  const { userProfile } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Settings state
  const [globalKey, setGlobalKey] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixValue, setPixValue] = useState('');
  
  const [keySaving, setKeySaving] = useState(false);
  const [keyMsg, setKeyMsg] = useState('');
  
  // Image Upload state
  const [personaFile, setPersonaFile] = useState<File | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [activeSection, setActiveSection] = useState<'users' | 'settings'>('users');

  const fetchUsers = async () => {
    if (!userProfile?.token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
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

  const fetchCurrentSettings = async () => {
    try {
      const res = await fetch('/api/settings/public');
      const data = await res.json();
      setGlobalKey(data.global_api_key || '');
      setPixKey(data.pix_key || '');
      setPixValue(data.pix_value || '');
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentSettings();
  }, []);

  const handleDelete = async (userId: number, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR permanentemente o usuário ${userName}? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userProfile?.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('✅ Usuário excluído!');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAction = async (userId: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/approve', {
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

  const handleImageUpload = async () => {
    if (!personaFile) return;
    setUploadingImg(true);
    setUploadMsg('');
    try {
      const formData = new FormData();
      formData.append('image', personaFile);
      const res = await fetch('/api/admin/persona-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userProfile?.token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadMsg('✅ Imagem atualizada! Recarregue a página.');
      setPersonaFile(null);
    } catch (err: any) {
      setUploadMsg('❌ ' + err.message);
    } finally {
      setUploadingImg(false);
    }
  };

  const saveSettings = async () => {
    setKeySaving(true);
    setKeyMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userProfile?.token}`
        },
        body: JSON.stringify({ 
          settings: {
            global_api_key: globalKey.trim(),
            pix_key: pixKey.trim(),
            pix_value: pixValue.trim()
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setKeyMsg('✅ Configurações atualizadas com sucesso!');
    } catch (err: any) {
      setKeyMsg('❌ ' + err.message);
    } finally {
      setKeySaving(false);
    }
  };

  return (
    <div style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', color: 'var(--holo-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} /> PAINEL ADMIN
        </h2>
        <button className="btn-ghost" onClick={fetchUsers} disabled={loading} style={{ padding: '0.4rem' }}>
          {loading ? <RefreshCw className="animate-spin" size={15} /> : <RefreshCw size={15} />}
        </button>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', marginBottom: '1.25rem' }}>
        <button onClick={() => setActiveSection('users')} style={{ flex: 1, padding: '0.4rem', borderRadius: '7px', border: 'none', background: activeSection === 'users' ? 'var(--holo-primary)' : 'transparent', color: activeSection === 'users' ? '#000' : '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>👥 Usuários</button>
        <button onClick={() => setActiveSection('settings')} style={{ flex: 1, padding: '0.4rem', borderRadius: '7px', border: 'none', background: activeSection === 'settings' ? 'var(--holo-primary)' : 'transparent', color: activeSection === 'settings' ? '#000' : '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>⚙️ Configurações</button>
      </div>

      {activeSection === 'settings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', color: 'var(--holo-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={14} /> Chave API Global
            </p>
            <input
              className="input-holo"
              type="password"
              placeholder="gsk_..."
              value={globalKey}
              onChange={e => setGlobalKey(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', color: 'var(--holo-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={14} /> Chave PIX do Vendor
            </p>
            <input
              className="input-holo"
              placeholder="Ex: seu-pix@email.com"
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', color: 'var(--holo-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={14} /> Valor Assinatura (Ex: 19,90)
            </p>
            <input
              className="input-holo"
              placeholder="19,90"
              value={pixValue}
              onChange={e => setPixValue(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          {keyMsg && <p style={{ fontSize: '0.75rem', marginBottom: '1rem', color: keyMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{keyMsg}</p>}
          <button className="btn-primary" onClick={saveSettings} disabled={keySaving} style={{ width: '100%', justifyContent: 'center', marginBottom: '2rem' }}>
            {keySaving ? <RefreshCw className="animate-spin" size={14} /> : <><Save size={14} /> Salvar Configurações</>}
          </button>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '1.5rem 0' }} />

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', color: 'var(--holo-primary)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={14} /> Mudar Imagem do Senhor Saber
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => setPersonaFile(e.target.files?.[0] || null)}
                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
              />
              {uploadMsg && <p style={{ fontSize: '0.75rem', color: uploadMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{uploadMsg}</p>}
              <button 
                className="btn-ghost" 
                onClick={handleImageUpload} 
                disabled={!personaFile || uploadingImg}
                style={{ borderColor: 'var(--holo-primary)', color: 'var(--holo-primary)' }}
              >
                {uploadingImg ? <RefreshCw className="animate-spin" size={14} /> : 'Fazer Upload'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeSection === 'users' && (
        <>
          {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.8rem' }}>{error}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {users.length === 0 && !loading && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem', marginTop: '2rem' }}>Nenhum usuário cadastrado ainda.</p>
            )}
            {users.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{u.name || 'Sem nome'}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Login: <span style={{ color: 'var(--holo-primary)', fontFamily: 'monospace' }}>{u.login}</span></p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.65rem', padding: '3px 10px', borderRadius: '4px',
                      background: u.status === 'active' ? 'rgba(16,185,129,0.15)' : u.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: u.status === 'active' ? '#10b981' : u.status === 'pending' ? '#f59e0b' : '#ef4444',
                      display: 'block', marginBottom: '4px'
                    }}>
                      {u.status === 'active' ? 'ATIVO' : u.status === 'pending' ? 'AGUARDANDO' : 'BLOQUEADO'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: u.plan === 'premium' ? '#f59e0b' : 'var(--text-muted)' }}>{u.plan?.toUpperCase()}</span>
                  </div>
                </div>

                {u.proof_url && (
                  <div style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.15)', borderRadius: '8px', padding: '0.6rem 0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Eye size={13} color="var(--holo-primary)" />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Comprovante enviado</span>
                    </div>
                      <a href={u.proof_url} target="_blank" rel="noreferrer"
                      style={{ fontSize: '0.72rem', color: 'var(--holo-primary)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                      Ver <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {!u.is_admin && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleAction(u.id, 'approve')}
                      disabled={u.status === 'active'}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: u.status === 'active' ? 'rgba(16,185,129,0.1)' : '#10b981', color: u.status === 'active' ? '#10b981' : '#000', fontWeight: 700, fontSize: '0.78rem', cursor: u.status === 'active' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <CheckCircle size={13} /> Aprovar
                    </button>
                    <button
                      onClick={() => handleAction(u.id, 'reject')}
                      disabled={u.status === 'blocked'}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 700, fontSize: '0.78rem', cursor: u.status === 'blocked' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <XCircle size={13} /> Bloquear
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
