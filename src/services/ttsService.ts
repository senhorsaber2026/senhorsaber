/**
 * TTS Service - Gestão centralizada de síntese de voz (Senhor Saber)
 */

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Procura por uma voz masculina em português
 */
const getBestMalePortugueseVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  // Prioridades: 1. Masculina PT-BR, 2. Google PT-BR, 3. Qualquer PT-BR
  return (
    voices.find(v => v.lang.includes('pt-BR') && v.name.toLowerCase().includes('male')) ||
    voices.find(v => v.lang.includes('pt-BR') && v.name.toLowerCase().includes('google')) ||
    voices.find(v => v.lang.includes('pt-BR')) ||
    voices.find(v => v.lang.includes('pt'))
  );
};

export const senhorSaberSpeak = (
  text: string, 
  options: { onStart?: () => void; onEnd?: () => void } = {}
) => {
  if (!('speechSynthesis' in window)) return;

  // Cancela falas anteriores
  window.speechSynthesis.cancel();

  // Criamos a utterance e guardamos em uma variável fora do escopo da função
  // para evitar que o Garbage Collector a limpe no meio da fala (causador de cortes)
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = 'pt-BR';
  
  // Configurações de "Senhor Sábio"
  currentUtterance.rate = 0.85; // Um pouco mais lento e didático
  currentUtterance.pitch = 0.6; // Mais grave
  
  const voice = getBestMalePortugueseVoice();
  if (voice) {
    currentUtterance.voice = voice;
  }

  currentUtterance.onstart = () => {
    if (options.onStart) options.onStart();
  };

  currentUtterance.onend = () => {
    if (options.onEnd) options.onEnd();
    currentUtterance = null;
  };

  currentUtterance.onerror = (event) => {
    console.error('Erro no TTS:', event);
    if (options.onEnd) options.onEnd();
    currentUtterance = null;
  };

  // Garante que as vozes foram carregadas (alguns browsers precisam disso)
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      currentUtterance!.voice = getBestMalePortugueseVoice() || null;
      window.speechSynthesis.speak(currentUtterance!);
    };
  } else {
    window.speechSynthesis.speak(currentUtterance);
  }
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};
