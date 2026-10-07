import React from 'react';
import { X, Check, Laptop, Volume2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TabAudioHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TabAudioHelpModal: React.FC<TabAudioHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="w-full max-w-lg bg-[#090a0f] border border-[#1f2438] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f2438] flex items-center justify-between bg-[#131620]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#06b6d4]">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f8fafc]">How to Translate Tab Audio</h2>
              <p className="text-xs text-[#64748b]">Follow these quick steps to capture YouTube, Zoom, or video audio</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1c2b3c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#06b6d4] text-[#090a0f] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#f8fafc]">Select "Tab Audio"</h4>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Switch the audio source toggle at the top of SubLive AI to <strong>Tab Audio</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#06b6d4] text-[#090a0f] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#f8fafc]">Click "Start Live Subtitles"</h4>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                A browser dialog will appear asking which tab, window, or screen you want to share.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#f59e0b] text-[#090a0f] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#f8fafc] flex items-center gap-1.5">
                <span>Crucial: Check "Also share tab audio"</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#f59e0b]/20 text-[#f59e0b]">Important</span>
              </h4>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                In Chrome / Edge, select the <strong>Chrome Tab</strong> tab in the dialog and verify the <strong>"Also share tab audio"</strong> checkbox in the bottom left is checked.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#131620] border border-[#1f2438] flex items-start gap-2.5 text-xs text-[#94a3b8]">
            <Volume2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
            <p>
              Once connected, any dialogue from videos, foreign news streams, or meetings will be continuously translated in real-time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#1f2438] bg-[#131620]/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#090a0f] text-xs font-semibold transition-colors"
          >
            Got it, Let's Translate
          </button>
        </div>
      </div>
    </div>
  );
};
