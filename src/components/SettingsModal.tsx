import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Cpu, 
  Sliders, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  hasServerKey: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  hasServerKey,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    setFormData({
      ...formData,
      modelName: 'gemini-2.5-flash',
      timesliceMs: 1800,
      silenceThresholdDb: -48,
      fontSize: 'md',
      position: 'bottom',
      showOriginal: true,
      highlightKeywords: true,
      enableVAD: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div 
        className="w-full max-w-xl bg-[#090a0f] border border-[#1f2438] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1f2438] flex items-center justify-between bg-[#131620]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#06b6d4]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f8fafc]">Engine & Subtitle Settings</h2>
              <p className="text-xs text-[#64748b]">Configure Gemini models, pipeline latency, and display preferences</p>
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* API Key Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#06b6d4]" />
                <span>Google AI Studio API Key (BYOK)</span>
              </label>
              {hasServerKey ? (
                <span className="flex items-center gap-1 text-[11px] font-telemetry text-[#10b981]">
                  <CheckCircle className="w-3 h-3" />
                  <span>Server Environment Key Active</span>
                </span>
              ) : (
                <span className="text-[11px] font-telemetry text-[#f59e0b]">
                  Optional BYOK override
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder={hasServerKey ? 'Using server key (or enter custom key here)' : 'AIzaSy...'}
                className="w-full px-3.5 py-2.5 pr-10 bg-[#131620] border border-[#1f2438] rounded-lg text-xs font-mono text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#06b6d4]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#f8fafc]"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#64748b] leading-relaxed">
              If provided, your personal key is stored only in your browser's local storage and used directly for audio translation.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#06b6d4]" />
              <span>Target Gemini Model</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setFormData({ ...formData, modelName: 'gemini-2.5-flash' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.modelName === 'gemini-2.5-flash'
                    ? 'bg-[#1c2b3c] border-[#06b6d4] shadow-md shadow-[#06b6d4]/10'
                    : 'bg-[#131620] border-[#1f2438] hover:border-[#3d494c]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#f8fafc]">gemini-2.5-flash</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                    FASTEST
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8] leading-tight">
                  Lowest roundtrip latency, ideal for real-time speech and subtitle pacing.
                </p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, modelName: 'gemini-3.8-flash' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.modelName === 'gemini-3.8-flash'
                    ? 'bg-[#1c2b3c] border-[#06b6d4] shadow-md shadow-[#06b6d4]/10'
                    : 'bg-[#131620] border-[#1f2438] hover:border-[#3d494c]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#f8fafc]">gemini-3.8-flash</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#06b6d4]/20 text-[#4cd7f6] border border-[#06b6d4]/30">
                    BALANCED
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8] leading-tight">
                  Deep linguistic reasoning and idioms, with rapid flash-grade performance.
                </p>
              </div>
            </div>
          </div>

          {/* Audio Timeslice & VAD Pipeline Settings */}
          <div className="space-y-4 pt-2 border-t border-[#1f2438]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                  Audio Timeslice Interval
                </h3>
                <p className="text-[11px] text-[#64748b]">
                  Duration of audio chunks sent for translation ({formData.timesliceMs}ms)
                </p>
              </div>
              <span className="font-telemetry text-xs font-bold text-[#4cd7f6]">
                {(formData.timesliceMs / 1000).toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min={1200}
              max={3000}
              step={200}
              value={formData.timesliceMs}
              onChange={(e) => setFormData({ ...formData, timesliceMs: Number(e.target.value) })}
              className="w-full accent-[#06b6d4] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-telemetry text-[#64748b]">
              <span>1.2s (Fast pacing)</span>
              <span>1.8s (Optimal)</span>
              <span>3.0s (Full sentences)</span>
            </div>
          </div>

          {/* Silence Threshold & Voice Activity Detection */}
          <div className="space-y-3 pt-2 border-t border-[#1f2438]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                  Voice Activity Detection (VAD)
                </h3>
                <p className="text-[11px] text-[#64748b]">
                  Skip sending audio during silence to reduce network calls
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableVAD}
                  onChange={(e) => setFormData({ ...formData, enableVAD: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#131620] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#06b6d4]"></div>
              </label>
            </div>

            {formData.enableVAD && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#94a3b8]">Silence Gate Threshold:</span>
                  <span className="font-telemetry text-[#f59e0b] font-medium">{formData.silenceThresholdDb} dB</span>
                </div>
                <input
                  type="range"
                  min={-65}
                  max={-30}
                  step={1}
                  value={formData.silenceThresholdDb}
                  onChange={(e) => setFormData({ ...formData, silenceThresholdDb: Number(e.target.value) })}
                  className="w-full accent-[#f59e0b] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Subtitle Display Options */}
          <div className="space-y-3 pt-2 border-t border-[#1f2438]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
              Subtitle Visual Preferences
            </h3>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-[#d4e4fa]">Show Original Speech Line (Line 1)</span>
              <input
                type="checkbox"
                checked={formData.showOriginal}
                onChange={(e) => setFormData({ ...formData, showOriginal: e.target.checked })}
                className="accent-[#06b6d4] w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-[#d4e4fa]">Highlight Important Keywords in Amber Gold</span>
              <input
                type="checkbox"
                checked={formData.highlightKeywords}
                onChange={(e) => setFormData({ ...formData, highlightKeywords: e.target.checked })}
                className="accent-[#06b6d4] w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#1f2438] bg-[#131620]/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-lg border border-[#1f2438] hover:border-[#3d494c] text-xs text-[#94a3b8] hover:text-[#f8fafc] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#1f2438] text-xs font-medium text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg bg-[#06b6d4] hover:bg-[#4cd7f6] text-[#090a0f] text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#06b6d4]/20 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved!' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
