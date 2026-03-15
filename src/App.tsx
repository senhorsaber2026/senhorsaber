import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ChatInterface } from './components/ChatInterface';
import { SimuladoScreen } from './components/SimuladoScreen';
import { FlashcardsScreen } from './components/FlashcardsScreen';
import { StudyPlanScreen } from './components/StudyPlanScreen';
import { PDFReader } from './components/PDFReader';
import { ProfileScreen } from './components/ProfileScreen';
import { AnatomyLab } from './components/AnatomyLab';
import { OraculoScreen } from './components/OraculoScreen';
import { PrevisaoScreen } from './components/PrevisaoScreen';
import { PaymentScreen } from './components/PaymentScreen';
import { AdminScreen } from './components/AdminScreen';
import { LoginScreen } from './components/LoginScreen';
import { SeminarScreen } from './modules/seminar/SeminarRoot';
import './index.css';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// Estudos tab has sub-navigation
const EstudosScreen: React.FC = () => {
  const { estudosSubTab, setEstudosSubTab } = useApp();

  const tabs = [
    { id: 'plano' as const, label: 'Plano' },
    { id: 'pdf' as const, label: 'PDF' },
    { id: 'flashcards' as const, label: 'Flashcards' },
  ];

  return (
    <div>
      <div style={{
        display: 'flex', gap: '0.25rem', padding: '0.75rem 1.25rem 0',
        borderBottom: '1px solid rgba(0,245,255,0.08)',
        background: 'rgba(2,13,31,0.5)', backdropFilter: 'blur(10px)',
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setEstudosSubTab(t.id)} style={{
            flex: 1, padding: '0.5rem 0.5rem', borderRadius: '8px 8px 0 0',
            border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: estudosSubTab === t.id ? 700 : 400,
            background: estudosSubTab === t.id ? 'rgba(0,245,255,0.08)' : 'transparent',
            color: estudosSubTab === t.id ? 'var(--holo-primary)' : 'var(--text-muted)',
            borderBottom: estudosSubTab === t.id ? '2px solid var(--holo-primary)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={estudosSubTab} variants={pageVariants} initial="initial" animate="animate" exit="exit">
          {estudosSubTab === 'plano' && <StudyPlanScreen />}
          {estudosSubTab === 'pdf' && <PDFReader />}
          {estudosSubTab === 'flashcards' && <FlashcardsScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeTab, userProfile } = useApp();

  if (!userProfile) {
    return <LoginScreen />;
  }

  if (userProfile.status === 'pending') {
    return <PaymentScreen />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 1000, margin: '0 auto' }}>
      {/* Page header for non-home tabs */}
      {activeTab !== 'home' && (
        <div style={{
          padding: '1rem 1.25rem 0.5rem',
          borderBottom: activeTab !== 'estudos' ? '1px solid rgba(0,245,255,0.08)' : 'none',
          background: 'rgba(1,9,21,0.8)', backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', color: 'var(--holo-primary)', letterSpacing: '0.05em' }}>
            {{
              perguntas: '💬 Perguntas',
              simulados: '🎯 Simulados',
              estudos: '📚 Estudos',
              laboratorio: '🔬 Laboratório 3D',
              perfil: '👤 Perfil',
              oraculo: '🔮 Oráculo dos Concursos',
              previsao: '🧠 IA Previsora',
              seminario: '📽️ Gerador de Seminário',
              admin: '🛡️ Painel Administrador',
            }[activeTab]}
          </h1>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {activeTab === 'home' && <HomeScreen />}
            {activeTab === 'perguntas' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
                <ChatInterface />
              </div>
            )}
            {activeTab === 'simulados' && <SimuladoScreen />}
            {activeTab === 'estudos' && <EstudosScreen />}
            {activeTab === 'laboratorio' && <AnatomyLab />}
            {activeTab === 'perfil' && <ProfileScreen />}
            {activeTab === 'oraculo' && <OraculoScreen />}
            {activeTab === 'previsao' && <PrevisaoScreen />}
            {activeTab === 'seminario' && <SeminarScreen />}
            {activeTab === 'admin' && <AdminScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
