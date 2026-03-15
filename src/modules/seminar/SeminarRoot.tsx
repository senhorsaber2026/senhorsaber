import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { generateSeminarSlides } from '../../services/aiService';
import type { SeminarPhase, SeminarMode, Presentation } from './SeminarTypes';
import { extractTextFromPDF } from './SeminarPDFExtractor';
import { exportToPPTX } from './SeminarPPTXExporter';
import { generatePDF } from './SeminarPDFExporter';
import { SeminarConfig } from './SeminarConfig';
import { SeminarViewer } from './SeminarViewer';

export const SeminarScreen: React.FC = () => {
  const { apiKey, aiProvider, customBaseUrl, customModelId, userProfile } = useApp();
  const [phase, setPhase] = useState<SeminarPhase>('config');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SeminarMode>('resumo_inteligente');
  const [pageRange, setPageRange] = useState('');
  const [topic, setTopic] = useState('');
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerate = async () => {
    if (!pdfFile || !apiKey) {
      setError('Por favor, selecione um arquivo PDF.');
      return;
    }
    setPhase('loading'); setError('');
    try {
      setIsExtracting(true);
      const text = await extractTextFromPDF(pdfFile, mode, pageRange);
      setIsExtracting(false);
      const result = await generateSeminarSlides(
        { apiKey, provider: aiProvider, baseUrl: customBaseUrl, modelId: customModelId },
        text, mode, 'educacional', userProfile.name, topic
      ) as Presentation;
      setPresentation(result); setPhase('viewer'); setCurrentSlide(0);
    } catch (e) {
      setError('Falha na geração: verifique sua chave API ou o conteúdo do PDF.');
      setPhase('config');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'radial-gradient(circle at center, #051923 0%, #000 100%)' }}>
      <div style={{ width: '100%', maxWidth: '1000px' }}>
        {phase === 'config' && (
          <SeminarConfig 
            pdfFile={pdfFile} setPdfFile={setPdfFile} 
            mode={mode} setMode={setMode} 
            pageRange={pageRange} setPageRange={setPageRange}
            topic={topic} setTopic={setTopic}
            onGenerate={handleGenerate} error={error} 
          />
        )}
        
        {phase === 'loading' && (
          <div style={{ textAlign: 'center', padding: '60px 0', maxWidth: '500px', margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: '2.5rem', background: 'rgba(2,13,31,0.6)', border: '1px solid var(--holo-primary)' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ marginBottom: '2rem', display: 'inline-block' }}>
                <RefreshCw size={48} color="var(--holo-primary)" />
              </motion.div>
              
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem', fontFamily: 'Orbitron, sans-serif' }}>
                PENSANDO...
              </h3>

              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Analisando PDF e extraindo contexto...', active: true },
                  { label: 'Identificando tópicos principais...', active: !isExtracting },
                  { label: 'Estruturando roteiro pedagógico...', active: !isExtracting },
                  { label: 'Gerando slides em Markdown...', active: !isExtracting },
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: step.active ? 1 : 0.3, x: 0 }}
                    style={{ fontSize: '0.85rem', color: step.active ? 'var(--holo-primary)' : '#555', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step.active ? 'var(--holo-primary)' : '#333', boxShadow: step.active ? '0 0 10px var(--holo-primary)' : 'none' }} />
                    {step.label}
                  </motion.div>
                ))}
              </div>
            </div>
            <p style={{ marginTop: '2rem', color: '#666', fontSize: '0.8rem' }}>
              Isso pode levar alguns segundos dependendo da velocidade da API.
            </p>
          </div>
        )}

        {phase === 'viewer' && (
          <SeminarViewer 
            presentation={presentation} 
            currentSlide={currentSlide} 
            setCurrentSlide={setCurrentSlide} 
            onPDF={async () => {
              if (isExporting) return;
              setIsExporting(true);
              try {
                await generatePDF(presentation!, setCurrentSlide);
              } catch (e) {
                setError('Falha ao exportar PDF. Tente novamente.');
              } finally {
                setIsExporting(false);
              }
            }} 
            onPPTX={async () => {
              if (isExporting) return;
              setIsExporting(true);
              try {
                await exportToPPTX(presentation!, 'educacional');
              } catch (e) {
                setError('Falha ao exportar PowerPoint. Tente novamente.');
              } finally {
                setIsExporting(false);
              }
            }} 
            onReset={() => { setPhase('config'); setError(''); }} 
          />
        )}
        
        {isExporting && (
          <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--holo-primary)', color: '#000', padding: '1rem', borderRadius: '8px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
              <RefreshCw size={18} />
            </motion.div>
            Exportando arquivos...
          </div>
        )}
      </div>
    </div>
  );
};
