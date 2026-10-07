import React from 'react';
import { SubtitleItem } from '../types';

interface DualTrackSubtitlesProps {
  currentSubtitle: SubtitleItem | null;
  interimOriginal: string;
  interimTranslated: string;
  isProcessing: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  showOriginal?: boolean;
  highlightKeywords?: boolean;
  position?: 'bottom' | 'center' | 'top';
}

export const DualTrackSubtitles: React.FC<DualTrackSubtitlesProps> = ({
  currentSubtitle,
  interimOriginal,
  interimTranslated,
  isProcessing,
  fontSize = 'md',
  showOriginal = true,
  highlightKeywords = true,
  position = 'bottom',
}) => {
  const original = interimOriginal || currentSubtitle?.originalText || '';
  const translated = interimTranslated || currentSubtitle?.translatedText || '';
  const sourceLang = currentSubtitle?.sourceLanguage || 'Auto';
  const targetLang = currentSubtitle?.targetLanguage || 'ES';

  if (!original && !translated) {
    return null;
  }

  // Font size styling
  const fontSizeConfig = {
    sm: {
      original: 'text-xs md:text-sm',
      translated: 'text-base md:text-lg',
      padding: 'py-2.5 px-5',
    },
    md: {
      original: 'text-sm md:text-base',
      translated: 'text-lg md:text-xl',
      padding: 'py-3.5 px-6',
    },
    lg: {
      original: 'text-base md:text-lg',
      translated: 'text-xl md:text-2xl',
      padding: 'py-4 px-8',
    },
  }[fontSize];

  // Optional highlight of words in translated text (numbers, dates, proper nouns)
  const renderHighlightedTranslated = (text: string) => {
    if (!highlightKeywords) return text;

    // Detect numeric, capitalized words, or technical terms to softly tint Amber (#f59e0b)
    const tokens = text.split(/(\s+)/);
    return tokens.map((part, index) => {
      const isImportant = /\b([0-9]+|AI|Google|Gemini|API|Keynote|Web|Audio)\b/i.test(part);
      if (isImportant) {
        return (
          <span key={index} className="text-[#f59e0b] font-bold">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const positionClasses = {
    bottom: 'bottom-8 md:bottom-12 inset-x-4 md:inset-x-12',
    center: 'top-1/2 -translate-y-1/2 inset-x-4 md:inset-x-12',
    top: 'top-8 md:top-12 inset-x-4 md:inset-x-12',
  }[position];

  return (
    <div className={`absolute ${positionClasses} flex justify-center z-30 pointer-events-none transition-all duration-300`}>
      <div className={`max-w-4xl w-auto ${fontSizeConfig.padding} rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex flex-col items-center text-center transition-all duration-200 pointer-events-auto`}>
        {/* Source metadata pill */}
        <div className="flex items-center gap-2 mb-1.5 opacity-75">
          <span className="font-telemetry text-[10px] tracking-wider uppercase text-[#4cd7f6] bg-[#06b6d4]/15 px-1.5 py-0.5 rounded border border-[#06b6d4]/30">
            {sourceLang} → {targetLang}
          </span>
          {isProcessing && (
            <span className="flex items-center gap-1 font-telemetry text-[10px] text-[#f59e0b]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-ping" />
              translating...
            </span>
          )}
        </div>

        {/* Line 1: Original Spoken Speech */}
        {showOriginal && original && (
          <p
            className={`font-subtitle ${fontSizeConfig.original} text-[#94a3b8] leading-snug mb-1 font-normal select-text transition-opacity ${
              isProcessing ? 'italic opacity-90' : 'opacity-85'
            }`}
          >
            {original}
          </p>
        )}

        {/* Line 2: Translated Output */}
        {translated && (
          <p
            className={`font-subtitle ${fontSizeConfig.translated} text-[#f8fafc] font-semibold leading-normal subtitle-shadow tracking-tight select-text`}
          >
            {renderHighlightedTranslated(translated)}
          </p>
        )}
      </div>
    </div>
  );
};
