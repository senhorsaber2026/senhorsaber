export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { key: string; text: string }[];
  correct_answer: string;
  explanation: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Simulado {
  id: string;
  title: string;
  questions: QuizQuestion[];
  timeLimit: number; // in seconds
  score?: number;
  completed?: boolean;
  startedAt?: Date;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  subject?: string;
  mastered?: boolean;
}

export interface StudySubject {
  id: string;
  name: string;
  progress: number;
  icon: string;
  color: string;
}

export interface UserProfile {
  name: string;
  email: string;
  plan: 'free' | 'premium';
  questionsToday: number;
  simuladosToday: number;
  totalScore: number;
  streak: number;
  login?: string;
  status: 'active' | 'pending' | 'blocked';
  isAdmin: boolean;
  token?: string;
}

export interface OraclePrediction {
  score: number;
  pattern: string;
  probabilities: { label: string; prob: number; color: string }[];
}

export type TabId = 'home' | 'perguntas' | 'simulados' | 'estudos' | 'laboratorio' | 'perfil' | 'oraculo' | 'previsao' | 'seminario' | 'admin';

export interface Slide {
  type: 'capa' | 'introducao' | 'conteudo' | 'conclusao';
  title: string;
  subtitle?: string;
  bullets?: string[];
  content?: string;
  presenter?: string;
  date?: string;
  script?: string;
  imageQuery?: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  style: string;
  mode: string;
}
