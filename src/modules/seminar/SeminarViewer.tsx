import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileDown, Presentation as PptIcon, X } from 'lucide-react';
import type { Presentation } from './SeminarTypes';

interface Props {
  presentation: Presentation | null;
  currentSlide: number;
  setCurrentSlide: React.Dispatch<React.SetStateAction<number>>;
  onPDF: () => void;
  onPPTX: () => void;
  onReset: () => void;
}

export const SeminarViewer: React.FC<Props> = ({ presentation, currentSlide, setCurrentSlide, onPDF, onPPTX, onReset }) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'visualizar' | 'codigo' | 'pensando'>('visualizar');
  const current = presentation?.slides[currentSlide];
  const total = presentation?.slides.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', height: 'calc(100vh - 120px)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: 'rgba(2,13,31,0.8)', borderRadius: '12px', border: '1px solid rgba(0,245,255,0.1)' }}>
        <h2 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{presentation?.title}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onPDF} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}><FileDown size={14} /> PDF</button>
          <button onClick={onPPTX} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}><PptIcon size={14} /> PPTX</button>
          <button onClick={onReset} className="btn-secondary" style={{ padding: '0.4rem' }}><X size={16} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Left Panel: Content / Editor Style */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(2,13,31,0.4)', padding: 0 }}>
          <div style={{ display: 'flex', padding: '0.75rem', borderBottom: '1px solid rgba(0,245,255,0.05)', gap: '1.5rem' }}>
            {(['visualizar', 'codigo', 'pensando'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveSubTab(tab)}
                style={{ 
                  background: 'none', border: 'none', color: activeSubTab === tab ? 'var(--holo-primary)' : '#666', 
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                  borderBottom: activeSubTab === tab ? '2px solid var(--holo-primary)' : '2px solid transparent',
                  paddingBottom: '0.25rem'
                }}
              >
                {tab === 'visualizar' ? 'Visualizar' : tab === 'codigo' ? 'Código' : 'Pensando'}
              </button>
            ))}
          </div>
          
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {activeSubTab === 'visualizar' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h4 style={{ color: 'var(--holo-primary)', marginBottom: '1rem' }}>{current?.title}</h4>
                {current?.bullets ? (
                  <ul style={{ paddingLeft: '1.2rem' }}>
                    {current.bullets.map((b, i) => <li key={i} style={{ marginBottom: '0.75rem' }}>- {b}</li>)}
                  </ul>
                ) : <p>{current?.content}</p>}
                
                {current?.script && (
                  <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--holo-primary)' }}>
                    <p style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem', fontWeight: 800 }}>SUGESTÃO DE ROTEIRO</p>
                    <p style={{ fontSize: '0.85rem' }}>{current.script}</p>
                  </div>
                )}
              </motion.div>
            )}
            
            {activeSubTab === 'codigo' && (
              <pre style={{ fontSize: '0.75rem', color: '#10b981', fontFamily: 'monospace' }}>
                {JSON.stringify(current, null, 2)}
              </pre>
            )}

            {activeSubTab === 'pensando' && (
              <div style={{ fontStyle: 'italic', color: '#888' }}>
                <p>O Senhor Saber pensou nos seguintes pontos para este slide:</p>
                <ul style={{ marginTop: '0.5rem' }}>
                  <li>Analisando relevância do tópico...</li>
                  <li>Buscando referências visuais para "{current?.imageQuery}"...</li>
                  <li>Estruturando didática para melhor compreensão.</li>
                </ul>
              </div>
            )}
          </div>

          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setCurrentSlide(s => Math.max(0, s-1))} disabled={currentSlide === 0}><ChevronLeft size={18} /></button>
              <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setCurrentSlide(s => Math.min(total - 1, s + 1))} disabled={currentSlide === total - 1}><ChevronRight size={18} /></button>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>{currentSlide + 1} / {total}</span>
          </div>
        </div>

        {/* Right Panel: Slide Preview */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.div 
            id="slide-export-container"
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            style={{ 
              width: '100%', aspectRatio: '16/9', background: '#020d1f', borderRadius: '16px', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(0,245,255,0.2)',
              position: 'relative', overflow: 'hidden', display: 'flex', padding: '2rem', gap: '1.5rem'
            }}
          >
            {/* Background Accent */}
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0,245,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
              <h3 style={{ 
                color: 'var(--holo-primary)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem',
                textShadow: '0 0 15px rgba(0,245,255,0.3)'
              }}>
                {current?.title}
              </h3>
              
              <div style={{ color: '#fff', fontSize: '1rem', lineHeight: '1.6' }}>
                {current?.bullets ? (
                  <ul style={{ paddingLeft: '1.5rem', listStyleType: 'square' }}>
                    {current.bullets.map((b, i) => <li key={i} style={{ marginBottom: '0.8rem', color: '#e2e8f0' }}>{b}</li>)}
                  </ul>
                ) : <p>{current?.content}</p>}
              </div>
            </div>

            {current?.imageQuery && (
              <div style={{ flex: 0.8, position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden',
                  border: '1px solid rgba(0,245,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}>
                  <img 
                    src={`https://loremflickr.com/800/600/${encodeURIComponent(current.imageQuery.split(',')[0].split(' ')[0] || 'education')}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    crossOrigin="anonymous" 
                    alt="Slide visual"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1454165833767-1330084bc6f9?w=800'; }}
                  />
                </div>
              </div>
            )}
            
            {/* Footer numbering on slide */}
            <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', color: '#444', fontSize: '0.7rem', fontWeight: 700 }}>
              {currentSlide + 1}
            </div>
          </motion.div>

          <div className="glass-card" style={{ padding: '1rem', background: 'rgba(2,13,31,0.2)', border: '1px dashed rgba(0,245,255,0.1)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#666' }}>
              💡 Dica: Use as setas para navegar. Você pode editar o texto no painel à esquerda (em breve).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
