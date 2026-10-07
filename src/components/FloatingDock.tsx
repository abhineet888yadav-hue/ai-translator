import React from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  Mic, 
  MicOff, 
  Type, 
  Sparkles, 
  Move,
  Volume2
} from 'lucide-react';
import { AudioTelemetry, PipelineStatus } from '../types';

interface FloatingDockProps {
  isActive: boolean;
  isPaused: boolean;
  status: PipelineStatus;
  telemetry: AudioTelemetry;
  fontSize: 'sm' | 'md' | 'lg';
  position: 'bottom' | 'center' | 'top';
  onToggleActive: () => void;
  onTogglePause: () => void;
  onChangeFontSize: (size: 'sm' | 'md' | 'lg') => void;
  onChangePosition: (pos: 'bottom' | 'center' | 'top') => void;
  onSimulateSample: () => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  isActive,
  isPaused,
  status,
  telemetry,
  fontSize,
  position,
  onToggleActive,
  onTogglePause,
  onChangeFontSize,
  onChangePosition,
  onSimulateSample,
}) => {
  // Calculate how many of the 8 VU bars should be active
  // volumePercent is 0 - 100
  const activeBars = isActive && !isPaused
    ? Math.min(8, Math.max(1, Math.round((telemetry.volumePercent / 100) * 8)))
    : 0;

  return (
    <div className="flex justify-center w-full px-4 mb-4 z-30">
      <div className="flex items-center gap-2.5 sm:gap-4 px-4 sm:px-6 py-2.5 bg-[#131620]/85 backdrop-blur-2xl border border-[#1f2438] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all">
        {/* Main Capture CTA Button */}
        <button
          type="button"
          onClick={onToggleActive}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm tracking-tight transition-all duration-200 cursor-pointer ${
            isActive
              ? 'bg-[#ef4444]/15 border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/25 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
              : 'bg-[#06b6d4] text-[#090a0f] hover:bg-[#4cd7f6] shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(76,215,246,0.6)]'
          }`}
        >
          {isActive ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Capturing</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Live Subtitles</span>
            </>
          )}
        </button>

        {/* Pause / Resume Button (when active) */}
        {isActive && (
          <button
            type="button"
            onClick={onTogglePause}
            className={`p-2.5 rounded-full border transition-colors ${
              isPaused
                ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]'
                : 'bg-[#1c2b3c] border-[#1f2438] text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
            title={isPaused ? 'Resume listening' : 'Pause audio processing'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        )}

        {/* Integrated 8-Bar Audio VU Meter */}
        <div 
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#090a0f]/80 border border-[#1f2438]"
          title={`Audio Level: ${telemetry.currentDb} dB`}
        >
          <div className="flex items-end gap-0.5 h-4 w-14">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((barIndex) => {
              const isLit = barIndex <= activeBars;
              // Color gradient: emerald (1-5), amber (6-7), red (8)
              let barColor = 'bg-[#1f2438]';
              if (isLit) {
                if (barIndex <= 5) barColor = 'bg-[#10b981] shadow-[0_0_6px_#10b981]';
                else if (barIndex <= 7) barColor = 'bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]';
                else barColor = 'bg-[#ef4444] shadow-[0_0_8px_#ef4444]';
              }
              const heightPercent = 25 + (barIndex / 8) * 75;

              return (
                <div
                  key={barIndex}
                  className={`w-1 rounded-xs transition-all duration-75 ${barColor}`}
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>
          <span className="font-telemetry text-[10px] text-[#94a3b8] w-7 text-right">
            {isActive ? (telemetry.currentDb > -90 ? `${telemetry.currentDb}` : '-∞') : '00'}
          </span>
        </div>

        {/* Subtitle Font Size Stepper */}
        <div className="hidden sm:flex items-center p-1 bg-[#090a0f]/80 border border-[#1f2438] rounded-full">
          <button
            type="button"
            onClick={() => onChangeFontSize('sm')}
            className={`px-2 py-1 text-[11px] font-medium rounded-full transition-colors ${
              fontSize === 'sm' ? 'bg-[#06b6d4] text-[#090a0f] font-semibold' : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
            title="Small Subtitles (14px)"
          >
            14
          </button>
          <button
            type="button"
            onClick={() => onChangeFontSize('md')}
            className={`px-2 py-1 text-[11px] font-medium rounded-full transition-colors ${
              fontSize === 'md' ? 'bg-[#06b6d4] text-[#090a0f] font-semibold' : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
            title="Medium Subtitles (18px)"
          >
            18
          </button>
          <button
            type="button"
            onClick={() => onChangeFontSize('lg')}
            className={`px-2 py-1 text-[11px] font-medium rounded-full transition-colors ${
              fontSize === 'lg' ? 'bg-[#06b6d4] text-[#090a0f] font-semibold' : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
            title="Large Subtitles (24px)"
          >
            24
          </button>
        </div>

        {/* Subtitle Vertical Position Switcher */}
        <div className="hidden md:flex items-center p-1 bg-[#090a0f]/80 border border-[#1f2438] rounded-full">
          <button
            type="button"
            onClick={() => onChangePosition(position === 'bottom' ? 'center' : position === 'center' ? 'top' : 'bottom')}
            className="px-2.5 py-1 text-[11px] font-medium text-[#94a3b8] hover:text-[#f8fafc] flex items-center gap-1 transition-colors capitalize"
            title="Cycle Subtitle Position: Bottom / Center / Top"
          >
            <Move className="w-3 h-3 text-[#4cd7f6]" />
            <span>{position}</span>
          </button>
        </div>

        {/* Demo Speech Simulator Button */}
        <button
          type="button"
          onClick={onSimulateSample}
          className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-[#1c2b3c] hover:bg-[#273647] border border-[#1f2438] hover:border-[#f59e0b]/40 text-[#f59e0b] text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Simulate speech to test translation output instantly"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Test Speech</span>
        </button>
      </div>
    </div>
  );
};
