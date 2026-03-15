import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, RotateCcw, ChevronLeft, ChevronRight, Check, BookOpen, Shuffle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateFlashcards } from '../services/aiService';
import type { Flashcard } from '../types';

export const FlashcardsScreen: React.FC = () => {
  const { flashcards, addFlashcard, apiKey, aiProvider, customBaseUrl, customModelId } = useApp();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>(flashcards);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<'list' | 'study'>('list');
  const [masteredSet, setMasteredSet] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      if (!apiKey) {
        alert('Por favor, configure sua chave API no Perfil para gerar flashcards.');
        setLoading(false);
        return;
      }
      const aiConfig = { apiKey, provider: aiProvider, baseUrl: customBaseUrl, modelId: customModelId };
      const newCards = await generateFlashcards(aiConfig, topic, 6);
      newCards.forEach(c => addFlashcard(c));
      setCards(prev => [...prev, ...newCards]);
      setTopic('');
    } catch (error: any) {
      console.error('Erro ao gerar flashcards:', error);
      alert(`Erro ao gerar flashcards: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrent(0);
    setFlipped(false);
  };

  const handleMastered = () => {
    setMasteredSet(prev => { const s = new Set(prev); s.add(cards[current].id); return s; });
    goNext();
  };
  const goNext = () => { setCurrent(i => (i + 1) % cards.length); setFlipped(false); };
  const goPrev = () => { setCurrent(i => (i - 1 + cards.length) % cards.length); setFlipped(false); };

  return (
    <div style={{ padding: '1.25rem', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', color: 'var(--holo-primary)' }}>🃏 Flashcards</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{cards.length} cartões · {masteredSet.size} dominados</p>
        </div>
        {cards.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-ghost" style={{ padding: '0.4rem 0.6rem' }} onClick={handleShuffle}><Shuffle size={14} /></button>
            <button className={mode === 'study' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.4rem 0.7rem', fontSize: '0.75rem' }} onClick={() => { setMode(m => m === 'study' ? 'list' : 'study'); setCurrent(0); setFlipped(false); }}>
              <BookOpen size={13} />{mode === 'study' ? 'Lista' : 'Estudar'}
            </button>
          </div>
        )}
      </div>

      {/* Generate zone */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Gerar Flashcards com IA</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="input-holo" placeholder="Ex: Fotossíntese, Revolução Francesa..." value={topic} onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()} style={{ flex: 1 }} />
          <button className="btn-primary" onClick={handleGenerate} disabled={loading || !topic.trim()} style={{ padding: '0.65rem', flexShrink: 0 }}>
            {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw size={14} /></motion.div> : <Plus size={14} />}
          </button>
        </div>
      </div>

      {cards.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🃏</div>
          <p style={{ fontSize: '0.85rem' }}>Nenhum flashcard ainda. Gere com IA!</p>
        </div>
      )}

      {/* Study mode - card flip */}
      {mode === 'study' && cards.length > 0 && (
        <div>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {current + 1} / {cards.length}
          </div>
          <motion.div
            onClick={() => setFlipped(f => !f)}
            style={{ cursor: 'pointer', perspective: 800, marginBottom: '1rem' }}
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5 }}
              style={{ position: 'relative', transformStyle: 'preserve-3d', height: 220 }}
            >
              {/* Front */}
              <div style={{
                position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                background: 'rgba(0,245,255,0.05)', border: '1px solid var(--border-holo)', borderRadius: 16,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>PERGUNTA</p>
                <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>{cards[current]?.question}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Toque para revelar</p>
              </div>
              {/* Back */}
              <div style={{
                position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--holo-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>RESPOSTA</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{cards[current]?.answer}</p>
              </div>
            </motion.div>
          </motion.div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn-ghost" onClick={goPrev} style={{ padding: '0.65rem', flexShrink: 0 }}><ChevronLeft size={16} /></button>
            <button className="btn-secondary" onClick={handleMastered} style={{ flex: 1, justifyContent: 'center', color: '#10b981', borderColor: '#10b981' }}>
              <Check size={14} /> Dominei!
            </button>
            <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setFlipped(false); goNext(); }}>
              <RotateCcw size={14} /> Rever
            </button>
            <button className="btn-ghost" onClick={goNext} style={{ padding: '0.65rem', flexShrink: 0 }}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* List mode */}
      {mode === 'list' && cards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {cards.map((card, i) => (
            <motion.div key={card.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card" style={{ padding: '0.75rem 1rem', borderColor: masteredSet.has(card.id) ? 'rgba(16,185,129,0.3)' : 'var(--border-holo)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.25rem' }}>{card.question}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{card.answer}</p>
                </div>
                {masteredSet.has(card.id) && <Check size={14} style={{ color: '#10b981', flexShrink: 0, marginLeft: 8 }} />}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
