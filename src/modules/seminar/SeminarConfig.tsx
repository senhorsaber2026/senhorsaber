import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Wand2 } from 'lucide-react';
import type { SeminarMode } from './SeminarTypes';

interface Props {
  pdfFile: File | null;
  setPdfFile: (f: File | null) => void;
  mode: SeminarMode;
  setMode: (m: SeminarMode) => void;
  pageRange: string;
  setPageRange: (s: string) => void;
  topic: string;
  setTopic: (s: string) => void;
  onGenerate: () => void;
  error: string;
}

const modeLabels: Record<SeminarMode, string> = {
  por_pagina: 'Páginas',
  por_topico: 'Tópicos',
  resumo_inteligente: 'IA Resumo'
};

export const SeminarConfig: React.FC<Props> = ({ 
  pdfFile, setPdfFile, mode, setMode, 
  pageRange, setPageRange, topic, setTopic, 
  onGenerate, error 
}) => {
  const fRef = useRef<HTMLInputElement>(null);
  
  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--holo-primary)', fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            📽️ Seminário AI
          </h2>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>Transforme PDFs em apresentações de elite</p>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem', cursor: 'pointer', border: '1px dashed var(--holo-primary)', background: 'rgba(0,245,255,0.03)' }} onClick={() => fRef.current?.click()}>
          <input type="file" ref={fRef} onChange={(e) => e.target.files?.[0] && setPdfFile(e.target.files[0])} style={{ display: 'none' }} accept=".pdf" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <FileText size={48} color={pdfFile ? 'var(--holo-primary)' : '#444'} />
            <p style={{ fontSize: '0.9rem', color: pdfFile ? '#fff' : '#666', textAlign: 'center', fontWeight: 500 }}>
              {pdfFile ? pdfFile.name : 'Selecionar Documento PDF'}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.75rem', textAlign: 'center' }}>MODO DE GERAÇÃO</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(['por_pagina', 'por_topico', 'resumo_inteligente'] as SeminarMode[]).map(m => (
              <button 
                key={m} onClick={() => setMode(m)} 
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.75rem 0.25rem', borderRadius: '12px' }} 
                className={mode === m ? 'btn-primary' : 'btn-secondary'}
              >
                {modeLabels[m]}
              </button>
            ))}
          </div>
        </div>

        {mode === 'por_pagina' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>INTERVALO DE PÁGINAS (EX: 1-5)</p>
            <input 
              type="text" 
              value={pageRange} 
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="Ex: 1-5 ou 10"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,245,255,0.2)', padding: '0.8rem', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
            />
          </motion.div>
        )}

        {mode === 'por_topico' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>TÓPICO ESPECÍFICO</p>
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Sobre o que deve ser o seminário?"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,245,255,0.2)', padding: '0.8rem', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
            />
          </motion.div>
        )}

        <button className="btn-primary" onClick={onGenerate} style={{ width: '100%', padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Wand2 size={18} /> GERAR SEMINÁRIO
        </button>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>
            ⚠️ {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};
