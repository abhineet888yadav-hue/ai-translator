import React from 'react';
import { 
  Sparkles, 
  Mic, 
  Laptop, 
  Settings, 
  ExternalLink, 
  Trash2, 
  Download, 
  Volume2, 
  HelpCircle,
  Activity,
  Layers
} from 'lucide-react';
import { AudioSourceType, PipelineStatus } from '../types';
import { POPULAR_LANGUAGES } from '../lib/languages';

interface HeaderProps {
  sourceType: AudioSourceType;
  onSourceChange: (source: AudioSourceType) => void;
  targetLanguage: string;
  onTargetLanguageChange: (lang: string) => void;
  status: PipelineStatus;
  lastLatencyMs: number;
  subtitleCount: number;
  isDetached: boolean;
  onToggleDetach: () => void;
  onOpenSettings: () => void;
  onOpenTabHelp: () => void;
  onClearHistory: () => void;
  onExport: (format: 'srt' | 'vtt' | 'txt') => void;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sourceType,
  onSourceChange,
  targetLanguage,
  onTargetLanguageChange,
  status,
  lastLatencyMs,
  subtitleCount,
  isDetached,
  onToggleDetach,
  onOpenSettings,
  onOpenTabHelp,
  onClearHistory,
  onExport,
  isHistoryOpen,
  onToggleHistory,
}) => {
  const currentLangObj = POPULAR_LANGUAGES.find((l) => l.name === targetLanguage) || POPULAR_LANGUAGES[0];

  return (
    <header className="h-16 px-4 md:px-6 bg-[#090a0f]/90 backdrop-blur-md border-b border-[#1f2438] flex items-center justify-between sticky top-0 z-40">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#06b6d4]/20 to-[#131620] border border-[#06b6d4]/40 text-[#4cd7f6] shadow-sm">
          <Sparkles className="w-5 h-5 text-[#4cd7f6]" />
          {status === 'listening' || status === 'processing' ? (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10b981]"></span>
            </span>
          ) : null}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-base tracking-tight text-[#f8fafc] flex items-center gap-1.5">
              SubLive <span className="text-[#06b6d4] font-medium text-xs px-1.5 py-0.5 rounded bg-[#06b6d4]/10 border border-[#06b6d4]/20">AI</span>
            </h1>
            <span className="hidden sm:inline-block text-[11px] font-mono text-[#94a3b8] px-2 py-0.5 rounded bg-[#131620] border border-[#1f2438]">
              GEMINI 2.5 FLASH
            </span>
          </div>
          <p className="text-[11px] text-[#64748b] hidden md:block">
            Low-Latency Bilingual Subtitle Translator
          </p>
        </div>
      </div>

      {/* Middle Controls: Source Switcher & Target Language */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Source Segmented Switcher */}
        <div className="flex items-center p-1 bg-[#131620] border border-[#1f2438] rounded-lg">
          <button
            type="button"
            onClick={() => onSourceChange('mic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              sourceType === 'mic'
                ? 'bg-[#1c2b3c] text-[#4cd7f6] shadow-sm border border-[#06b6d4]/30'
                : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
            title="Translate directly from your microphone"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Microphone</span>
            <span className="sm:hidden">Mic</span>
          </button>

          <button
            type="button"
            onClick={() => onSourceChange('tab')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              sourceType === 'tab'
                ? 'bg-[#1c2b3c] text-[#4cd7f6] shadow-sm border border-[#06b6d4]/30'
                : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
            title="Translate tab audio from YouTube, Zoom, or online meetings"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tab Audio</span>
            <span className="sm:hidden">Tab</span>
          </button>
        </div>

        {sourceType === 'tab' && (
          <button
            type="button"
            onClick={onOpenTabHelp}
            className="hidden lg:flex items-center gap-1 text-[11px] text-[#64748b] hover:text-[#4cd7f6] transition-colors"
            title="How to share tab audio"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tab Audio Guide</span>
          </button>
        )}

        {/* Target Language Dropdown */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#131620] border border-[#1f2438] rounded-lg hover:border-[#06b6d4]/50 transition-colors">
            <span className="text-sm">{currentLangObj.flag}</span>
            <select
              value={targetLanguage}
              onChange={(e) => onTargetLanguageChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#f8fafc] focus:outline-none cursor-pointer pr-1"
            >
              {POPULAR_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name} className="bg-[#131620] text-[#f8fafc]">
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Right Controls: Telemetry, History, Detach, Settings */}
      <div className="flex items-center gap-2">
        {/* Real-time Telemetry Chip */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-[#131620] border border-[#1f2438] rounded-md font-telemetry text-[11px]">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'listening'
                  ? 'bg-[#10b981] animate-pulse'
                  : status === 'processing'
                  ? 'bg-[#06b6d4] animate-pulse'
                  : status === 'error'
                  ? 'bg-[#ef4444]'
                  : 'bg-[#64748b]'
              }`}
            />
            <span className="uppercase text-[#94a3b8]">{status}</span>
          </span>
          <span className="text-[#3d494c]">|</span>
          <span className="text-[#4cd7f6] font-medium">
            {lastLatencyMs > 0 ? `${lastLatencyMs}ms` : '-- ms'}
          </span>
        </div>

        {/* Detach Popout Subtitle Window */}
        <button
          type="button"
          onClick={onToggleDetach}
          className={`p-2 rounded-lg border transition-colors ${
            isDetached
              ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#4cd7f6]'
              : 'bg-[#131620] border-[#1f2438] text-[#94a3b8] hover:text-[#f8fafc] hover:border-[#3d494c]'
          }`}
          title={isDetached ? 'Dock subtitles back to monitor' : 'Detach floating subtitle window'}
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* History Toggle for Mobile / Tablet */}
        <button
          type="button"
          onClick={onToggleHistory}
          className={`relative p-2 rounded-lg border transition-colors ${
            isHistoryOpen
              ? 'bg-[#1c2b3c] border-[#06b6d4]/40 text-[#4cd7f6]'
              : 'bg-[#131620] border-[#1f2438] text-[#94a3b8] hover:text-[#f8fafc]'
          }`}
          title="Toggle history drawer"
        >
          <Layers className="w-4 h-4" />
          {subtitleCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#06b6d4] text-[9px] font-bold text-[#090a0f]">
              {subtitleCount > 99 ? '99+' : subtitleCount}
            </span>
          )}
        </button>

        {/* Settings Modal Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 bg-[#131620] border border-[#1f2438] text-[#94a3b8] hover:text-[#f8fafc] hover:border-[#3d494c] rounded-lg transition-colors"
          title="Settings & API Key"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
