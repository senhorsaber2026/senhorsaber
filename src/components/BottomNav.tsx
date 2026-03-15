import React from 'react';
import { motion } from 'framer-motion';
import { Home, MessageCircle, ClipboardList, BookOpen, User, Activity, Presentation, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { TabId } from '../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, userProfile } = useApp();

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <Home size={20} /> },
    { id: 'perguntas', label: 'Perguntas', icon: <MessageCircle size={20} /> },
    { id: 'simulados', label: 'Simulados', icon: <ClipboardList size={20} /> },
    { id: 'estudos', label: 'Estudos', icon: <BookOpen size={20} /> },
    { id: 'laboratorio', label: 'Laboratório', icon: <Activity size={20} /> },
    { id: 'seminario', label: 'Seminário', icon: <Presentation size={20} /> },
    { id: 'perfil', label: 'Perfil', icon: <User size={20} /> },
  ];

  if (userProfile?.isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: <ShieldCheck size={20} /> });
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: 'rgba(2, 13, 31, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0,245,255,0.15)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '0.5rem 0',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '0.4rem 1rem',
              borderRadius: '12px',
              position: 'relative',
              color: isActive ? 'var(--holo-primary)' : 'var(--text-muted)',
              transition: 'color 0.2s ease',
            }}
            whileTap={{ scale: 0.9 }}
          >
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '12px',
                  background: 'rgba(0,245,255,0.08)',
                  border: '1px solid rgba(0,245,255,0.2)',
                }}
                transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{tab.icon}</span>
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              position: 'relative',
              zIndex: 1,
            }}>
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
};
