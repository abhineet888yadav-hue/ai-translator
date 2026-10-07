export type AudioSourceType = 'mic' | 'tab';

export type PipelineStatus = 'idle' | 'listening' | 'processing' | 'paused' | 'error';

export interface SubtitleItem {
  id: string;
  timestamp: number;
  formattedTime: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  latencyMs: number;
  isInterim?: boolean;
}

export interface TranslationResponse {
  success: boolean;
  original_transcript: string;
  detected_language: string;
  translated_text: string;
  latency_ms: number;
  model: string;
  timestamp: number;
  error?: string;
}

export interface AppSettings {
  apiKey: string;
  modelName: string;
  targetLanguage: string;
  timesliceMs: number;
  silenceThresholdDb: number; // e.g. -45 dB
  fontSize: 'sm' | 'md' | 'lg'; // 14px, 18px, 24px
  position: 'bottom' | 'center' | 'top';
  showOriginal: boolean;
  highlightKeywords: boolean;
  autoScrollHistory: boolean;
  enableVAD: boolean; // Voice activity detection to skip silence
}

export interface AudioTelemetry {
  currentDb: number;
  volumePercent: number;
  isSpeaking: boolean;
  activeChunkDurationMs: number;
  totalChunksProcessed: number;
  avgLatencyMs: number;
  lastLatencyMs: number;
  sampleRate: number;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}
