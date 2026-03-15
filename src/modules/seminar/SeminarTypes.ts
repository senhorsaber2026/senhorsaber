export type SeminarPhase = 'config' | 'loading' | 'viewer';
export type SeminarMode = 'por_pagina' | 'por_topico' | 'resumo_inteligente';
export type SeminarStyle = 'academico' | 'minimalista' | 'educacional' | 'profissional';

export interface Slide {
  type: 'capa' | 'conteudo';
  title: string;
  subtitle?: string;
  content?: string;
  bullets?: string[];
  imageQuery?: string;
  script?: string;
}

export interface Presentation {
  title: string;
  slides: Slide[];
}
