import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, UploadCloud, Target, BookOpen, BarChart2, Zap, CheckCircle, ChevronRight, Database, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { predictContestPatterns } from '../services/aiService';
import type { OraclePrediction } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const BANCAS = ['CESPE / CEBRASPE', 'FGV', 'VUNESP', 'FCC', 'AOCP', 'IBFC', 'IDECAN'];

export const OraculoScreen: React.FC = () => {
  const { apiKey, aiProvider, customBaseUrl, customModelId, setActiveTab, setStudySubjects } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBanca, setSelectedBanca] = useState<string>('');
  const [cargo, setCargo] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [prediction, setPrediction] = useState<OraclePrediction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 15);
    
    for (let i = 1; i <= maxPages; i++) {
        setProgress((i / maxPages) * 100);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleAnalyze = async () => {
    if (!selectedBanca || !cargo || !uploadedFile) return;
    
    setStep(2);
    setProgress(0);

    try {
      const pdfText = await extractTextFromPDF(uploadedFile);
      setProgress(100);
      
      const aiConfig = { apiKey, provider: aiProvider, baseUrl: customBaseUrl, modelId: customModelId };
      const res = await predictContestPatterns(aiConfig, pdfText, selectedBanca, cargo);
      setPrediction(res);
      
      // Sincroniza com o Plano de Estudos
      const newSubjects = res.probabilities.map((item, idx) => ({
        id: `subject-${Date.now()}-${idx}`,
        name: item.label,
        progress: 0,
        icon: '📚',
        color: item.color
      }));
      setStudySubjects(newSubjects);
      
      setStep(3);
    } catch (error) {
      console.error('Erro na análise:', error);
      alert('Erro ao analisar o edital. Verifique sua chave API.');
      setStep(1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ padding: '1.25rem', position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Background Glows */}
      <div style={{
        position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,245,255,0.05) 0%, transparent 70%)', pointerEvents: 'none'
      }} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(0,245,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,245,255,0.2)' }}>
          <Eye size={24} color="#00f5ff" />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', color: '#fff', margin: 0 }}>Oráculo dos Concursos</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--holo-primary)', margin: 0, opacity: 0.8 }}>Previsão de Padrões e Estatísticas</p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(0,245,255,0.15)' }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UploadCloud size={16} /> Enviar Edital (PDF)
              </h3>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{ border: '1px dashed rgba(0,245,255,0.3)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: 'rgba(0,245,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', ...(uploadedFile ? { borderColor: '#00f5ff', background: 'rgba(0,245,255,0.05)' } : {}) }}
              >
                <input 
                  type="file" 
                  accept=".pdf" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                <FileText size={32} color="rgba(0,245,255,0.5)" style={{ margin: '0 auto 0.5rem' }} />
                {uploadedFile ? (
                  <>
                    <p style={{ fontSize: '0.8rem', color: '#00f5ff', margin: 0, fontWeight: 600 }}>{uploadedFile.name}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Edital carregado com sucesso</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0 }}>Toque para buscar o edital</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Extração automática de disciplinas</p>
                  </>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(0,245,255,0.15)' }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={16} /> Configurar Alvo
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Banca Examinadora</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {BANCAS.map(b => (
                    <button key={b} onClick={() => setSelectedBanca(b)} style={{
                      padding: '0.4rem 0.8rem', borderRadius: '8px', border: `1px solid ${selectedBanca === b ? '#00f5ff' : 'rgba(255,255,255,0.1)'}`,
                      background: selectedBanca === b ? 'rgba(0,245,255,0.15)' : 'rgba(255,255,255,0.03)',
                      color: selectedBanca === b ? '#fff' : 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Cargo (ex: Agente de Polícia)</label>
                <input 
                  type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Digite o cargo..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(0,245,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.98 }} onClick={handleAnalyze} disabled={!selectedBanca || !cargo || !uploadedFile}
              style={{ padding: '1rem', borderRadius: '12px', border: 'none', background: (!selectedBanca || !cargo || !uploadedFile) ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#000', fontSize: '0.9rem', fontWeight: 600, marginTop: 'auto', position: 'relative', overflow: 'hidden', cursor: (!selectedBanca || !cargo || !uploadedFile) ? 'not-allowed' : 'pointer' }}
            >
              {selectedBanca && cargo && uploadedFile && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #00f5ff, #0088ff)', zIndex: 0 }} />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: (!selectedBanca || !cargo || !uploadedFile) ? 'var(--text-muted)' : '#000' }}>
                <Zap size={18} /> Iniciar Clarividência IA
              </span>
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
              <motion.div 
                animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed rgba(0,245,255,0.5)', borderTopColor: '#00f5ff' }}
              />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,245,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0,245,255,0.4)' }}
              >
                <Eye size={30} color="#00f5ff" />
              </motion.div>
            </div>
            
            <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Analisando Histórico</h3>
            <p style={{ color: 'var(--holo-primary)', fontSize: '0.8rem', textAlign: 'center', maxWidth: '80%', marginBottom: '1.5rem', opacity: 0.8 }}>
              {progress < 40 ? 'Extraindo conteúdo do edital...' : progress < 80 ? `Cruzando dados com milhares de provas da banca ${selectedBanca}...` : 'Calculando probabilidade matemática de incidência...'}
            </p>

            <div style={{ width: '80%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', background: '#00f5ff', boxShadow: '0 0 10px #00f5ff' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{Math.floor(progress)}% Concluído</p>
          </motion.div>
        )}

        {step === 3 && prediction && (
          <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,245,255,0.05)', borderColor: 'rgba(0,245,255,0.2)' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--holo-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Previsão de Acerto</p>
                <h3 style={{ color: '#fff', fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{prediction.score}% <CheckCircle size={16} color="#00f5ff"/></h3>
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Padrão da Banca</p>
                <h3 style={{ color: '#fff', fontSize: '0.9rem', margin: 0, lineHeight: 1.2 }}>{prediction.pattern}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <BarChart2 size={16} color="#00f5ff" /> Probabilidade de Cobrança
                </h3>
              </div>

              {prediction.probabilities.map((item, i) => (
                <div key={i} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 700 }}>{item.prob}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.prob}%` }} transition={{ duration: 1, delay: i * 0.1 }} style={{ height: '100%', background: item.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
              <button 
                className="glass-card" 
                onClick={() => setActiveTab('estudos')}
                style={{ padding: '1rem', border: '1px solid rgba(0,245,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer', background: 'rgba(0,245,255,0.05)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(0,245,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={18} color="#00f5ff" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', margin: 0 }}>Gerar Plano de Estudos</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>Focado nos tópicos quentes</p>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </button>

              <button 
                className="glass-card" 
                onClick={() => setActiveTab('simulados')}
                style={{ padding: '1rem', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer', background: 'rgba(168,85,247,0.05)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={18} color="#a855f7" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', margin: 0 }}>Simulador Inteligente</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>Treine o padrão exato da banca</p>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </button>
            </div>

            <button 
              onClick={() => {
                setStep(1);
                setProgress(0);
                setUploadedFile(null);
                setPrediction(null);
              }} 
              style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', marginTop: 'auto' }}
            >
              Fazer nova análise
            </button>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
