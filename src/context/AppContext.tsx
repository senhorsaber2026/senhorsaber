import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Message, Flashcard, StudySubject, UserProfile } from '../types';

export type AIProvider = 'gemini' | 'universal';

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  chatHistory: Message[];
  addMessage: (msg: Message) => void;
  flashcards: Flashcard[];
  addFlashcard: (card: Flashcard) => void;
  studySubjects: StudySubject[];
  setStudySubjects: (subjects: StudySubject[]) => void;
  userProfile: UserProfile | null;
  setUserProfile: (p: UserProfile | null) => void;
  login: (credentials: { login: string, password: string }) => Promise<void>;
  register: (data: { name: string, email: string }) => Promise<{ login: string, password: string }>;
  logout: () => void;
  setPlan: (plan: 'free' | 'premium') => void;
  clearChat: () => void;
  apiKey: string;
  setApiKey: (k: string) => void;
  aiProvider: AIProvider;
  setAiProvider: (p: AIProvider) => void;
  customBaseUrl: string;
  setCustomBaseUrl: (url: string) => void;
  customModelId: string;
  setCustomModelId: (id: string) => void;
  estudosSubTab: 'plano' | 'pdf' | 'flashcards';
  setEstudosSubTab: (sub: 'plano' | 'pdf' | 'flashcards') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SUBJECTS: StudySubject[] = [
  { id: '1', name: 'Matemática', progress: 0, icon: '📐', color: '#00f5ff' },
  { id: '2', name: 'Português', progress: 0, icon: '📖', color: '#a855f7' },
  { id: '3', name: 'História', progress: 0, icon: '🏛️', color: '#f59e0b' },
  { id: '4', name: 'Ciências', progress: 0, icon: '🔬', color: '#10b981' },
  { id: '5', name: 'Geografia', progress: 0, icon: '🌍', color: '#3b82f6' },
  { id: '6', name: 'Inglês', progress: 0, icon: '🌐', color: '#ef4444' },
];


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [estudosSubTab, setEstudosSubTab] = useState<'plano' | 'pdf' | 'flashcards'>('plano');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [studySubjects, setStudySubjects] = useState<StudySubject[]>(DEFAULT_SUBJECTS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('user_profile_real');
    return saved ? JSON.parse(saved) : null;
  });
  
  const API_URL = 'http://localhost:3001/api';

  const setPlan = (plan: 'free' | 'premium') => {
    setUserProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, plan };
      localStorage.setItem('user_profile_real', JSON.stringify(updated));
      return updated;
    });
  };

  const login = async (credentials: { login: string, password: string }) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no login');
    
    const profile = {
      ...data.user,
      token: data.token,
      isAdmin: data.user.is_admin,
      plan: data.user.plan || 'free',
      status: data.user.status || 'active',
      questionsToday: 0,
      simuladosToday: 0,
      totalScore: 0,
      streak: 1
    };
    
    setUserProfile(profile);
    localStorage.setItem('user_profile_real', JSON.stringify(profile));
  };

  const register = async (userData: { name: string, email: string }) => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no registro');
    return data.credentials;
  };

  const logout = () => {
    setUserProfile(null);
    localStorage.removeItem('user_profile_real');
    setActiveTab('home');
  };
  const clearChat = () => setChatHistory([]);
  
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key')?.trim() || import.meta.env.VITE_GROQ_API_KEY || '');

  // Fetch global API key from server on startup (overrides only if no personal key set)
  useEffect(() => {
    const personalKey = localStorage.getItem('gemini_api_key')?.trim();
    if (!personalKey) {
      fetch('http://localhost:3001/api/settings/apikey')
        .then(r => r.json())
        .then(data => { if (data.apiKey) setApiKey(data.apiKey); })
        .catch(() => {}); // silently fail if server is offline
    }
  }, []);
  const [aiProvider, setAiProvider] = useState<AIProvider>((localStorage.getItem('ai_provider') as AIProvider) || 'universal');
  const [customBaseUrl, setCustomBaseUrl] = useState(localStorage.getItem('custom_base_url') || 'https://api.groq.com/openai/v1');
  const [customModelId, setCustomModelId] = useState(localStorage.getItem('custom_model_id') || 'llama-3.3-70b-versatile');

  const handleSetApiKey = (k: string) => {
    const trimmed = k.trim();
    setApiKey(trimmed);
    localStorage.setItem('gemini_api_key', trimmed);
  };

  const handleSetAiProvider = (p: AIProvider) => {
    setAiProvider(p);
    localStorage.setItem('ai_provider', p);
  };

  const handleSetCustomBaseUrl = (url: string) => {
    setCustomBaseUrl(url);
    localStorage.setItem('custom_base_url', url);
  };

  const handleSetCustomModelId = (id: string) => {
    setCustomModelId(id);
    localStorage.setItem('custom_model_id', id);
  };

  const addMessage = (msg: Message) => setChatHistory(prev => [...prev, msg]);
  const addFlashcard = (card: Flashcard) => setFlashcards(prev => [...prev, card]);

  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab,
      chatHistory, addMessage, clearChat,
      flashcards, addFlashcard,
      studySubjects, setStudySubjects,
      userProfile, setUserProfile, setPlan,
      login, register, logout,
      apiKey, setApiKey: handleSetApiKey,
      aiProvider, setAiProvider: handleSetAiProvider,
      customBaseUrl, setCustomBaseUrl: handleSetCustomBaseUrl,
      customModelId, setCustomModelId: handleSetCustomModelId,
      estudosSubTab, setEstudosSubTab,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
