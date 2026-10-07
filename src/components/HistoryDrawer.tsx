import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Download, 
  Copy, 
  Check, 
  Volume2, 
  Trash2, 
  Clock, 
  FileText, 
  FileCode,
  ArrowRight
} from 'lucide-react';
import { SubtitleItem } from '../types';
import { exportToSRT, exportToVTT, exportToTXT } from '../lib/languages';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  onClear: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  subtitles,
  onClear,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportFormatOpen, setExportFormatOpen] = useState(false);

  // Filter subtitles by search query
  const filteredSubtitles = useMemo(() => {
    if (!searchQuery.trim()) return subtitles;
    const query = searchQuery.toLowerCase();
    return subtitles.filter(
      (item) =>
        item.originalText.toLowerCase().includes(query) ||
        item.translatedText.toLowerCase().includes(query) ||
        item.formattedTime.toLowerCase().includes(query)
    );
  }, [subtitles, searchQuery]);

  // Copy handler
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Replay speech with Web Speech API
  const handleSpeak = (text: string, langName: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Export handlers
  const handleDownload = (format: 'srt' | 'vtt' | 'txt' | 'json') => {
    let content = '';
    let mimeType = 'text/plain';
    let ext = format;

    if (format === 'srt') {
      content = exportToSRT(subtitles);
      mimeType = 'application/x-subrip';
    } else if (format === 'vtt') {
      content = exportToVTT(subtitles);
      mimeType = 'text/vtt';
    } else if (format === 'txt') {
      content = exportToTXT(subtitles);
    } else if (format === 'json') {
      content = JSON.stringify(subtitles, null, 2);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sublive-transcript-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    setExportFormatOpen(false);
  };

  return (
    <aside
      className={`fixed top-16 bottom-0 right-0 z-30 w-full sm:w-80 md:w-96 lg:w-[340px] bg-[#090a0f] border-l border-[#1f2438] flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-[#1f2438] flex items-center justify-between bg-[#131620]/60">
        <div>
          <h2 className="text-sm font-semibold text-[#f8fafc] flex items-center gap-2">
            <span>Session History</span>
            <span className="font-telemetry text-[11px] px-1.5 py-0.5 rounded bg-[#1c2b3c] text-[#4cd7f6] border border-[#1f2438]">
              {subtitles.length}
            </span>
          </h2>
          <p className="text-[11px] text-[#64748b]">Real-time dialogue records</p>
        </div>

        <div className="flex items-center gap-1">
          {/* Export dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={subtitles.length === 0}
              onClick={() => setExportFormatOpen(!exportFormatOpen)}
              className="p-1.5 rounded-md bg-[#131620] hover:bg-[#1c2b3c] border border-[#1f2438] text-[#94a3b8] hover:text-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Export subtitles"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {exportFormatOpen && (
              <div className="absolute right-0 mt-1 w-36 py-1 bg-[#131620] border border-[#1f2438] rounded-lg shadow-2xl z-50">
                <button
                  type="button"
                  onClick={() => handleDownload('srt')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#d4e4fa] hover:bg-[#1c2b3c] flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#06b6d4]" />
                  <span>SRT Subtitles</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('vtt')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#d4e4fa] hover:bg-[#1c2b3c] flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#f59e0b]" />
                  <span>VTT Subtitles</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('txt')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#d4e4fa] hover:bg-[#1c2b3c] flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>Plain Text (TXT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('json')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#d4e4fa] hover:bg-[#1c2b3c] flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <span>Raw JSON</span>
                </button>
              </div>
            )}
          </div>

          {/* Clear button */}
          <button
            type="button"
            disabled={subtitles.length === 0}
            onClick={onClear}
            className="p-1.5 rounded-md bg-[#131620] hover:bg-[#ef4444]/20 border border-[#1f2438] hover:border-[#ef4444]/40 text-[#94a3b8] hover:text-[#ef4444] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Clear all history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close drawer on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md bg-[#131620] hover:bg-[#1c2b3c] border border-[#1f2438] text-[#94a3b8] hover:text-[#f8fafc] lg:hidden transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-[#1f2438] bg-[#090a0f]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#131620] border border-[#1f2438] rounded-md text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#06b6d4] transition-colors"
          />
        </div>
      </div>

      {/* Scrollable Dialogue Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredSubtitles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748b]">
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-medium text-[#94a3b8]">No subtitles recorded yet</p>
            <p className="text-[11px] mt-1 text-[#64748b]">
              Spoken dialogue and translations will automatically log here in real-time.
            </p>
          </div>
        ) : (
          filteredSubtitles.map((item) => (
            <div
              key={item.id}
              className="group p-3 rounded-lg bg-[#131620] border border-[#1f2438] hover:border-[#06b6d4] transition-all duration-150 flex flex-col gap-2"
            >
              {/* Card Meta Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-telemetry text-[10px]">
                  <span className="text-[#64748b]">{item.formattedTime}</span>
                  <span className="text-[#3d494c]">·</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1c2b3c] text-[#4cd7f6] uppercase font-medium">
                    {item.sourceLanguage.slice(0, 2)} → {item.targetLanguage.slice(0, 2)}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleSpeak(item.translatedText, item.targetLanguage)}
                    className="p-1 rounded text-[#94a3b8] hover:text-[#4cd7f6] hover:bg-[#1c2b3c]"
                    title="Speak translated text"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.translatedText)}
                    className="p-1 rounded text-[#94a3b8] hover:text-[#4cd7f6] hover:bg-[#1c2b3c]"
                    title="Copy translation"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3 h-3 text-[#10b981]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Line 1: Original Speech */}
              {item.originalText && (
                <p className="font-subtitle text-xs text-[#94a3b8] leading-relaxed">
                  {item.originalText}
                </p>
              )}

              {/* Line 2: Translated Speech */}
              <p className="font-subtitle text-xs font-medium text-[#f8fafc] leading-relaxed">
                {item.translatedText}
              </p>

              {/* Latency chip */}
              <div className="flex items-center justify-between text-[10px] font-telemetry text-[#64748b] pt-1 border-t border-[#1f2438]/60">
                <span>roundtrip</span>
                <span className="text-[#10b981]">{item.latencyMs}ms</span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
