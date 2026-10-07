import React, { useState } from 'react';
import { X, Minimize2, Move, Volume2 } from 'lucide-react';
import { SubtitleItem } from '../types';

interface DetachedSubtitleWindowProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubtitle: SubtitleItem | null;
  interimOriginal: string;
  interimTranslated: string;
  isProcessing: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  showOriginal: boolean;
  highlightKeywords: boolean;
}

export const DetachedSubtitleWindow: React.FC<DetachedSubtitleWindowProps> = ({
  isOpen,
  onClose,
  currentSubtitle,
  interimOriginal,
  interimTranslated,
  isProcessing,
  fontSize,
  showOriginal,
  highlightKeywords,
}) => {
  const [position, setPosition] = useState({ x: 30, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  const original = interimOriginal || currentSubtitle?.originalText || '';
  const translated = interimTranslated || currentSubtitle?.translatedText || '';
  const sourceLang = currentSubtitle?.sourceLanguage || 'Auto';
  const targetLang = currentSubtitle?.targetLanguage || 'Target';

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 350, e.clientX - dragOffset.x)),
      y: Math.max(10, Math.min(window.innerHeight - 150, e.clientY - dragOffset.y)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const fontSizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }[fontSize];

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 w-96 sm:w-[480px] bg-black/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.9)] overflow-hidden transition-shadow"
    >
      {/* Draggable Titlebar */}
      <div
        onMouseDown={handleMouseDown}
        className="px-3.5 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-[#4cd7f6]" />
          <span className="font-telemetry text-[11px] font-semibold tracking-wider text-[#d4e4fa] uppercase">
            PIP Subtitle Overlay
          </span>
          <span className="font-telemetry text-[10px] text-[#94a3b8] px-1 rounded bg-white/10">
            {sourceLang} → {targetLang}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isProcessing && (
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping mr-1" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-white/10"
            title="Dock back to main stage"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtitle Content Display */}
      <div className="p-4 flex flex-col items-center text-center space-y-1.5">
        {showOriginal && (
          <p className="font-subtitle text-xs text-[#94a3b8] leading-tight select-text">
            {original || 'Listening for speech in stream...'}
          </p>
        )}

        <p className={`font-subtitle ${fontSizeClass} font-semibold text-[#f8fafc] leading-snug subtitle-shadow select-text`}>
          {translated || (
            <span className="text-[#64748b] text-sm font-normal italic">
              Live translation appears here...
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
