/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { MonitorStage } from './components/MonitorStage';
import { FloatingDock } from './components/FloatingDock';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { DetachedSubtitleWindow } from './components/DetachedSubtitleWindow';
import { TabAudioHelpModal } from './components/TabAudioHelpModal';
import { useAudioPipeline } from './hooks/useAudioPipeline';
import { 
  translateAudioChunk, 
  checkServerStatus, 
  getNextSampleTranslation 
} from './lib/geminiTranslator';
import { 
  AudioSourceType, 
  PipelineStatus, 
  SubtitleItem, 
  AppSettings 
} from './types';
import { formatTimestamp } from './lib/languages';
import { AlertCircle, X, Sparkles } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  modelName: 'gemini-2.5-flash',
  targetLanguage: 'Spanish',
  timesliceMs: 1800,
  silenceThresholdDb: -48,
  fontSize: 'md',
  position: 'bottom',
  showOriginal: true,
  highlightKeywords: true,
  autoScrollHistory: true,
  enableVAD: true,
};

export default function App() {
  // Persistent Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('sublive_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [hasServerKey, setHasServerKey] = useState<boolean>(true);
  const [sourceType, setSourceType] = useState<AudioSourceType>('mic');
  const [targetLanguage, setTargetLanguage] = useState<string>(settings.targetLanguage || 'Spanish');
  
  // Subtitle State
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleItem | null>(null);
  const [interimOriginal, setInterimOriginal] = useState<string>('');
  const [interimTranslated, setInterimTranslated] = useState<string>('');
  const [status, setStatus] = useState<PipelineStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLatencyMs, setLastLatencyMs] = useState<number>(0);

  // Modals & Floating Windows
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTabHelpOpen, setIsTabHelpOpen] = useState<boolean>(false);
  const [isDetached, setIsDetached] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Session start time for relative timestamping
  const sessionStartTimeRef = useRef<number>(Date.now());
  const previousSubtitleTextRef = useRef<string>('');

  // Check server environment key on mount
  useEffect(() => {
    checkServerStatus().then((res) => {
      setHasServerKey(res.hasServerKey);
    });
  }, []);

  // Save settings to localStorage
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setTargetLanguage(newSettings.targetLanguage);
    try {
      localStorage.setItem('sublive_settings', JSON.stringify(newSettings));
    } catch (e) {}
  };

  // Handle incoming audio chunk from the pipeline hook
  const handleAudioChunk = useCallback(
    async (base64Audio: string, mimeType: string, avgDb: number) => {
      setStatus('processing');
      setInterimOriginal('Listening and translating...');

      const context = previousSubtitleTextRef.current;
      const effectiveKey = settings.apiKey || '';

      try {
        const response = await translateAudioChunk({
          audioBase64: base64Audio,
          mimeType,
          targetLanguage,
          modelName: settings.modelName,
          apiKey: effectiveKey,
          context,
        });

        setLastLatencyMs(response.latency_ms);

        // Check if there is actual speech
        if (response.original_transcript && response.original_transcript.trim() !== '') {
          const now = Date.now();
          const relativeMs = now - sessionStartTimeRef.current;
          const formatted = formatTimestamp(relativeMs);

          const newSub: SubtitleItem = {
            id: `sub-${now}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: relativeMs,
            formattedTime: formatted,
            originalText: response.original_transcript,
            translatedText: response.translated_text || response.original_transcript,
            sourceLanguage: response.detected_language || 'Auto',
            targetLanguage,
            latencyMs: response.latency_ms,
          };

          setCurrentSubtitle(newSub);
          setInterimOriginal(response.original_transcript);
          setInterimTranslated(response.translated_text);
          previousSubtitleTextRef.current = response.translated_text;

          setSubtitles((prev) => [newSub, ...prev]);
          setStatus('listening');
        } else {
          // Silence or unintelligible noise
          setStatus('listening');
          setInterimOriginal('');
        }
      } catch (err: any) {
        console.error('Audio chunk translation error:', err);
        setStatus('listening');
        setInterimOriginal('');
        if (err.message && err.message.includes('API key')) {
          setErrorMessage(err.message);
          setStatus('error');
        }
      }
    },
    [settings.apiKey, settings.modelName, targetLanguage]
  );

  const handlePipelineError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setStatus('error');
  }, []);

  // Audio Pipeline hook
  const {
    isActive,
    isPaused,
    hasAudioTrack,
    videoStream,
    telemetry,
    startPipeline,
    stopPipeline,
    togglePause,
  } = useAudioPipeline({
    sourceType,
    timesliceMs: settings.timesliceMs,
    silenceThresholdDb: settings.silenceThresholdDb,
    enableVAD: settings.enableVAD,
    onAudioChunk: handleAudioChunk,
    onError: handlePipelineError,
  });

  // Keep pipeline status in sync with isActive
  useEffect(() => {
    if (!isActive) {
      setStatus('idle');
      setInterimOriginal('');
      setInterimTranslated('');
    } else if (isPaused) {
      setStatus('paused');
    } else {
      setStatus('listening');
    }
  }, [isActive, isPaused]);

  // Toggle capturing
  const handleToggleActive = () => {
    setErrorMessage(null);
    if (isActive) {
      stopPipeline();
    } else {
      sessionStartTimeRef.current = Date.now();
      startPipeline();
    }
  };

  // Switch audio source
  const handleSourceChange = (newSource: AudioSourceType) => {
    if (isActive) {
      stopPipeline();
    }
    setSourceType(newSource);
    setErrorMessage(null);
  };

  // Change target language
  const handleTargetLanguageChange = (lang: string) => {
    setTargetLanguage(lang);
    setSettings((prev) => {
      const updated = { ...prev, targetLanguage: lang };
      try {
        localStorage.setItem('sublive_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Interactive Test Speech simulation
  const handleSimulateSample = () => {
    setStatus('processing');
    setInterimOriginal('Simulating live speech input...');
    setInterimTranslated('Processing translation with Gemini...');

    setTimeout(() => {
      const sample = getNextSampleTranslation(targetLanguage);
      const now = Date.now();
      const relativeMs = now - sessionStartTimeRef.current;
      const formatted = formatTimestamp(relativeMs);

      const simSub: SubtitleItem = {
        id: `sim-${now}`,
        timestamp: relativeMs,
        formattedTime: formatted,
        originalText: sample.original,
        translatedText: sample.translated,
        sourceLanguage: sample.lang,
        targetLanguage,
        latencyMs: sample.latency,
      };

      setLastLatencyMs(sample.latency);
      setCurrentSubtitle(simSub);
      setInterimOriginal(sample.original);
      setInterimTranslated(sample.translated);
      previousSubtitleTextRef.current = sample.translated;
      setSubtitles((prev) => [simSub, ...prev]);
      setStatus(isActive ? 'listening' : 'idle');
    }, 450);
  };

  // Clear history
  const handleClearHistory = () => {
    setSubtitles([]);
    setCurrentSubtitle(null);
    setInterimOriginal('');
    setInterimTranslated('');
    previousSubtitleTextRef.current = '';
  };

  return (
    <div className="min-h-screen bg-[#051424] text-[#d4e4fa] flex flex-col font-sans selection:bg-[#06b6d4]/30 selection:text-white">
      {/* Top Application Header */}
      <Header
        sourceType={sourceType}
        onSourceChange={handleSourceChange}
        targetLanguage={targetLanguage}
        onTargetLanguageChange={handleTargetLanguageChange}
        status={status}
        lastLatencyMs={lastLatencyMs}
        subtitleCount={subtitles.length}
        isDetached={isDetached}
        onToggleDetach={() => setIsDetached(!isDetached)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTabHelp={() => setIsTabHelpOpen(true)}
        onClearHistory={handleClearHistory}
        onExport={() => {}}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
      />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left/Center Canvas Area */}
        <main className="flex-1 flex flex-col items-center justify-between p-3 sm:p-6 lg:mr-[340px] max-w-7xl mx-auto w-full transition-all">
          {/* Error / Warning Alert Banner */}
          {errorMessage && (
            <div className="w-full max-w-4xl mb-3 p-3 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ffdad6] text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <div className="flex items-center gap-2">
                {errorMessage.includes('API key') && (
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-2 py-1 rounded bg-[#ef4444]/30 hover:bg-[#ef4444]/50 text-white font-medium text-[11px] underline"
                  >
                    Open Settings
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 16:9 Monitor Stage (Centered Viewport) */}
          <div className="w-full flex-1 flex flex-col justify-center items-center py-2 sm:py-4">
            <MonitorStage
              videoStream={videoStream}
              telemetry={telemetry}
              currentSubtitle={currentSubtitle}
              interimOriginal={interimOriginal}
              interimTranslated={interimTranslated}
              isProcessing={status === 'processing'}
              fontSize={settings.fontSize}
              showOriginal={settings.showOriginal}
              highlightKeywords={settings.highlightKeywords}
              position={settings.position}
              targetLanguage={targetLanguage}
              isActive={isActive}
              onSimulateSample={handleSimulateSample}
            />
          </div>

          {/* Floating Dock Controller HUD */}
          <FloatingDock
            isActive={isActive}
            isPaused={isPaused}
            status={status}
            telemetry={telemetry}
            fontSize={settings.fontSize}
            position={settings.position}
            onToggleActive={handleToggleActive}
            onTogglePause={togglePause}
            onChangeFontSize={(size) => handleSaveSettings({ ...settings, fontSize: size })}
            onChangePosition={(pos) => handleSaveSettings({ ...settings, position: pos })}
            onSimulateSample={handleSimulateSample}
          />
        </main>

        {/* Rolling Dialogue History Drawer (320px fixed on desktop) */}
        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          subtitles={subtitles}
          onClear={handleClearHistory}
        />
      </div>

      {/* Floating PIP / Detached Subtitle Window */}
      {isDetached && (
        <DetachedSubtitleWindow
          isOpen={isDetached}
          onClose={() => setIsDetached(false)}
          currentSubtitle={currentSubtitle}
          interimOriginal={interimOriginal}
          interimTranslated={interimTranslated}
          isProcessing={status === 'processing'}
          fontSize={settings.fontSize}
          showOriginal={settings.showOriginal}
          highlightKeywords={settings.highlightKeywords}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        hasServerKey={hasServerKey}
      />

      {/* Tab Audio Instructions Modal */}
      <TabAudioHelpModal
        isOpen={isTabHelpOpen}
        onClose={() => setIsTabHelpOpen(false)}
      />
    </div>
  );
}
