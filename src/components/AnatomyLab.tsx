import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, MousePointer2, RotateCw, Zap, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOrganExplanation } from '../services/aiService';
import confetti from 'canvas-confetti';

import { senhorSaberSpeak } from '../services/ttsService';

// --- Types ---
interface OrganData {
  id: string;
  name: string;
  system: string;
  top: number;   // % from top
  left: number;  // % from left
  color: string;
}

const initialOrgans: OrganData[] = [
  { id: '1', name: 'Cérebro', system: 'Sistema Nervoso', top: 5, left: 50, color: '#a855f7' },
  { id: '2', name: 'Coração', system: 'Sistema Circulatório', top: 22, left: 45, color: '#ef4444' },
  { id: '3', name: 'Pulmões', system: 'Sistema Respiratório', top: 21, left: 51, color: '#c084fc' },
  { id: '4', name: 'Fígado', system: 'Sistema Digestório', top: 28, left: 42, color: '#f97316' },
  { id: '5', name: 'Estômago', system: 'Sistema Digestório', top: 30, left: 52, color: '#fbbf24' },
  { id: '6', name: 'Intestino Delgado', system: 'Sistema Digestório', top: 38, left: 50, color: '#ec4899' },
  { id: '7', name: 'Intestino Grosso', system: 'Sistema Digestório', top: 35, left: 41, color: '#d946ef' },
  { id: '8', name: 'Rins', system: 'Sistema Urinário', top: 43, left: 43.5, color: '#10b981' },
];

const systems = [
  { id: 'Sistema Nervoso', color: '#a855f7', label: 'Nervoso' },
  { id: 'Sistema Circulatório', color: '#ef4444', label: 'Circulatório' },
  { id: 'Sistema Respiratório', color: '#c084fc', label: 'Respiratório' },
  { id: 'Sistema Digestório', color: '#fbbf24', label: 'Digestório' },
  { id: 'Sistema Urinário', color: '#10b981', label: 'Urinário' },
  { id: 'Esquelético', color: '#ffffff', label: 'Esquelético' },
  { id: 'Muscular', color: '#7f1d1d', label: 'Muscular' }
];

