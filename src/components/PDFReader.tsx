import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Sparkles, FileSearch, AlignLeft, HelpCircle, LayoutGrid, CheckCircle, XCircle, RotateCcw, Hash, TextQuote } from 'lucide-react';
import { analyzePDFText } from '../services/aiService';
import { useApp } from '../context/AppContext';
import type { QuizQuestion } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js de forma robusta
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export const PDFReader: React.FC = () => {
  const { apiKey, aiProvider, customBaseUrl, customModelId } = useApp();
  const [fileName, setFileName] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [result, setResult] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<'summary' | 'questions' | 'flashcards' | 'studyplan' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [filterMode, setFilterMode] = useState<'all' | 'pages' | 'topic'>('all');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [topic, setTopic] = useState('');

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }
    setFileName(file.name);
    setPdfFile(file);
    setLoading(true);
    setResult('');
    setQuizQuestions([]);
    setUserAnswers({});
    setShowResults(false);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      setEndPage(Math.min(pdf.numPages, 10)); // Default to first 10 pages for safety
    } catch (error: any) {
      console.error('Erro ao ler PDF:', error);
      alert(`Erro ao processar o PDF: ${error.message || 'Erro desconhecido'}`);
      setFileName('');
      setPdfFile(null);
    } finally {
      setLoading(false);
    }
  };

  const extractTextForAction = async () => {
    if (!pdfFile) return '';
    setLoading(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let start = 1;
      let end = pdf.numPages;

      if (filterMode === 'pages') {
        start = Math.max(1, startPage);
        end = Math.min(pdf.numPages, endPage);
        if (start > end) throw new Error('A página inicial não pode ser maior que a final.');
      } else if (filterMode === 'all') {
        end = Math.min(pdf.numPages, 20); // Limite de 20 páginas para modo completo para evitar timeouts
      }

      let fullText = '';
      for (let i = start; i <= end; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (e: any) {
      alert(`Erro na extração: ${e.message}`);
      return '';
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (action: 'summary' | 'questions' | 'flashcards' | 'studyplan') => {
    const pdfText = await extractTextForAction();
    if (!pdfText) return;

    setLoading(true);
    setActiveAction(action);
    setResult('');
    try {
      if (!apiKey) {
        setResult('Por favor, configure sua chave API no Perfil para usar esta função.');
      } else {
        const aiConfig = { apiKey, provider: aiProvider, baseUrl: customBaseUrl, modelId: customModelId };
        const res = await analyzePDFText(aiConfig, pdfText, action, filterMode === 'topic' ? topic : undefined);
        
        if (Array.isArray(res)) {
          setQuizQuestions(res);
          setResult('QUIZ_MODE');
        } else {
          setResult(res);
          setQuizQuestions([]);
        }
        setUserAnswers({});
        setShowResults(false);
      }
    } catch (error: any) {
      console.error('Erro na análise:', error);
      setResult(`Erro na análise: ${error.message || 'Verifique sua conexão e chave API.'}`);
    } finally {
      setLoading(false);
    }
  };

  const actionButtons = [
    { key: 'summary' as const, icon: <AlignLeft size={16} />, label: 'Resumo', color: 'var(--holo-primary)' },
    { key: 'questions' as const, icon: <HelpCircle size={16} />, label: 'Questões', color: 'var(--holo-secondary)' },
    { key: 'flashcards' as const, icon: <LayoutGrid size={16} />, label: 'Flashcards', color: '#f59e0b' },
    { key: 'studyplan' as const, icon: <FileSearch size={16} />, label: 'Plano de Estudo', color: '#10b981' },
  ];

  return (
    <div style={{ padding: '1.25rem', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', color: 'var(--holo-primary)', marginBottom: '0.25rem' }}>📄 Leitor de PDF</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Envie sua apostila e escolha o que quer estudar</p>
      </div>

      {/* Drop zone */}
      <motion.div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        animate={isDragging ? { scale: 1.02, borderColor: 'var(--holo-primary)' } : { scale: 1 }}
        style={{
          border: `2px dashed ${isDragging || fileName ? 'rgba(0,245,255,0.5)' : 'rgba(0,245,255,0.2)'}`,
          borderRadius: 16, padding: '2rem', textAlign: 'center', cursor: 'pointer',
          background: isDragging ? 'rgba(0,245,255,0.06)' : 'rgba(0,245,255,0.02)',
          marginBottom: '1.25rem', transition: 'all 0.3s ease',
        }}
      >
        <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {fileName ? (
          <div>
            <FileText size={36} style={{ color: 'var(--holo-primary)', marginBottom: '0.5rem' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{fileName}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{totalPages} páginas · Clique para trocar</p>
          </div>
        ) : (
          <div>
            <Upload size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Arraste seu PDF aqui</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>ou clique para selecionar</p>
          </div>
        )}
      </motion.div>

      {/* Filter Options */}
      {fileName && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>🎯 Opções de Filtragem</p>
          
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
            {[
              { id: 'all', label: 'Tudo', icon: <Hash size={12} /> },
              { id: 'pages', label: 'Páginas', icon: <LayoutGrid size={12} /> },
              { id: 'topic', label: 'Tópico', icon: <TextQuote size={12} /> }
            ].map(mode => (
              <button key={mode.id} onClick={() => setFilterMode(mode.id as any)} style={{
                flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
                background: filterMode === mode.id ? 'var(--holo-primary)' : 'rgba(255,255,255,0.05)',
                color: filterMode === mode.id ? '#000' : 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s'
              }}>
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {filterMode === 'pages' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>De:</label>
                  <input type="number" min={1} max={totalPages} value={startPage} onChange={e => setStartPage(Number(e.target.value))} className="input-holo" style={{ padding: '0.4rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Até:</label>
                  <input type="number" min={1} max={totalPages} value={endPage} onChange={e => setEndPage(Number(e.target.value))} className="input-holo" style={{ padding: '0.4rem' }} />
                </div>
              </motion.div>
            )}

            {filterMode === 'topic' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Qual tópico focar?</label>
                <input placeholder="Ex: Ortologia, Botânica..." value={topic} onChange={e => setTopic(e.target.value)} className="input-holo" style={{ padding: '0.5rem' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Action buttons */}
      {fileName && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={12} />Gerar com IA
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            {actionButtons.map(btn => (
              <motion.button key={btn.key} whileTap={{ scale: 0.96 }}
                onClick={() => handleAnalyze(btn.key)}
                disabled={loading}
                style={{
                  background: activeAction === btn.key ? `${btn.color}12` : 'transparent',
                  border: `1.5px solid ${activeAction === btn.key ? btn.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px', padding: '0.75rem', cursor: 'pointer',
                  color: activeAction === btn.key ? btn.color : 'var(--text-secondary)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.2s',
                }}>
                {btn.icon}{btn.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <Sparkles size={32} style={{ color: 'var(--holo-primary)' }} />
          </motion.div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>O Senhor Saber está lendo seu material filtrado...</p>
        </div>
      )}

      {/* Result UI */}
      {result && result !== 'QUIZ_MODE' && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Resultado da Análise
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result}</p>
        </motion.div>
      )}

      {/* Quiz UI */}
      {result === 'QUIZ_MODE' && quizQuestions.length > 0 && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              📝 Quiz Interativo
            </p>
            {showResults && (
              <button onClick={() => { setShowResults(false); setUserAnswers({}); }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--holo-secondary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <RotateCcw size={12} /> Refazer
              </button>
            )}
          </div>

          {quizQuestions.map((q, qIdx) => (
            <div key={q.id} className="glass-card" style={{ padding: '1rem', borderLeft: `3px solid ${showResults ? (userAnswers[q.id] === q.correct_answer ? '#10b981' : '#ef4444') : 'var(--holo-primary)'}` }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.75rem', fontWeight: 500 }}>
                {qIdx + 1}. {q.question}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {q.options.map((opt) => {
                  const isSelected = userAnswers[q.id] === opt.key;
                  const isCorrect = opt.key === q.correct_answer;
                  let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.08)', color = 'var(--text-primary)';
                  
                  if (showResults) {
                    if (isCorrect) { bg = 'rgba(16,185,129,0.1)'; border = '#10b981'; color = '#10b981'; }
                    else if (isSelected) { bg = 'rgba(239,68,68,0.1)'; border = '#ef4444'; color = '#ef4444'; }
                  } else if (isSelected) {
                    bg = 'rgba(0,245,255,0.1)'; border = 'var(--holo-primary)';
                  }

                  return (
                    <button key={opt.key}
                      onClick={() => !showResults && setUserAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
                      style={{
                        padding: '0.6rem 0.8rem', borderRadius: '8px', border: `1px solid ${border}`,
                        background: bg, color, fontSize: '0.8rem', textAlign: 'left', cursor: showResults ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s',
                      }}>
                      <span style={{ fontWeight: 700, opacity: 0.7 }}>{opt.key}</span>
                      <span>{opt.text}</span>
                      {showResults && isCorrect && <CheckCircle size={12} style={{ marginLeft: 'auto' }} />}
                      {showResults && isSelected && !isCorrect && <XCircle size={12} style={{ marginLeft: 'auto' }} />}
                    </button>
                  );
                })}
              </div>

              {showResults && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <strong>Explicação:</strong> {q.explanation}
                </motion.div>
              )}
            </div>
          ))}

          {!showResults && (
            <button className="btn-primary" 
              onClick={() => setShowResults(true)}
              disabled={Object.keys(userAnswers).length < quizQuestions.length}
              style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', marginTop: '0.5rem' }}>
              Finalizar e Mostrar Gabarito
            </button>
          )}

          {showResults && (
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(rgba(0,245,255,0.05), transparent)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--holo-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>
                Seu Resultado: {Object.values(userAnswers).filter((ans, i) => ans === quizQuestions[i].correct_answer).length} / {quizQuestions.length}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ótimo desempenho nos estudos!</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
