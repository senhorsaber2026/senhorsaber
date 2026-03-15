import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Calendar, RefreshCw, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateStudyPlan } from '../services/aiService';

export const StudyPlanScreen: React.FC = () => {
  const { studySubjects, apiKey, userProfile, aiProvider, customBaseUrl, customModelId } = useApp();
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);

  if (!userProfile) return null;

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      if (!apiKey) {
        setPlan('Por favor, configure sua chave API no Perfil para gerar seu plano de estudos personalizado.');
      } else {
        const weakAreas = studySubjects.filter(s => s.progress < 60).map(s => s.name);
        const all = studySubjects.map(s => s.name);
        const aiConfig = { apiKey, provider: aiProvider, baseUrl: customBaseUrl, modelId: customModelId };
        const result = await generateStudyPlan(aiConfig, all, weakAreas);
        setPlan(result);
      }
    } catch (error) {
      console.error('Erro no plano:', error);
      setPlan('Erro ao gerar plano. Verifique sua API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', color: 'var(--holo-primary)', marginBottom: '0.25rem' }}>📊 Plano de Estudos</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Seu progresso personalizado</p>
      </div>

      {/* Subject progress bars */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <TrendingUp size={12} />Progresso por Matéria
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {studySubjects.map((subj, i) => (
            <motion.div key={subj.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>{subj.icon}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{subj.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: subj.color, fontFamily: 'Orbitron, sans-serif' }}>{subj.progress}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: '3px', background: `linear-gradient(to right, ${subj.color}88, ${subj.color})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${subj.progress}%` }}
                  transition={{ duration: 1, delay: i * 0.06 + 0.3, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { icon: <Target size={16} />, label: 'Meta Diária', value: '2h', color: 'var(--holo-primary)' },
          { icon: <Calendar size={16} />, label: 'Dias Seguidos', value: `${userProfile.streak} 🔥`, color: '#f59e0b' },
          { icon: <Zap size={16} />, label: 'Questões Hoje', value: `${userProfile.questionsToday}`, color: 'var(--holo-secondary)' },
          { icon: <TrendingUp size={16} />, label: 'Média Geral', value: `${studySubjects.length > 0 ? Math.round(studySubjects.reduce((acc, s) => acc + s.progress, 0) / studySubjects.length) : 0}%`, color: '#10b981' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
            <div style={{ color: stat.color, marginBottom: '0.35rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color, fontFamily: 'Orbitron, sans-serif' }}>{stat.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* AI Plan generator */}
      <button className="btn-purple" onClick={handleGeneratePlan} disabled={loading}
        style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', marginBottom: '1rem' }}>
        {loading ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw size={14} /></motion.div> Gerando Plano...</> : '✨ Gerar Plano Inteligente com IA'}
      </button>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card-purple" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--holo-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📅 Seu Plano Personalizado</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{plan}</p>
        </motion.div>
      )}
    </div>
  );
};
