import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizQuestion, Flashcard, OraclePrediction, Presentation } from '../types';

const PROFESSOR_PERSONA = `Você é o Senhor Saber, um professor digital sábio, didático, amigável e interativo.
Sua missão é ajudar estudantes brasileiros a aprender de forma clara, objetiva e motivadora.
Sempre responda em português do Brasil.
Estruture sua resposta com clareza, usando emojis.`;

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
];

/**
 * Robustly extract JSON from a string that might contain other text
 */
const extractJson = (text: string) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
};

/**
 * Universal (OpenAI Compatibility) helper
 */
const callUniversalAI = async (apiKey: string, baseUrl: string, modelId: string, prompt: string): Promise<string> => {
  const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error?.message || `Status: ${response.status}`;
    throw new Error(`Erro na API: ${errorMsg}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

/**
 * Gemini helper with fallback
 */
const callGeminiWithFallback = async (apiKey: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenerativeAI(apiKey);
  let lastError: any = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      lastError = error;
      const msg = error.message || '';
      if (!msg.includes('404') && !msg.includes('not found')) throw error;
    }
  }
  throw lastError || new Error('Nenhum modelo Gemini disponível.');
};

/**
 * Unified Dispatcher
 */
const callAI = async (options: {
  apiKey: string,
  provider: 'gemini' | 'universal',
  baseUrl?: string,
  modelId?: string,
  prompt: string
}): Promise<string> => {
  if (options.provider === 'gemini') {
    return callGeminiWithFallback(options.apiKey, options.prompt);
  } else {
    if (!options.baseUrl || !options.modelId) {
      throw new Error('Configuração Universal incompleta: Base URL e Model ID são necessários.');
    }
    return callUniversalAI(options.apiKey, options.baseUrl, options.modelId, options.prompt);
  }
};

// --- API Functions ---

export const askQuestion = async (config: any, question: string): Promise<string> => {
  const prompt = `${PROFESSOR_PERSONA}\n\nPergunta do aluno: ${question}\n\nResponda de forma didática e completa:`;
  return callAI({ ...config, prompt });
};

export const generateQuestions = async (
  config: any,
  subject: string,
  numQuestions: number = 5,
  difficulty: string = 'Média',
  bank: string = 'Geral',
  smartMode: boolean = false,
  unipMode: boolean = false
): Promise<QuizQuestion[]> => {
  const bankInstructions = {
    'CESPE / CEBRASPE': 'ESTILO CESPE: Gere questões EXCLUSIVAMENTE do tipo "Certo ou Errado". Cada questão deve ter apenas 2 opções: "A) Certo" e "B) Errado".',
    'FGV': 'ESTILO FGV: Foco em interpretação de texto complexa, casos práticos e pegadinhas jurídicas/administrativas comuns da banca.',
    'VUNESP': 'ESTILO VUNESP: Questões mais diretas, cobrando a letra da lei ou conceitos base com 5 alternativas claras.',
    'FCC': 'ESTILO FCC: Questões técnicas, cobrando detalhes minuciosos e comparativos entre conceitos.',
    'ESAF': 'ESTILO ESAF: Questões densas, com enunciados longos e alto nível de exigência técnica.'
  }[bank] || `ESTILO ${bank}: Adapte o estilo das questões para o padrão desta banca examinadora.`;

  const smartInstruction = smartMode 
    ? '\n\nMODO ESTUDO INTELIGENTE: Identifique e foque nos subtemas que têm as MAIORES TAXAS DE INCIDÊNCIA em concursos reais para este assunto. Explique na "explanation" por que este ponto é muito cobrado.' 
    : '';

  const unipInstruction = unipMode
    ? `\n\nMODELO UNIP EAD:
    - 10 questões no formato de múltipla escolha (A, B, C, D, E).
    - Nível MÉDIO a DIFÍCIL, seguindo rigorosamente o padrão acadêmico da UNIP.
    - OBRIGATÓRIO: Use o formato de múltiplas afirmativas (Ex: I, II, III, IV, V) no corpo da pergunta para a maioria das questões.
    - As opções (A-E) devem referir-se à correção das afirmativas (ex: "Apenas I e III estão corretas").
    - A "explanation" DEVE seguir este formato exato:
      Resposta correta: alternativa [LETRA].
      Análise das afirmativas:
      I – [Texto da afirmativa] ([Correta/Incorreta]). Justificativa: [Explicação baseada no conteúdo].
      II – [Texto da afirmativa] ([Correta/Incorreta]). Justificativa: [Explicação baseada no conteúdo].
      ... (repetir para todas as afirmativas da questão).`
    : '';

  const prompt = `${PROFESSOR_PERSONA}
Gere um simulado de ${numQuestions} questões sobre o assunto: "${subject}".
Dificuldade: ${difficulty}.
Banca Selecionada: ${bank}.
${bankInstructions}${smartInstruction}${unipInstruction}

MUITO IMPORTANTE: Retorne APENAS um JSON válido no formato abaixo, sem texto extra:
{
  "questions": [
    {
      "question": "texto da pergunta",
      "options": [
        {"key": "A", "text": "opção"},
        {"key": "B", "text": "opção"},
        {"key": "C", "text": "opção"},
        {"key": "D", "text": "opção"}
      ],
      "correct_answer": "A",
      "explanation": "explicação da resposta"
    }
  ]
}`;

  const text = await callAI({ ...config, prompt });
  const parsed = extractJson(text);
  if (!parsed || !parsed.questions) {
    throw new Error('Falha ao gerar questões estruturadas.');
  }
  return parsed.questions.map((q: any, i: number) => ({
    ...q,
    id: `q-${Date.now()}-${i}`,
    subject,
    difficulty,
  }));
};

export const generateQuestionsFromPDF = async (
  config: any,
  pdfText: string,
  numQuestions: number = 5,
  difficulty: string = 'Média',
  bank: string = 'Geral',
  topic?: string,
  unipMode: boolean = false
): Promise<QuizQuestion[]> => {
  const bankInstructions = {
    'CESPE / CEBRASPE': 'ESTILO CESPE: Gere questões EXCLUSIVAMENTE do tipo "Certo ou Errado". Cada questão deve ter apenas 2 opções: "A) Certo" e "B) Errado".',
    'FGV': 'ESTILO FGV: Foco em interpretação de texto complexa e casos práticos típicos da banca.',
    'VUNESP': 'ESTILO VUNESP: Questões diretas com 5 alternativas.',
    'FCC': 'ESTILO FCC: Questões técnicas e minuciosas.',
  }[bank] || `ESTILO ${bank}: Adapte o estilo das questões para o padrão desta banca.`;

  const topicInstruction = topic ? `\n\nFOCO NO TÓPICO: "${topic}". Gere questões exclusivamente sobre este assunto encontrado no texto do PDF.` : '';

  const unipInstruction = unipMode
    ? `\n\nMODELO UNIP EAD:
    - 10 questões no formato de múltipla escolha (A, B, C, D, E) baseadas NAS ETAPAS E CONTEÚDO DO PDF.
    - Nível MÉDIO a DIFÍCIL, seguindo o padrão acadêmico da UNIP.
    - OBRIGATÓRIO: Use o formato de múltiplas afirmativas (Ex: I, II, III, IV, V) para analisar conceitos do PDF.
    - As opções (A-E) devem selecionar as combinações corretas de afirmativas.
    - A "explanation" DEVE seguir este formato exato:
      Resposta correta: alternativa [LETRA].
      Análise das afirmativas:
      I – [Status]. Justificativa: [Baseado no PDF].
      II – [Status]. Justificativa: [Baseado no PDF].
      ...`
    : '';

  const prompt = `${PROFESSOR_PERSONA}
Gere um simulado de ${numQuestions} questões baseado EXCLUSIVAMENTE no conteúdo do PDF fornecido abaixo.
Dificuldade: ${difficulty}.
Banca Selecionada: ${bank}.${topicInstruction}
${bankInstructions}${unipInstruction}

CONTEÚDO DO PDF:
${pdfText.substring(0, 8000)}

MUITO IMPORTANTE: Retorne APENAS um JSON válido no formato abaixo, sem texto extra:
{
  "questions": [
    {
      "question": "texto da pergunta",
      "options": [
        {"key": "A", "text": "opção"},
        {"key": "B", "text": "opção"},
        {"key": "C", "text": "opção"},
        {"key": "D", "text": "opção"}
      ],
      "correct_answer": "A",
      "explanation": "explicação da resposta"
    }
  ]
}`;

  const text = await callAI({ ...config, prompt });
  const parsed = extractJson(text);
  if (!parsed || !parsed.questions) {
    throw new Error('Falha ao gerar questões baseadas no PDF.');
  }
  return parsed.questions.map((q: any, i: number) => ({
    ...q,
    id: `pdf-q-${Date.now()}-${i}`,
    subject: 'Conteúdo de PDF',
    difficulty,
  }));
};

export const generateFlashcards = async (
  config: any,
  topic: string,
  count: number = 5
): Promise<Flashcard[]> => {
  const prompt = `${PROFESSOR_PERSONA}
Crie ${count} flashcards sobre "${topic}".
Retorne APENAS JSON:
{
  "flashcards": [{"question": "p", "answer": "r"}]
}`;

  const text = await callAI({ ...config, prompt });
  const parsed = extractJson(text);
  if (!parsed || !parsed.flashcards) {
    throw new Error('Falha ao gerar flashcards estruturados.');
  }
  return parsed.flashcards.map((f: any, i: number) => ({
    id: `fc-${Date.now()}-${i}`,
    question: f.question,
    answer: f.answer,
    subject: topic,
    mastered: false,
  }));
};

export const analyzePDFText = async (
  config: any,
  pdfText: string,
  action: 'summary' | 'questions' | 'flashcards' | 'studyplan',
  topic?: string
): Promise<string | QuizQuestion[]> => {
  const topicFocus = topic ? `\n\nFOCO NO TÓPICO: "${topic}". Ignore partes do texto que não sejam relevantes para este tópico.` : '';
  
  const actions = {
    summary: `Faça um resumo didático e estruturado do conteúdo.${topicFocus}`,
    questions: `Gere exatamente 5 questões de múltipla escolha sobre o conteúdo.${topicFocus}
MUITO IMPORTANTE: Retorne APENAS um JSON válido no formato abaixo, sem markdown, sem texto extra:
{
  "questions": [
    {
      "question": "texto da pergunta",
      "options": [
        {"key": "A", "text": "opção"},
        {"key": "B", "text": "opção"},
        {"key": "C", "text": "opção"},
        {"key": "D", "text": "opção"}
      ],
      "correct_answer": "A",
      "explanation": "explicação da resposta"
    }
  ]
}`,
    flashcards: `Crie 8 flashcards de estudo (Pergunta → Resposta) sobre o conteúdo.${topicFocus}`,
    studyplan: `Crie um plano de estudo semanal baseado no conteúdo.${topicFocus}`,
  };
  
  const prompt = `${PROFESSOR_PERSONA}\n\n${actions[action]}:\n\n${pdfText.substring(0, 8000)}`;
  const text = await callAI({ ...config, prompt });

  if (action === 'questions') {
    const parsed = extractJson(text);
    if (parsed && parsed.questions) {
      return parsed.questions.map((q: any, i: number) => ({
        ...q,
        id: `pdf-q-${Date.now()}-${i}`,
        subject: 'Análise de PDF',
        difficulty: 'Média',
      }));
    }
    console.warn('Falha ao extrair JSON estruturado das questões:', text);
  }

  return text;
};

export const getOrganExplanation = async (
  config: any,
  organName: string,
  systemName: string
): Promise<{ name: string; function: string; ai_comment: string }> => {
  const prompt = `${PROFESSOR_PERSONA}
Você está no Laboratório de Anatomia 3D. Explique o seguinte órgão:
Órgão: "${organName}"
Sistema: "${systemName}"

Retorne APENAS um JSON no formato:
{
  "name": "Nome do Órgão",
  "function": "Descrição curta e científica da função principal",
  "ai_comment": "Um comentário didático e inspirador do Senhor Saber (estilo Einstein) sobre este órgão."
}`;

  const text = await callAI({ ...config, prompt });
  const parsed = extractJson(text);
  
  if (parsed && parsed.name) {
    return parsed;
  }
  
  return {
    name: organName,
    function: "Função não disponível no momento.",
    ai_comment: "Ah, a anatomia... um mistério fascinante, não é mesmo? Tente clicar novamente!"
  };
};

export const generateStudyPlan = async (
  config: any,
  subjects: string[],
  weakAreas: string[]
): Promise<string> => {
  const prompt = `${PROFESSOR_PERSONA}
Matérias: ${subjects.join(', ')}
Pontos fracos: ${weakAreas.join(', ')}
Crie um plano de estudos de 2 semanas.`;
  return callAI({ ...config, prompt });
};

export const predictContestPatterns = async (
  config: any,
  pdfText: string,
  banca: string,
  cargo: string
): Promise<OraclePrediction> => {
  const prompt = `${PROFESSOR_PERSONA}
Você é um especialista em concursos públicos e análise estatística de provas.
Analise o seguinte fragmento de edital e o cargo alvo.

CARGO: ${cargo}
BANCA: ${banca}
TEXTO DO EDITAL:
${pdfText.substring(0, 10000)}

Sua tarefa:
1. Identificar as 5 principais disciplinas/tópicos citados no edital que são MAIS RELEVANTES para este cargo específico.
2. Atribuir uma probabilidade de cobrança (0-100) para cada um, baseado no histórico da banca ${banca}.
3. Definir um "Padrão da Banca" (uma frase curta).
4. Calcular um "Score de Previsão" geral (0-100).

Retorne APENAS um JSON no formato:
{
  "score": 85,
  "pattern": "Foco em letra da lei e prazos",
  "probabilities": [
    {"label": "Direito Constitucional (Art. 5º)", "prob": 95, "color": "#ef4444"},
    {"label": "Língua Portuguesa (Crase)", "prob": 88, "color": "#f59e0b"}
  ]
}

Use cores: #ef4444 (alto), #f59e0b (médio), #10b981 (médio-baixo), #3b82f6 (baixo).`;

  const text = await callAI({ ...config, prompt });
  const parsed = extractJson(text);
  
  if (parsed && parsed.probabilities) {
    return parsed;
  }
  
  throw new Error('Falha ao gerar previsão do oráculo.');
};

export const generateSeminarSlides = async (
  config: any,
  pdfText: string,
  mode: 'por_pagina' | 'por_topico' | 'resumo_inteligente' = 'resumo_inteligente',
  style: string = 'educacional',
  presenterName: string = 'Estudante',
  topic?: string
): Promise<Presentation> => {
  const modeInstruction = {
    por_pagina: 'Crie slides seguindo a ordem das páginas do PDF de forma fiel.',
    por_topico: topic ? `Foque especificamente no tópico "${topic}" encontrado no PDF.` : 'Identifique os tópicos mais importantes e crie um slide estruturado para cada um.',
    resumo_inteligente: 'Faça um resumo executivo dos pontos chave em uma sequência lógica e didática.'
  }[mode];

  const topicContext = topic ? `\n\nFOCO PRINCIPAL: O seminário deve ser sobre "${topic}".` : '';

  const prompt = `${PROFESSOR_PERSONA}
Você é um especialista em design de apresentações e didática.
Sua tarefa é transformar o conteúdo do PDF abaixo em uma estrutura de slides para um seminário.
Estilo Visual Solicitado: ${style}.
Modo de Geração: ${modeInstruction}${topicContext}

MUITO IMPORTANTE: Retorne APENAS um JSON válido no formato abaixo:
{
  "title": "Título Geral da Apresentação",
  "slides": [
    {
      "type": "capa",
      "title": "Título do Seminário",
      "subtitle": "Subtítulo ou Tema",
      "presenter": "${presenterName}",
      "date": "${new Date().toLocaleDateString('pt-BR')}"
    },
    {
      "type": "introducao",
      "title": "Introdução",
      "content": "Breve resumo do que será abordado"
    },
    {
      "type": "conteudo",
      "title": "Título do Slide",
      "bullets": ["ponto 1", "ponto 2", "ponto 3"],
      "script": "Roteiro detalhado...",
      "imageQuery": "uma palavra-chave em inglês para buscar uma imagem relacionada ao tema"
    },
    {
      "type": "conclusao",
      "title": "Conclusão",
      "content": "Resumo final...",
      "script": "Roteiro final...",
      "imageQuery": "keyword"
    }
  ]
}

REGRAS:
- No máximo 5 bullet points por slide.
- O campo 'script' deve ser um texto rico, explicando detalhadamente o conteúdo do slide.
- O campo 'imageQuery' deve conter uma ou duas palavras em INGLÊS que representem o visual do slide para busca em bancos de imagens.
- Use emojis relacionados ao tema em cada slide.

CONTEÚDO DO PDF:
${pdfText.substring(0, 10000)}`;

  const text = await callAI({ ...config, prompt });
  const parsed = extractJson(text);
  
  if (parsed && parsed.slides) {
    return {
      id: `pres-${Date.now()}`,
      title: parsed.title,
      slides: parsed.slides,
      style,
      mode
    };
  }
  
  throw new Error('Falha ao gerar estrutura de slides do seminário.');
};
