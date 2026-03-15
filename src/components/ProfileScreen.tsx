import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Star, Flame, Trophy, Lock, Crown, Check, Settings, Key, RefreshCw } from 'lucide-react';
import { Avatar } from './Avatar';
import { useApp } from '../context/AppContext';

export const ProfileScreen: React.FC = () => {
  const { userProfile, setPlan, apiKey, setApiKey, aiProvider, setAiProvider, customBaseUrl, setCustomBaseUrl, customModelId, setCustomModelId } = useApp();
  const [showApiInput, setShowApiInput] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempBaseUrl, setTempBaseUrl] = useState(customBaseUrl);
  const [tempModelId, setTempModelId] = useState(customModelId);

  const [isActivating, setIsActivating] = useState(false);

  const saveSettings = () => {
    setApiKey(tempKey);
    setCustomBaseUrl(tempBaseUrl);
    setCustomModelId(tempModelId);
    setShowApiInput(false);
  };

  const handleSubscribe = () => {
    setIsActivating(true);
    // Simula uma validação real de pagamento/processamento
    setTimeout(() => {
      setPlan('premium');
      setIsActivating(false);
    }, 2500);
  };

  const isPremium = userProfile.plan === 'premium';

  const stats = [
    { icon: <Trophy size={18} />, label: 'Pontos Totais', value: userProfile.totalScore.toLocaleString('pt-BR'), color: '#f59e0b' },
    { icon: <Flame size={18} />, label: 'Dias Seguidos', value: `${userProfile.streak} 🔥`, color: '#ef4444' },
    { icon: <Star size={18} />, label: 'Simulados', value: '12', color: 'var(--holo-secondary)' },
    { icon: <Check size={18} />, label: 'Questões Certas', value: '87%', color: '#10b981' },
  ];

  const FREE_LIMITS = [
    { label: 'Perguntas/dia', used: userProfile.questionsToday, max: 10 },
    { label: 'Simulados/dia', used: userProfile.simuladosToday, max: 1 },
  ];

  return (
    <div style={{ padding: '1.25rem', maxWidth: 500, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <Avatar size="md" />
        </div>
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {userProfile.name}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{userProfile.email}</p>
        {isPremium ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '99px', padding: '0.25rem 0.75rem', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700 }}>
            <Crown size={12} />PREMIUM
          </div>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '99px', padding: '0.25rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <User size={12} />GRATUITO
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
            <div style={{ color: s.color, marginBottom: '0.35rem' }}>{s.icon}</div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: '1rem', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Usage limits (free) */}
      {!isPremium && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Uso Diário (Plano Gratuito)</p>
          {FREE_LIMITS.map((l, i) => (
            <div key={i} style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{l.label}</span>
                <span style={{ color: l.used >= l.max ? '#ef4444' : 'var(--holo-primary)', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>{l.used}/{l.max}</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: '3px', background: l.used >= l.max ? '#ef4444' : 'var(--holo-primary)' }}
                  initial={{ width: 0 }} animate={{ width: `${(l.used / l.max) * 100}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </div>
          ))}
          <button 
            className="btn-primary" 
            onClick={handleSubscribe} 
            disabled={isActivating}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', position: 'relative', overflow: 'hidden' }}
          >
            {isActivating ? (
              <motion.div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                   <RefreshCw size={14} />
                </motion.div>
                Processando Assinatura...
              </motion.div>
            ) : (
              <><Crown size={14} /> Assinar Premium · R$ 19,90/mês</>
            )}
          </button>
        </div>
      )}

      {/* Premium features */}
      {!isPremium && (
        <div className="glass-card-purple" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', color: 'var(--holo-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={14} />✨ PREMIUM inclui
          </p>
          {[
            'Perguntas e simulados ilimitados',
            'Leitor de PDF com IA',
            'Plano de estudo personalizado',
            'Gerador avançado de questões',
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Check size={13} style={{ color: 'var(--holo-secondary)' }} />{f}
            </div>
          ))}
        </div>
      )}

      {/* API Key setting */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showApiInput ? '0.75rem' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={14} style={{ color: 'var(--holo-primary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>Gemini API Key</span>
          </div>
          <button className="btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }} onClick={() => setShowApiInput(s => !s)}>
            <Settings size={12} />{showApiInput ? 'Cancelar' : 'Configurar'}
          </button>
        </div>
        {showApiInput && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.25rem', marginBottom: '1rem' }}>
              <button onClick={() => setAiProvider('gemini')} style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: 'none', background: aiProvider === 'gemini' ? 'var(--holo-primary)' : 'transparent', color: aiProvider === 'gemini' ? '#000' : '#fff', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>Google Gemini</button>
              <button onClick={() => setAiProvider('universal')} style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: 'none', background: aiProvider === 'universal' ? 'var(--holo-primary)' : 'transparent', color: aiProvider === 'universal' ? '#000' : '#fff', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>Universal (OpenAI/Groq)</button>
            </div>

            {aiProvider === 'gemini' ? (
              <>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  Este aplicativo usa a tecnologia <strong>Google Gemini</strong>. Tokens de outros sites (como Cloudflare) não funcionarão neste modo.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="btn-primary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', fontSize: '0.75rem' }}>
                    <Key size={12} /> Pegar Chave Grátis
                  </a>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  Use qualquer serviço compatível com OpenAI (Groq, OpenRouter, Cloudflare, etc).
                </p>
                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Base URL (ex: https://api.groq.com/openai/v1)</label>
                <input className="input-holo" placeholder="https://..." value={tempBaseUrl} onChange={e => setTempBaseUrl(e.target.value)} style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }} />
                
                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Model ID (ex: llama-3.1-8b-instant)</label>
                <input className="input-holo" placeholder="llama-3.1..." value={tempModelId} onChange={e => setTempModelId(e.target.value)} style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }} />
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>API Key</label>
            <input className="input-holo" type="password" placeholder={aiProvider === 'gemini' ? "AIzaSy..." : "Sua Chave API"} value={tempKey} onChange={e => setTempKey(e.target.value)} style={{ marginBottom: '1rem' }} />
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-primary" onClick={saveSettings} style={{ flex: 1, justifyContent: 'center' }}>
                <Check size={13} /> Salvar Configurações
              </button>
            </div>
            {apiKey && <p style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={11} />Configurado com sucesso!</p>}
          </motion.div>
        )}
      </div>

      {/* Lock features */}
      {!isPremium && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <Lock size={12} />Recursos ilimitados disponíveis no plano Premium
        </div>
      )}
    </div>
  );
};
