import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Trash2, Copy, Check } from 'lucide-react';
import { Avatar } from './Avatar';
import { useApp } from '../context/AppContext';
import { askQuestion } from '../services/aiService';
import type { Message } from '../types';

const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: '0.75rem',
        alignItems: 'flex-start',
        marginBottom: '1rem',
      }}
    >
      {!isUser && (
        <div style={{ flexShrink: 0 }}>
          <Avatar size="sm" speaking />
        </div>
      )}
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          background: isUser
            ? 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(59,130,246,0.15))'
            : 'rgba(6,20,37,0.8)',
          border: `1px solid ${isUser ? 'rgba(0,245,255,0.3)' : 'rgba(0,245,255,0.12)'}`,
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          padding: '0.75rem 1rem',
          backdropFilter: 'blur(10px)',
          position: 'relative',
        }}>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>{msg.content}</p>

          {!isUser && (
            <button
              onClick={handleCopy}
              style={{
                position: 'absolute', bottom: 6, right: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: copied ? 'var(--holo-accent)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', padding: '2px',
                borderRadius: '4px',
                transition: 'color 0.2s',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: isUser ? 'right' : 'left' }}>
          {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

const TypingIndicator: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}
  >
    <Avatar size="sm" speaking />
    <div style={{
      background: 'rgba(6,20,37,0.8)',
      border: '1px solid rgba(0,245,255,0.12)',
      borderRadius: '4px 16px 16px 16px',
      padding: '0.75rem 1rem',
      display: 'flex', alignItems: 'center', gap: '5px',
    }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--holo-primary)' }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>Senhor Saber está pensando...</span>
    </div>
  </motion.div>
);

const QUICK_QUESTIONS = [
  'O que é fotossíntese?',
  'Explique a Lei de Newton',
  'Como funciona o DNA?',
  'O que foi a Revolução Francesa?',
  'Explique equações de 2° grau',
];

export const ChatInterface: React.FC = () => {
  const { chatHistory, addMessage, clearChat, apiKey, aiProvider, customBaseUrl, customModelId } = useApp();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSend = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || isLoading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: q, timestamp: new Date() };
    addMessage(userMsg);
    setInput('');
    setIsLoading(true);
    setIsSpeaking(true);

    try {
      if (!apiKey) {
        addMessage({ id: `a-${Date.now()}`, role: 'assistant', content: '🎓 **Senhor Saber aqui!**\n\nPor favor, configure sua chave API no seu Perfil para que eu possa responder suas dúvidas.', timestamp: new Date() });
      } else {
        const aiConfig = { apiKey, provider: aiProvider, baseUrl: customBaseUrl, modelId: customModelId };
        const answer = await askQuestion(aiConfig, q);
        addMessage({ id: `a-${Date.now()}`, role: 'assistant', content: answer, timestamp: new Date() });
      }
    } catch (error) {
      console.error('Erro no chat:', error);
      addMessage({ id: `e-${Date.now()}`, role: 'assistant', content: '⚠️ Erro ao conectar com a IA. Verifique sua chave de API e conexão.', timestamp: new Date() });
    } finally {
      setIsLoading(false);
      setIsSpeaking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border-holo)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: 'rgba(2,13,31,0.5)',
        backdropFilter: 'blur(10px)',
      }}>
        <Avatar size="sm" speaking={isSpeaking} />
        <div>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', color: 'var(--holo-primary)' }}>
            Senhor Saber
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Online · Pronto para ensinar</span>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button className="btn-ghost" style={{ marginLeft: 'auto', padding: '0.4rem 0.6rem' }} onClick={clearChat}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {chatHistory.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <Avatar size="lg" speaking={false} />
            <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', color: 'var(--holo-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              Olá! Eu sou o Senhor Saber
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem', maxWidth: 280, margin: '0 auto 2rem' }}>
              Seu professor digital. Pergunte qualquer coisa que eu responderei de forma didática!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 320, margin: '0 auto' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                <Sparkles size={10} style={{ display: 'inline', marginRight: 4 }} />
                Sugestões
              </p>
              {QUICK_QUESTIONS.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleSend(q)}
                  style={{
                    background: 'rgba(0,245,255,0.04)',
                    border: '1px solid var(--border-holo)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  whileHover={{ borderColor: 'var(--holo-primary)', color: 'var(--text-primary)' }}
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {chatHistory.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border-holo)',
        background: 'rgba(2,13,31,0.6)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            className="input-holo"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao Senhor Saber..."
            rows={1}
            style={{ resize: 'none', minHeight: '44px', maxHeight: '120px' }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          <motion.button
            className="btn-primary"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            style={{ padding: '0.65rem', minWidth: '44px', height: '44px', justifyContent: 'center', flexShrink: 0 }}
            whileTap={{ scale: 0.9 }}
          >
            <Send size={16} />
          </motion.button>
        </div>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
};