// --- Main Component ---
export const AnatomyLab: React.FC = () => {
  const { apiKey, aiProvider, customBaseUrl, customModelId } = useApp();
  
  const [organs, setOrgans] = useState<OrganData[]>(initialOrgans);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  
  const [loadingAI, setLoadingAI] = useState(false);
  const [organInfo, setOrganInfo] = useState<{ id: string; name: string; function: string; ai_comment: string } | null>(null);
  
  const [quizMode, setQuizMode] = useState(false);
  const [quizTarget, setQuizTarget] = useState<OrganData | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  // Debug Mod
  const [debugMode, setDebugMode] = useState(false);
  const [selectedOrganId, setSelectedOrganId] = useState<string | null>(null);

  const handleOrganClick = async (organ: OrganData) => {
    if (debugMode) {
      setSelectedOrganId(organ.id);
      return;
    }

    if (quizMode && quizTarget) {
      if (organ.id === quizTarget.id) {
        setQuizFeedback({ correct: true, message: `Excelente! Este é exatamente o ${organ.name}.` });
        confetti({ particleCount: 50, spread: 60, colors: ['#00f5ff', '#a855f7'] });
        
        senhorSaberSpeak("Excelente! Você identificou corretamente.");
        
        setTimeout(() => startNewQuiz(), 2000);
      } else {
        setQuizFeedback({ correct: false, message: `Não, este é o ${organ.name}. Tente encontrar o ${quizTarget.name}!` });
      }
      return;
    }

    setLoadingAI(true);
    setOrganInfo(null);
    try {
      const config = { apiKey, provider: aiProvider, baseUrl: customBaseUrl, modelId: customModelId };
      const info = await getOrganExplanation(config, organ.name, organ.system);
      setOrganInfo({ id: organ.id, ...info });

      senhorSaberSpeak(`Senhor Saber explica: o ${info.name} é parte do ${organ.system}. ${info.function}. ${info.ai_comment}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  };

  const startNewQuiz = () => {
    const target = organs[Math.floor(Math.random() * organs.length)];
    setQuizTarget(target);
    setQuizFeedback(null);
    setOrganInfo(null);
    setSelectedSystem(null);
  };

  const toggleQuiz = () => {
    if (!quizMode) {
      startNewQuiz();
    } else {
      setQuizTarget(null);
      setQuizFeedback(null);
    }
    setQuizMode(!quizMode);
    setDebugMode(false);
  };

  const updateOrganPosition = (id: string, axis: 'top' | 'left', value: number) => {
    setOrgans(prev => prev.map(o => o.id === id ? { ...o, [axis]: value } : o));
  };
  
  const getOutputConfig = () => {
    console.log(JSON.stringify(organs, null, 2));
    alert("Coordenadas enviadas para o console. Fale para a IA os números ajustados se quiser salvar para sempre.");
  };

  const activeOrgan = organs.find(o => o.id === selectedOrganId);

  return (
    <div style={{ height: 'calc(100vh - 70px)', background: '#020d1f', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* Background futurista / Scanlines */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00f5ff 3px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none', background: 'radial-gradient(circle at center, #00f5ff33 0%, transparent 80%)', zIndex: 0 }} />

      {/* 2D Interactive Area */}
      <div style={{ position: 'relative', height: '90%', display: 'inline-block', zIndex: 10 }}>
        {/* The Human Image */}
        <img 
          src="/anatomia_humana_completa.jpg" 
          alt="Anatomia Humana" 
          style={{ height: '100%', width: 'auto', borderRadius: '20px', objectFit: 'contain', boxShadow: '0 0 30px rgba(0,245,255,0.1)' }}
        />

        {/* Hotspots */}
        {organs.map(organ => {
          const isVisible = !selectedSystem || organ.system === selectedSystem;
          const isActive = organInfo?.id === organ.id || selectedOrganId === organ.id;
          
          if (!isVisible && !debugMode) return null;

          return (
            <motion.div
              key={organ.id}
              onClick={() => handleOrganClick(organ)}
              whileHover={{ scale: 1.2 }}
              style={{
                position: 'absolute',
                top: `${organ.top}%`,
                left: `${organ.left}%`,
                width: 'clamp(15px, 3vh, 30px)',
                height: 'clamp(15px, 3vh, 30px)',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: isActive ? '#00f5ff' : `${organ.color}99`,
                border: `2px solid ${isActive ? '#fff' : organ.color}`,
                boxShadow: isActive ? '0 0 15px #00f5ff' : 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: isActive ? 50 : 20
              }}
            >
              {isActive && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #00f5ff' }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* HUD - Superior */}
      <div style={{ 
        position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', flexDirection: 'column', pointerEvents: 'none', zIndex: 20,
        background: 'rgba(2,13,31,0.85)', backdropFilter: 'blur(8px)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,245,255,0.2)'
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--holo-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>
            <Beaker size={24} /> LAB DE ANATOMIA 2D
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>MÓDULO DE ESCANEAMENTO</p>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={toggleQuiz} style={{
              padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, pointerEvents: 'auto',
              background: quizMode ? '#ef4444' : 'rgba(0,245,255,0.1)',
              border: `1px solid ${quizMode ? '#ef4444' : 'var(--holo-primary)'}`,
              color: quizMode ? '#fff' : 'var(--holo-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <Zap size={12} /> {quizMode ? 'SAIR DO QUIZ' : 'MODO QUIZ'}
            </button>
            <button onClick={() => { setDebugMode(!debugMode); setQuizMode(false); }} style={{
              padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, pointerEvents: 'auto',
              background: debugMode ? '#eab308' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${debugMode ? '#eab308' : 'rgba(255,255,255,0.2)'}`,
              color: debugMode ? '#000' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <SlidersHorizontal size={12} /> AJUSTAR POSIÇÕES
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Sistemas */}
      <div style={{ position: 'absolute', top: '50%', left: '1.5rem', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 20 }}>
        {systems.map(s => (
          <button key={s.id} onClick={() => setSelectedSystem(selectedSystem === s.id ? null : s.id)} style={{
            background: selectedSystem === s.id ? s.color : 'rgba(2,13,31,0.6)',
            border: `1px solid ${selectedSystem === s.id ? s.color : 'rgba(0,245,255,0.2)'}`,
            padding: '0.6rem', borderRadius: '12px', color: selectedSystem === s.id ? (s.id === 'Esquelético' ? '#000' : '#fff') : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.3s',
            writingMode: 'vertical-lr', textOrientation: 'mixed', fontSize: '0.65rem', fontWeight: 700,
            boxShadow: selectedSystem === s.id ? `0 0 15px ${s.color}66` : 'none'
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Debug Panel */}
      {debugMode && activeOrgan && (
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(2,13,31,0.9)', padding: '1rem', borderRadius: '12px', border: '1px solid #eab308', width: '250px', zIndex: 30, color: 'white' }}>
          <h4 style={{ color: '#eab308', fontSize: '14px', margin: '0 0 10px 0' }}>Ajustando: {activeOrgan.name}</h4>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
            Topo (Y): {activeOrgan.top}%
            <input type="range" min="0" max="100" step="0.5" value={activeOrgan.top} onChange={e => updateOrganPosition(activeOrgan.id, 'top', parseFloat(e.target.value))} style={{ width: '100%' }} />
          </label>
          <label style={{ display: 'block', marginBottom: '16px', fontSize: '12px' }}>
            Esquerda (X): {activeOrgan.left}%
            <input type="range" min="0" max="100" step="0.5" value={activeOrgan.left} onChange={e => updateOrganPosition(activeOrgan.id, 'left', parseFloat(e.target.value))} style={{ width: '100%' }} />
          </label>
          <button onClick={getOutputConfig} style={{ width: '100%', padding: '0.5rem', background: '#00f5ff', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>CONCLUIR AJUSTES</button>
        </div>
      )}

      {/* Quiz Target HUD */}
      {!organInfo && !loadingAI && quizMode && quizTarget && (
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(2,13,31,0.9)', border: '1px solid var(--holo-primary)', borderRadius: '12px', padding: '1rem', textAlign: 'center', minWidth: 200, boxShadow: '0 0 20px rgba(0,245,255,0.2)', zIndex: 30 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>ENCONTRE O ÓRGÃO:</p>
          <h4 style={{ color: 'var(--holo-primary)', fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem' }}>{quizTarget.name}</h4>
          {quizFeedback && (
            <p style={{ color: quizFeedback.correct ? '#10b981' : '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}>
              {quizFeedback.message}
            </p>
          )}
        </div>
      )}

      {/* Info Card / AI Response */}
      <AnimatePresence>
        {(organInfo || loadingAI) && !debugMode && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
            style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', background: 'rgba(2,13,31,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '16px', padding: '1.25rem', zIndex: 40 }}>
            
            {loadingAI ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <RotateCw style={{ color: 'var(--holo-primary)' }} />
                </motion.div>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Senhor Saber está analisando a estrutura...</p>
              </div>
            ) : organInfo && (
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem' }}>
                <div style={{ 
                  width: 70, height: 70, background: 'rgba(0,245,255,0.05)', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  border: '1px solid var(--holo-primary)', boxShadow: '0 0 15px rgba(0,245,255,0.3)',
                  overflow: 'hidden', position: 'relative'
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, transparent, rgba(0,245,255,0.2), transparent)' }} />
                  <img src="/senhor-saber.jpg" alt="Senhor Saber" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', position: 'relative', zIndex: 1 }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--holo-primary)', fontSize: '1rem' }}>{organInfo.name}</h3>
                    <div className="tag" style={{ background: 'rgba(0,245,255,0.1)', color: 'var(--holo-primary)', fontSize: '0.6rem' }}>ESTRUTURA IDENTIFICADA</div>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 500 }}>{organInfo.function}</p>
                  <div style={{ background: 'rgba(168,85,247,0.1)', borderLeft: '3px solid var(--holo-secondary)', padding: '0.75rem', borderRadius: '4px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>"{organInfo.ai_comment}"</p>
                  </div>
                </div>
                <button onClick={() => setOrganInfo(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text */}
      {!organInfo && !loadingAI && !quizMode && !debugMode && (
        <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '20px', pointerEvents: 'none', zIndex: 10 }}>
          <MousePointer2 size={14} style={{ color: 'var(--holo-primary)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Clique nos botões brilhantes para analisar a imagem</span>
        </div>
      )}
    </div>
  );
};
