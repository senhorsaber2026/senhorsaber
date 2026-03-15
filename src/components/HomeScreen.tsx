import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, ClipboardList, FileText, LayoutGrid, TrendingUp,
  Sparkles, ChevronRight, Flame, Eye, Brain
} from 'lucide-react';
import { Avatar } from './Avatar';
import { useApp } from '../context/AppContext';

import { senhorSaberSpeak, stopSpeaking } from '../services/ttsService';

type HomeLauncher = { icon: React.ReactNode; label: string; desc: string; tab: string; color: string; glow: string };

const launchers: HomeLauncher[] = [
  { icon: <Eye size={22} />, label: 'Oráculo', desc: 'Previsões de editais', tab: 'oraculo', color: '#00f5ff', glow: 'rgba(0,245,255,0.15)' },
  { icon: <Brain size={22} />, label: 'Previsão IA', desc: 'Questões mais cobradas', tab: 'previsao', color: '#a855f7', glow: 'rgba(168,85,247,0.15)' },
  { icon: <MessageCircle size={22} />, label: 'Perguntar', desc: 'Tire dúvidas com o Senhor Saber', tab: 'perguntas', color: '#00f5ff', glow: 'rgba(0,245,255,0.15)' },
  { icon: <ClipboardList size={22} />, label: 'Simulado', desc: 'Crie um quiz personalizado', tab: 'simulados', color: '#a855f7', glow: 'rgba(168,85,247,0.15)' },
  { icon: <FileText size={22} />, label: 'Importar PDF', desc: 'Analise apostilas com IA', tab: 'pdf', color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  { icon: <LayoutGrid size={22} />, label: 'Flashcards', desc: 'Cartões inteligentes', tab: 'flashcards', color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  { icon: <TrendingUp size={22} />, label: 'Plano de Estudo', desc: 'Organize metas c/ IA', tab: 'estudos', color: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  { icon: <Sparkles size={22} />, label: 'Questões', desc: 'Gere questões estilo banca', tab: 'simulados', color: '#ef4444', glow: 'rgba(239,68,68,0.15)' },
];

export const HomeScreen: React.FC = () => {
  const { userProfile, chatHistory, setActiveTab } = useApp();
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

  React.useEffect(() => {
    // Bem-vindo greeting with Audio
    const speakWelcome = () => {
      const name = userProfile.name && userProfile.name !== 'Usuário' ? userProfile.name : '';
      const greeting = `Seja bem-vindo meu aluno ${name}, o que vamos fazer hoje?`;
      
      senhorSaberSpeak(greeting, {
        onStart: () => setIsAvatarSpeaking(true),
        onEnd: () => setIsAvatarSpeaking(false)
      });
    };

    const timer = setTimeout(speakWelcome, 1000);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [userProfile.name]);

  const handleLaunch = (tab: string) => {
    setActiveTab(tab === 'pdf' ? 'estudos' : tab);
  };

  const welcomeText = `Seja bem-vindo meu aluno ${userProfile.name && userProfile.name !== 'Usuário' ? userProfile.name : ''}, o que vamos fazer hoje?`;

  return (
    <div style={{ padding: '1.25rem 1.25rem 2rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', padding: '1.5rem 0 2rem', position: 'relative' }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          <Avatar size="xl" speaking={isAvatarSpeaking} />
          
          {/* Subtle text reveal that follows the voice */}
          <AnimatePresence>
            {isAvatarSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  bottom: '-35px',
                  color: 'var(--holo-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textShadow: '0 0 10px rgba(0,245,255,0.5)',
                  fontFamily: 'Orbitron, sans-serif',
                  letterSpacing: '1px',
                  maxWidth: '250px',
                  lineHeight: '1.2'
                }}
              >
                "{welcomeText}"
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.h1
          style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.4rem', marginBottom: '0.35rem' }}
          animate={{ textShadow: ['0 0 20px rgba(0,245,255,0.5)', '0 0 40px rgba(0,245,255,0.8)', '0 0 20px rgba(0,245,255,0.5)'] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span style={{ color: 'var(--holo-primary)' }}>SENHOR</span>{' '}
          <span style={{ color: 'var(--text-primary)' }}>SABER</span>
        </motion.h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
          Seu Professor Digital Inteligente
        </p>

        {/* Streak badge */}
        {userProfile.streak > 0 && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              marginTop: '0.75rem', background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)', borderRadius: '99px',
              padding: '0.25rem 0.8rem', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600,
            }}
          >
            <Flame size={13} />{userProfile.streak} dias seguidos!
          </motion.div>
        )}
      </motion.div>

      {/* Quick ask */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', cursor: 'pointer' }}
        onClick={() => setActiveTab('perguntas')}
        whileHover={{ borderColor: 'rgba(0,245,255,0.4)', background: 'rgba(0,245,255,0.02)' }}
        whileTap={{ scale: 0.98 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Sparkles size={20} style={{ color: 'var(--holo-primary)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pergunte ao Senhor Saber...</p>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </motion.div>

      {/* Launcher grid */}
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Ferramentas</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {launchers.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
            className="glass-card"
            style={{ padding: '1rem', cursor: 'pointer', borderColor: 'rgba(255,255,255,0.06)' }}
            onClick={() => handleLaunch(item.tab)}
            whileHover={{ borderColor: item.color + '55', background: item.glow }}
            whileTap={{ scale: 0.95 }}
          >
            <div style={{ color: item.color, marginBottom: '0.5rem', width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${item.color}15` }}>
              {item.icon}
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{item.label}</p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent activity */}
      {chatHistory.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Atividade Recente</p>
          <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
            {chatHistory.slice(-3).reverse().map((msg, i) => (
              msg.role === 'user' && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <MessageCircle size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.content}
                  </p>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
