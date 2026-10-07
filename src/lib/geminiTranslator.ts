import { TranslationResponse } from '../types';

export interface TranslateAudioParams {
  audioBase64: string;
  mimeType?: string;
  targetLanguage: string;
  modelName?: string;
  apiKey?: string;
  context?: string;
}

/**
 * Calls the server-side Gemini audio translation endpoint
 */
export async function translateAudioChunk({
  audioBase64,
  mimeType = 'audio/webm',
  targetLanguage = 'Spanish',
  modelName = 'gemini-2.5-flash',
  apiKey,
  context,
}: TranslateAudioParams): Promise<TranslationResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim() !== '') {
    headers['x-gemini-api-key'] = apiKey.trim();
  }

  const response = await fetch('/api/translate-audio', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      audioBase64,
      mimeType,
      targetLanguage,
      modelName,
      context,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || `Translation request failed with status ${response.status}`);
  }

  return data as TranslationResponse;
}

/**
 * Checks server status and key availability
 */
export async function checkServerStatus(): Promise<{ hasServerKey: boolean; recommendedModel: string }> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) return { hasServerKey: false, recommendedModel: 'gemini-2.5-flash' };
    const data = await res.json();
    return {
      hasServerKey: Boolean(data.hasServerKey),
      recommendedModel: data.recommendedModel || 'gemini-2.5-flash',
    };
  } catch (err) {
    return { hasServerKey: false, recommendedModel: 'gemini-2.5-flash' };
  }
}

/**
 * Interactive simulated translation chunks for demonstration or testing without active mic
 */
const SAMPLE_SIMULATIONS = [
  {
    original: "Welcome to today's keynote on artificial intelligence and real-time streaming.",
    lang: "English",
    translations: {
      Spanish: "Bienvenidos a la conferencia de hoy sobre inteligencia artificial y transmisión en tiempo real.",
      Japanese: "人工知能とリアルタイムストリーミングに関する基調講演へようこそ。",
      French: "Bienvenue à la conférence d'aujourd'hui sur l'intelligence artificielle et le streaming en temps réel.",
      German: "Willkommen zur heutigen Keynote über künstliche Intelligenz und Echtzeit-Streaming.",
      Hindi: "आर्टिफिशियल इंटेलिजेंस और रियल-टाइम स्ट्रीमिंग पर आज के मुख्य भाषण में आपका स्वागत है।",
      Chinese: "欢迎来到今天关于人工智能和实时流媒体的主题演讲。",
    }
  },
  {
    original: "We have reduced the translation latency down to less than one hundred and fifty milliseconds.",
    lang: "English",
    translations: {
      Spanish: "Hemos reducido la latencia de traducción a menos de ciento cincuenta milisegundos.",
      Japanese: "翻訳レイテンシを150ミリ秒未満にまで短縮しました。",
      French: "Nous avons réduit la latence de traduction à moins de cent cinquante millisecondes.",
      German: "Wir haben die Übersetzungslatenz auf unter einhundertfünfzig Millisekunden gesenkt.",
      Hindi: "हमने अनुवाद विलंबता को घटाकर एक सौ पचास मिलीसेकंड से भी कम कर दिया है।",
      Chinese: "我们已将翻译延迟降低至不到一百五十毫秒。",
    }
  },
  {
    original: "The dual-track subtitles automatically align both original speech and target localization.",
    lang: "English",
    translations: {
      Spanish: "Los subtítulos de doble pista alinean automáticamente el discurso original y la localización de destino.",
      Japanese: "デュアルトラック字幕により、元の音声とターゲット言語のローカライズが自動的に同期されます。",
      French: "Les sous-titres à double piste alignent automatiquement la parole d'origine et la localisation cible.",
      German: "Die zweispurigen Untertitel synchronisieren automatisch die Originalsprache und die Ziellokalisation.",
      Hindi: "दोहरी-ट्रैक उपशीर्षक मूल भाषण और लक्षित स्थानीयकरण दोनों को स्वचालित रूप से संरेखित करते हैं।",
      Chinese: "双轨字幕会自动对齐原始语音和目标本地化内容。",
    }
  },
  {
    original: "Let's observe how seamlessly the tab audio stream is captured from the browser.",
    lang: "English",
    translations: {
      Spanish: "Observemos con qué fluidez se captura el flujo de audio de la pestaña del navegador.",
      Japanese: "ブラウザからタブの音声ストリームがどれほどシームレスにキャプチャされるかをご覧ください。",
      French: "Observons avec quelle fluidité le flux audio de l'onglet est capturé depuis le navigateur.",
      German: "Lassen Sie uns beobachten, wie nahtlos der Tab-Audiostream aus dem Browser erfasst wird.",
      Hindi: "आइए देखें कि ब्राउज़र से टैब ऑडियो स्ट्रीम कितनी सहजता से कैप्चर होती है।",
      Chinese: "让我们来看看如何从浏览器中无缝捕获标签页音频流。",
    }
  }
];

let sampleIndex = 0;

export function getNextSampleTranslation(targetLanguage: string): { original: string; lang: string; translated: string; latency: number } {
  const item = SAMPLE_SIMULATIONS[sampleIndex % SAMPLE_SIMULATIONS.length];
  sampleIndex++;
  const translated = (item.translations as any)[targetLanguage] || `[${targetLanguage}] ${item.original}`;
  const latency = Math.floor(130 + Math.random() * 55); // 130ms - 185ms
  return {
    original: item.original,
    lang: item.lang,
    translated,
    latency,
  };
}
