import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Timer, ChevronRight, RefreshCw, CheckCircle, XCircle,
  Lightbulb, BarChart2, AlertCircle, Plus, ChevronDown, Award, Zap,
  FileText, UploadCloud, Database, Hash, Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateQuestions, generateQuestionsFromPDF } from '../services/aiService';
import type { QuizQuestion } from '../types';
import confetti from 'canvas-confetti';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

type Phase = 'config' | 'playing' | 'result';

const SUBJECTS = ['Matemática', 'Português', 'Direito Constitucional', 'Direito Administrativo', 'Raciocínio Lógico', 'Informática', 'História', 'Geografia', 'Inglês', 'Biologia'];

const INITIAL_BANKS = ['FGV', 'CESPE / CEBRASPE', 'VUNESP', 'FCC', 'ESAF', 'Geral'];

const DIFFICULTIES = [
  { key: 'Fácil', label: 'Fácil', color: '#10b981' },
  { key: 'Média', label: 'Médio', color: '#f59e0b' },
  { key: 'Difícil', label: 'Difícil', color: '#ef4444' },
];

export const SimuladoScreen: React.FC = () => {
  const { apiKey, aiProvider, customBaseUrl, customModelId } = useApp();
  const [phase, setPhase] = useState<Phase>('config');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [difficulty, setDifficulty] = useState('Média');
  const [questionCount, setQuestionCount] = useState(5);
  const [bank, setBank] = useState('Geral');
  const [banks, setBanks] = useState(INITIAL_BANKS);
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState('');
  const [smartMode, setSmartMode] = useState(false);
  const [source, setSource] = useState<'subject' | 'pdf'>('subject');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfFilter, setPdfFilter] = useState<'all' | 'pages' | 'topic'>('all');
  const [pageRange, setPageRange] = useState('');
  const [targetTopic, setTargetTopic] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ q: string; selected: string; correct: string; correct_bool: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    let pagesToExtract: number[] = [];
    if (pdfFilter === 'pages' && pageRange) {
      const parts = pageRange.split('-').map(p => parseInt(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        for (let i = Math.max(1, parts[0]); i <= Math.min(pdf.numPages, parts[1]); i++) {
          pagesToExtract.push(i);
        }
      } else if (parts.length === 1 && !isNaN(parts[0])) {
        pagesToExtract.push(parts[0]);
      }
    }

    if (pagesToExtract.length === 0) {
      const maxPages = Math.min(pdf.numPages, 15);
      for (let i = 1; i <= maxPages; i++) pagesToExtract.push(i);
    }

    for (const pageNum of pagesToExtract) {
        if (pageNum > pdf.numPages) continue;
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
  };

  useEffect(() => {
    if (phase === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            finishSimulado();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current!);
  }, [phase, questions]);

  const startSimulado = async () => {
    setLoading(true);
    setError('');
    try {
      if (!apiKey) {
        setError('Por favor, configure sua chave API no Perfil.');
        setLoading(false);
        return;
      }
      const aiConfig = { apiKey, provider: aiProvider, baseUrl: customBaseUrl, modelId: customModelId };
      
      let qs: QuizQuestion[] = [];
      if (source === 'pdf') {
        if (!uploadedFile) {
          setError('Por favor, selecione um arquivo PDF.');
          setLoading(false);
          return;
        }
        setIsExtracting(true);
        const pdfText = await extractTextFromPDF(uploadedFile);
        setIsExtracting(false);
        const displaySubject = pdfFilter === 'topic' && targetTopic ? targetTopic : (uploadedFile?.name.replace(/\.[^/.]+$/, "") || 'Conteúdo do PDF');
        setSubject(displaySubject);
        qs = await generateQuestionsFromPDF(aiConfig, pdfText, questionCount, difficulty, bank, pdfFilter === 'topic' ? targetTopic : undefined);
      } else {
        qs = await generateQuestions(aiConfig, subject, questionCount, difficulty, bank, smartMode);
      }

      setQuestions(qs);
      setCurrentIdx(0);
      setScore(0);
      setAnswers([]);
      setTimeLeft(questionCount * 60);
      setPhase('playing');
    } catch (e: any) {
      setError(e.message || 'Erro ao gerar questões. Verifique sua conexão.');
    } finally {
      setLoading(false);
      setIsExtracting(false);
    }
  };

  const handleSelect = (key: string) => {
    if (answered) return;
    setSelected(key);
    setAnswered(true);
    const q = questions[currentIdx];
    const isCorrect = key === q.correct_answer;
    if (isCorrect) setScore(s => s + 1);
    setAnswers(prev => [...prev, { q: q.question, selected: key, correct: q.correct_answer, correct_bool: isCorrect }]);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      finishSimulado();
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setAnswered(false);
      setShowExplanation(false);
    }
  };

  const finishSimulado = () => {
    clearInterval(timerRef.current!);
    setPhase('result');
    const pct = (score / questions.length) * 100;
    if (pct >= 70) {
      confetti({ particleCount: 120, spread: 80, colors: ['#00f5ff', '#a855f7', '#10b981'] });
    }
  };

  const addCustomBank = () => {
    if (newBank.trim() && !banks.includes(newBank.trim())) {
      setBanks([...banks, newBank.trim()]);
      setBank(newBank.trim());
      setNewBank('');
      setShowAddBank(false);
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const current = questions[currentIdx];
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  if (phase === 'config') return (
    <div style={{ padding: '1.5rem', maxWidth: 500, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', color: 'var(--holo-primary)', marginBottom: '0.25rem' }}>
          🎯 Gerador de Simulados
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Prepare-se com questões de bancas reais</p>

        {/* Smart Mode Toggle */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem', border: smartMode ? '1.5px solid var(--holo-primary)' : '1px solid rgba(255,255,255,0.08)', background: smartMode ? 'rgba(0,245,255,0.05)' : 'rgba(255,255,255,0.02)', transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.6rem', background: smartMode ? 'var(--holo-primary)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', color: smartMode ? '#000' : 'var(--text-muted)', transition: 'all 0.3s' }}>
                <Zap size={20} />
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: smartMode ? 'var(--holo-primary)' : 'var(--text-primary)' }}>Estudo Inteligente</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Foca nos temas mais cobrados em provas</p>
              </div>
            </div>
            <button onClick={() => setSmartMode(!smartMode)} style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: smartMode ? 'var(--holo-primary)' : 'rgba(255,255,255,0.2)',
              position: 'relative', transition: 'all 0.3s'
            }}>
              <motion.div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3 }}
                animate={{ left: smartMode ? 23 : 3 }} />
            </button>
          </div>
        </div>

        {/* Source Selection */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button 
            onClick={() => setSource('subject')}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: `1px solid ${source === 'subject' ? 'var(--holo-primary)' : 'rgba(255,255,255,0.1)'}`, background: source === 'subject' ? 'rgba(0,245,255,0.1)' : 'transparent', color: source === 'subject' ? '#fff' : 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Database size={16} /> Por Matéria
          </button>
          <button 
            onClick={() => setSource('pdf')}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: `1px solid ${source === 'pdf' ? 'var(--holo-primary)' : 'rgba(255,255,255,0.1)'}`, background: source === 'pdf' ? 'rgba(0,245,255,0.1)' : 'transparent', color: source === 'pdf' ? '#fff' : 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <FileText size={16} /> Por PDF
          </button>
        </div>

        {source === 'subject' ? (
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Matéria</label>
            <div style={{ position: 'relative' }}>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="input-holo" style={{ appearance: 'none' }}>
                {SUBJECTS.map(s => <option key={s} value={s} style={{ background: '#020d1f' }}>{s}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem', borderColor: 'rgba(0,245,255,0.15)' }}>
            <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud size={16} /> Enviar Conteúdo (PDF)
            </h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '1px dashed rgba(0,245,255,0.3)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', background: 'rgba(0,245,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', ...(uploadedFile ? { borderColor: '#00f5ff', background: 'rgba(0,245,255,0.05)' } : {}) }}
            >
              <input 
                type="file" accept=".pdf" ref={fileInputRef} 
                onChange={(e) => e.target.files?.[0] && setUploadedFile(e.target.files[0])} 
                style={{ display: 'none' }} 
              />
              <FileText size={28} color="rgba(0,245,255,0.5)" style={{ margin: '0 auto 0.5rem' }} />
              {uploadedFile ? (
                <>
                  <p style={{ fontSize: '0.8rem', color: '#00f5ff', margin: 0, fontWeight: 600 }}>{uploadedFile.name}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>PDF pronto para extração</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0 }}>Toque para escolher o PDF</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>IA criará questões sobre este arquivo</p>
                </>
              )}
            </div>
            
            {uploadedFile && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Opções de Filtragem</p>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {[
                    { id: 'all', label: 'Tudo', icon: <Layers size={14}/> },
                    { id: 'pages', label: 'Páginas', icon: <Hash size={14}/> },
                    { id: 'topic', label: 'Por Tópico', icon: <Zap size={14}/> }
                  ].map(f => (
                    <button key={f.id} onClick={() => setPdfFilter(f.id as any)} style={{
                      flex: 1, padding: '0.5rem', borderRadius: '8px', border: `1px solid ${pdfFilter === f.id ? 'var(--holo-primary)' : 'rgba(255,255,255,0.08)'}`,
                      background: pdfFilter === f.id ? 'rgba(0,245,255,0.1)' : 'rgba(255,255,255,0.02)',
                      color: pdfFilter === f.id ? '#fff' : 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer'
                    }}>
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {pdfFilter === 'pages' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <input 
                        type="text" placeholder="Ex: 1-10 ou 5" value={pageRange} onChange={e => setPageRange(e.target.value)}
                        className="input-holo" style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                      />
                    </motion.div>
                  )}
                  {pdfFilter === 'topic' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <input 
                        type="text" placeholder="Qual o assunto foco do PDF?" value={targetTopic} onChange={e => setTargetTopic(e.target.value)}
                        className="input-holo" style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Bank Selection */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Banca Examinadora</label>
            <button onClick={() => setShowAddBank(!showAddBank)} style={{ background: 'transparent', border: 'none', color: 'var(--holo-secondary)', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> Personalizar
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            {banks.map(b => (
              <button key={b} onClick={() => setBank(b)} style={{
                padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                border: `1.5px solid ${bank === b ? 'var(--holo-secondary)' : 'rgba(255,255,255,0.08)'}`,
                background: bank === b ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.02)',
                color: bank === b ? 'var(--holo-secondary)' : 'var(--text-muted)',
                transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>{b}</button>
            ))}
          </div>

          <AnimatePresence>
            {showAddBank && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <input placeholder="Ex: CEV, AOCP..." value={newBank} onChange={e => setNewBank(e.target.value)} className="input-holo" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                <button onClick={addCustomBank} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Add</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Dificuldade</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {DIFFICULTIES.map(d => (
              <button key={d.key} onClick={() => setDifficulty(d.key)} style={{
                flex: 1, padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                border: `1.5px solid ${difficulty === d.key ? d.color : 'rgba(255,255,255,0.1)'}`,
                background: difficulty === d.key ? `${d.color}18` : 'transparent',
                color: difficulty === d.key ? d.color : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>{d.label}</button>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Quantidade de Questões: <span style={{ color: 'var(--holo-primary)' }}>{questionCount}</span>
          </label>
          <input type="range" min={3} max={15} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--holo-primary)', cursor: 'pointer' }} />
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.8rem' }}>
          <AlertCircle size={14} />{error}
        </div>}

        <motion.button className="btn-primary" onClick={startSimulado} disabled={loading || isExtracting}
          style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }} whileTap={{ scale: 0.97 }}>
          {isExtracting ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw size={16} /></motion.div> Extraindo conteúdo PDF...</>
          ) : loading ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw size={16} /></motion.div> Cravejando questões...</>
          ) : (
            <><Award size={16} /> Ver Meu Conhecimento</>
          )}
        </motion.button>
      </motion.div>
    </div>
  );

  if (phase === 'playing' && current) return (
    <div style={{ padding: '1rem', maxWidth: 500, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <div className="tag">{subject}</div>
          <div className="tag" style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--holo-secondary)', border: '1px solid rgba(168,85,247,0.2)' }}>{bank}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentIdx + 1}/{questions.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: timeLeft < 60 ? '#ef4444' : 'var(--holo-primary)', fontSize: '0.85rem', fontFamily: 'Orbitron, sans-serif' }}>
          <Timer size={14} />{formatTime(timeLeft)}
        </div>
      </div>

      <div style={{ height: '3px', background: 'rgba(0,245,255,0.1)', borderRadius: '2px', marginBottom: '1.25rem', overflow: 'hidden' }}>
        <motion.div style={{ height: '100%', background: 'linear-gradient(to right, var(--holo-primary), var(--holo-secondary))', borderRadius: '2px' }}
          initial={false} animate={{ width: `${((currentIdx) / questions.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500 }}>
              {current.question}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
            {current.options.map(opt => {
              const isCorrect = opt.key === current.correct_answer;
              const isSelected = opt.key === selected;
              let bg = 'rgba(0,245,255,0.03)', border = 'rgba(255,255,255,0.08)', color = 'var(--text-primary)';
              if (answered) {
                if (isCorrect) { bg = 'rgba(16,185,129,0.1)'; border = '#10b981'; color = '#10b981'; }
                else if (isSelected && !isCorrect) { bg = 'rgba(239,68,68,0.1)'; border = '#ef4444'; color = '#ef4444'; }
              } else if (isSelected) { bg = 'rgba(0,245,255,0.1)'; border = 'var(--holo-primary)'; }

              return (
                <motion.button key={opt.key} onClick={() => handleSelect(opt.key)}
                  style={{ width: '100%', textAlign: 'left', padding: '0.85rem 1.1rem', borderRadius: '12px', cursor: answered ? 'default' : 'pointer', border: `1.5px solid ${border}`, background: bg, color, fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                  whileTap={!answered ? { scale: 0.98 } : {}}>
                  <div style={{ width: 24, height: 24, borderRadius: '6px', background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>{opt.key}</div>
                  <span style={{ flex: 1 }}>{opt.text}</span>
                  {answered && isCorrect && <CheckCircle size={16} style={{ color: '#10b981' }} />}
                  {answered && isSelected && !isCorrect && <XCircle size={16} style={{ color: '#ef4444' }} />}
                </motion.button>
              );
            })}
          </div>

          {answered && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={() => setShowExplanation(s => !s)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--holo-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '0.75rem' }}>
                <Lightbulb size={14} />{showExplanation ? 'Ocultar' : 'Ver'} Explicação Detalhada
              </button>
              {showExplanation && (
                <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{current.explanation}</p>
                </div>
              )}
              <button className="btn-primary" onClick={nextQuestion} style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                {currentIdx + 1 >= questions.length ? 'Finalizar Simulado' : 'Próxima Questão'} <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Trophy size={56} style={{ color: pct >= 70 ? '#f59e0b' : 'var(--text-muted)', marginBottom: '1rem' }} />
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.3rem', color: pct >= 70 ? '#f59e0b' : 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {pct >= 70 ? '🎉 Excelente!' : '📚 Pratique Mais!'}
        </h2>
        <div style={{ fontSize: '3.5rem', fontFamily: 'Orbitron, sans-serif', fontWeight: 900, color: pct >= 70 ? 'var(--holo-primary)' : '#ef4444', marginBottom: '0.5rem', textShadow: `0 0 20px ${pct >= 70 ? 'rgba(0,245,255,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
          {pct}%
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Banca: <strong>{bank}</strong> · Matéria: <strong>{subject}</strong>
        </p>

        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BarChart2 size={12} />Análise do Desempenho
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {answers.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: i === answers.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ marginTop: 2 }}>{a.correct_bool ? <CheckCircle size={16} style={{ color: '#10b981' }} /> : <XCircle size={16} style={{ color: '#ef4444' }} />}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', lineHeight: 1.4, fontWeight: 500 }}>{a.q.substring(0, 100)}...</p>
                  {!a.correct_bool && <p style={{ color: '#f59e0b', fontSize: '0.7rem', marginTop: 4 }}>Gabarito: {a.correct} · Sua Resposta: {a.selected}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setPhase('config')} style={{ flex: 1, justifyContent: 'center' }}>
            <RefreshCw size={14} /> Refazer
          </button>
          <button className="btn-primary" onClick={() => { setPhase('config'); }} style={{ flex: 1, justifyContent: 'center' }}>
            <Trophy size={14} /> Novo Desafio
          </button>
        </div>
      </motion.div>
    </div>
  );
};
