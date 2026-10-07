import React, { useEffect, useRef, useState } from 'react';
import { 
  Tv, 
  Volume2, 
  Maximize2, 
  Radio, 
  Play, 
  Pause, 
  Activity, 
  ShieldCheck, 
  Sliders,
  Sparkles
} from 'lucide-react';
import { DualTrackSubtitles } from './DualTrackSubtitles';
import { AudioTelemetry, SubtitleItem } from '../types';

interface MonitorStageProps {
  videoStream: MediaStream | null;
  telemetry: AudioTelemetry;
  currentSubtitle: SubtitleItem | null;
  interimOriginal: string;
  interimTranslated: string;
  isProcessing: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  showOriginal: boolean;
  highlightKeywords: boolean;
  position: 'bottom' | 'center' | 'top';
  targetLanguage: string;
  isActive: boolean;
  onSimulateSample: () => void;
}

export const MonitorStage: React.FC<MonitorStageProps> = ({
  videoStream,
  telemetry,
  currentSubtitle,
  interimOriginal,
  interimTranslated,
  isProcessing,
  fontSize,
  showOriginal,
  highlightKeywords,
  position,
  targetLanguage,
  isActive,
  onSimulateSample,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSafeGuides, setShowSafeGuides] = useState(false);

  // Bind video stream if available (from tab/screen share)
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch((e) => console.warn('Video play warning:', e));
    }
  }, [videoStream]);

  // Telemetry Oscilloscope animation on canvas when no video is playing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || videoStream) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw faint technical grid
      ctx.strokeStyle = 'rgba(31, 36, 56, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw dynamic audio waveform
      const centerY = height / 2;
      const amplitude = isActive
        ? Math.max(12, (telemetry.volumePercent / 100) * (height / 3.5))
        : 6;

      // Glow line 1 (Electric Cyan)
      ctx.beginPath();
      ctx.strokeStyle = isActive ? 'rgba(6, 182, 212, 0.85)' : 'rgba(76, 215, 246, 0.3)';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = isActive ? 12 : 4;
      ctx.shadowColor = '#06b6d4';

      for (let x = 0; x < width; x++) {
        const freq1 = 0.015;
        const freq2 = 0.035;
        const wave =
          Math.sin(x * freq1 + phase) * amplitude * 0.7 +
          Math.sin(x * freq2 - phase * 1.5) * (amplitude * 0.3);
        const y = centerY + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary harmonized wave (Amber Gold)
      if (isActive && telemetry.isSpeaking) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#f59e0b';

        for (let x = 0; x < width; x++) {
          const wave = Math.cos(x * 0.02 + phase * 1.2) * (amplitude * 0.5);
          const y = centerY + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0; // reset shadow
      phase += isActive ? 0.045 : 0.015;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isActive, telemetry.isSpeaking, telemetry.volumePercent, videoStream]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video max-h-[70vh] bg-[#090a0f] rounded-xl lg:rounded-2xl border border-[#1f2438] overflow-hidden flex flex-col justify-center items-center shadow-2xl group"
    >
      {/* Tab Video Playback (if screen/tab share has video) */}
      {videoStream ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          playsInline
          autoPlay
          muted
        />
      ) : (
        /* Atmospheric Studio Canvas */
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-radial from-[#122131]/60 via-[#090a0f] to-[#051424]">
          <canvas
            ref={canvasRef}
            width={854}
            height={480}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
          />

          {/* Center Stage Info when Idle */}
          {!isActive && !currentSubtitle && (
            <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-md pointer-events-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#131620]/90 border border-[#1f2438] flex items-center justify-center text-[#4cd7f6] mb-4 shadow-lg">
                <Tv className="w-7 h-7 text-[#06b6d4]" />
              </div>
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-1.5">
                Ready to Stream Subtitles
              </h3>
              <p className="text-xs text-[#94a3b8] mb-5 leading-relaxed">
                Connect your microphone or share a browser tab (YouTube, lectures, foreign streams) to view live translation into <span className="text-[#4cd7f6] font-medium">{targetLanguage}</span>.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onSimulateSample}
                  className="px-3.5 py-1.5 rounded-lg bg-[#131620] hover:bg-[#1c2b3c] border border-[#1f2438] hover:border-[#06b6d4]/50 text-xs font-medium text-[#d4e4fa] flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                  Simulate Live Speech
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Broadcast Safe Area Guides (Optional visual guide) */}
      {showSafeGuides && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-[5%] border border-[#06b6d4]/20 border-dashed rounded" />
          <div className="absolute inset-[10%] border border-[#f59e0b]/20 border-dashed rounded" />
          <span className="absolute top-2 right-2 text-[10px] font-telemetry text-[#64748b]">
            TITLE SAFE 80% / ACTION SAFE 90%
          </span>
        </div>
      )}

      {/* Top Corner Telemetry HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none opacity-85">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 font-telemetry text-[11px] text-[#94a3b8]">
            <Radio className={`w-3 h-3 ${isActive ? 'text-[#10b981] animate-pulse' : 'text-[#64748b]'}`} />
            <span>{videoStream ? 'TAB STREAM' : 'AUDIO HUD'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 font-telemetry text-[11px] text-[#64748b]">
            <span>OPUS / WEBM</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowSafeGuides(!showSafeGuides)}
            className="p-1.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[#94a3b8] hover:text-[#f8fafc] text-[11px] transition-colors"
            title="Toggle broadcast safe area guides"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[#94a3b8] hover:text-[#f8fafc] text-[11px] transition-colors"
            title="Toggle fullscreen monitor"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Corner Audio Levels & Language Tag */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-none flex items-center gap-2">
        <div className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 font-telemetry text-[10px] text-[#94a3b8] flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-[#06b6d4]" />
          <span>{telemetry.currentDb > -100 ? `${telemetry.currentDb} dB` : '-∞ dB'}</span>
        </div>
      </div>

      {/* Dual-Track Subtitle Overlay inside the Stage */}
      <DualTrackSubtitles
        currentSubtitle={currentSubtitle}
        interimOriginal={interimOriginal}
        interimTranslated={interimTranslated}
        isProcessing={isProcessing}
        fontSize={fontSize}
        showOriginal={showOriginal}
        highlightKeywords={highlightKeywords}
        position={position}
      />
    </div>
  );
};
