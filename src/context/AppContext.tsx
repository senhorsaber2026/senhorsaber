import { createContext, useContext, useState, type ReactNode } from 'react';
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
  userProfile: UserProfile;
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

const DEFAULT_PROFILE: UserProfile = {
  name: 'Usuário',
  email: 'usuario@saber.com',
  plan: 'free',
  questionsToday: 0,
  simuladosToday: 0,
  totalScore: 0,
  streak: 0,
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [studySubjects, setStudySubjects] = useState<StudySubject[]>(DEFAULT_SUBJECTS);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });
  
  const setPlan = (plan: 'free' | 'premium') => {
    setUserProfile(prev => {
      const updated = { ...prev, plan };
      localStorage.setItem('user_profile', JSON.stringify(updated));
      return updated;
    });
  };
  const clearChat = () => setChatHistory([]);
  
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key')?.trim() || 'gsk-eyJjb2dlbl9pZCI6IjEwNzc2MmQ1LTEwNjUtNGJhMS05ZGY0LWRmZGZiNmNhNTA2MCIsImtleV9pZCI6IjliNDI4YTkyLWNmYjItNDYzYi1hODI0LWZiYTc2ZmIwNzNkMiIsImN0aW1lIjoxNzczNTk0MTUxLCJjbGF1ZGVfYmlnX21vZGVsIjpudWxsLCJjbGF1ZGVfbWlkZGxlX21vZGVsIjpudWxsLCJjbGF1ZGVfc21hbGxfbW9kZWwiOm51bGx9fKxX6ZQYjKFGNoiLL7xD_2A201jJloA63sDM2WKOZged');
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
      userProfile, setPlan,
      apiKey, setApiKey: handleSetApiKey,
      aiProvider, setAiProvider: handleSetAiProvider,
      customBaseUrl, setCustomBaseUrl: handleSetCustomBaseUrl,
      customModelId, setCustomModelId: handleSetCustomModelId,
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
