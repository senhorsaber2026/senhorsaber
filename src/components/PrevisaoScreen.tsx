import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Crosshair, Target, Book, Sparkles, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const MATERIAS = ['Português', 'Direito Const.', 'Direito Adm.', 'Informática', 'Raciocínio Lógico', 'Específicos'];

export const PrevisaoScreen: React.FC = () => {
  const { setActiveTab } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMateria, setSelectedMateria] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isSynthesizing) {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsSynthesizing(false);
              setStep(3);
            }, 500);
            return 100;
          }
          return p + (Math.random() * 20);
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isSynthesizing]);

  const handleGenerate = () => {
    if (!selectedMateria) return;
    setStep(2);
    setIsSynthesizing(true);
    setProgress(0);
  };

  return (
    <div style={{ padding: '1.25rem', position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Background Glows */}
      <div style={{
        position: 'absolute', top: '10%', right: -30, width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: -30, width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)', pointerEvents: 'none'
      }} />

      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(168,85,247,0.2)' }}>
          <Brain size={24} color="#a855f7" />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', color: '#fff', margin: 0 }}>IA Previsora</h2>
          <p style={{ fontSize: '0.75rem', color: '#a855f7', margin: 0, opacity: 0.8 }}>Geração de Questões de Alta Taxa</p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(168,85,247,0.15)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                O algoritmo mapeia as tendências das bancas nos últimos 5 anos e formula questões idênticas às que cairão na sua prova.
              </p>

              <h3 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Book size={16} color="#a855f7" /> Disciplina Foco
              </h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {MATERIAS.map(m => (
                  <button key={m} onClick={() => setSelectedMateria(m)} style={{
                    padding: '0.5rem 0.8rem', borderRadius: '8px', border: `1px solid ${selectedMateria === m ? '#a855f7' : 'rgba(255,255,255,0.08)'}`,
                    background: selectedMateria === m ? 'rgba(168,85,247,0.15)' : 'rgba(0,0,0,0.2)',
                    color: selectedMateria === m ? '#fff' : 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: selectedMateria === m ? '0 0 10px rgba(168,85,247,0.2)' : 'none'
                  }}>
                    {m}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Qtd. de Questões</p>
                  <p style={{ fontSize: '1rem', color: '#fff', margin: 0, fontWeight: 600 }}>20 inéditas</p>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Dificuldade Base</p>
                  <p style={{ fontSize: '1rem', color: '#fff', margin: 0, fontWeight: 600 }}>Adaptativa</p>
                </div>
              </div>

            </div>

            <motion.button 
              whileTap={{ scale: 0.98 }} onClick={handleGenerate} disabled={!selectedMateria}
              style={{ padding: '1rem', borderRadius: '12px', border: 'none', background: !selectedMateria ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#000', fontSize: '0.9rem', fontWeight: 600, marginTop: 'auto', position: 'relative', overflow: 'hidden', cursor: !selectedMateria ? 'not-allowed' : 'pointer', boxShadow: selectedMateria ? '0 8px 25px rgba(168,85,247,0.3)' : 'none' }}
            >
              {selectedMateria && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #a855f7, #c084fc)', zIndex: 0 }} />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: !selectedMateria ? 'var(--text-muted)' : '#000' }}>
                <Sparkles size={18} /> Sintetizar Simulado
              </span>
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 100, height: 100, marginBottom: '2rem', position: 'relative' }}>
               <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={60} color="#a855f7" />
               </motion.div>
            </div>
            
            <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Engenharia Reversa</h3>
            <p style={{ color: '#c084fc', fontSize: '0.8rem', textAlign: 'center', maxWidth: '80%', marginBottom: '1.5rem', opacity: 0.8 }}>
              {progress < 40 ? `Inspecionando armadilhas de ${selectedMateria}...` : progress < 70 ? 'Extrapolando nível de dificuldade...' : 'Formulando questões inéditas e comentadas...'}
            </p>

            <div style={{ width: '80%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', background: '#a855f7', boxShadow: '0 0 10px #a855f7' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Modelando Padrões... {Math.floor(progress)}%</p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'linear-gradient(145deg, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(168,85,247,0.3)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: 40, height: 40, borderRadius: '20px', background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Target size={20} color="#c084fc" />
              </div>
              <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: '0 0 0.25rem' }}>Bateria Pronta</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>20 Questões • Padrão Altíssima Probabilidade</p>
            </div>

            <div className="glass-card" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={14} color="#f59e0b" /> Detecção de Padões
              </h3>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', marginTop: '0.3rem' }} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#fff', margin: '0 0 0.15rem' }}>Pegadinha Frequente Detectada</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>Troca de conceitos na literalidade da lei.</p>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', marginTop: '0.3rem' }} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#fff', margin: '0 0 0.15rem' }}>Jurisprudência em Alta</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>Inclusão de decisões recentes do STF.</p>
                  </div>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => setActiveTab('simulados')}
              style={{ padding: '1rem', borderRadius: '12px', border: 'none', background: '#a855f7', color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(168,85,247,0.3)', cursor: 'pointer' }}
            >
              <Crosshair size={18} /> Iniciar Bateria de Ouro
            </button>
            <button onClick={() => setStep(1)} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>
              Configurar Outra Bateria
            </button>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
