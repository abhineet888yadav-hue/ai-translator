import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioSourceType, AudioTelemetry } from '../types';

interface UseAudioPipelineProps {
  sourceType: AudioSourceType;
  timesliceMs: number;
  silenceThresholdDb: number;
  enableVAD: boolean;
  onAudioChunk: (base64Audio: string, mimeType: string, avgDb: number) => void;
  onError: (errorMsg: string) => void;
}

export function useAudioPipeline({
  sourceType,
  timesliceMs = 1800,
  silenceThresholdDb = -50,
  enableVAD = true,
  onAudioChunk,
  onError,
}: UseAudioPipelineProps) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hasAudioTrack, setHasAudioTrack] = useState<boolean>(true);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const [telemetry, setTelemetry] = useState<AudioTelemetry>({
    currentDb: -100,
    volumePercent: 0,
    isSpeaking: false,
    activeChunkDurationMs: 0,
    totalChunksProcessed: 0,
    avgLatencyMs: 0,
    lastLatencyMs: 0,
    sampleRate: 44100,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const cycleTimeoutRef = useRef<number | null>(null);

  // Peak and RMS volume tracking during the current timeslice
  const sliceVolumesRef = useRef<number[]>([]);

  // Update paused ref
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Determine best supported MIME type
  const getSupportedMimeType = useCallback((): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm';
  }, []);

  // Monitor audio levels via AnalyserNode
  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevels = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average energy
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const volumePercent = Math.min(100, Math.round((avg / 128) * 100));

        // Approximate decibels (-100 to 0 dB)
        const db = avg > 0 ? Math.max(-100, Math.round(20 * Math.log10(avg / 255))) : -100;

        sliceVolumesRef.current.push(db);

        const isSpeaking = db > silenceThresholdDb;

        setTelemetry((prev) => ({
          ...prev,
          currentDb: db,
          volumePercent,
          isSpeaking,
          sampleRate: audioCtx.sampleRate,
        }));

        animationFrameRef.current = requestAnimationFrame(checkLevels);
      };

      animationFrameRef.current = requestAnimationFrame(checkLevels);
    } catch (err) {
      console.warn('Web Audio API analysis initialization failed:', err);
    }
  }, [silenceThresholdDb]);

  // Stop analysis
  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Convert Blob to base64
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip out the data: URL prefix for cleaner transmission
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // Record a self-contained audio chunk and restart immediately
  const recordNextChunk = useCallback(() => {
    if (isStoppingRef.current || !streamRef.current || isPausedRef.current) {
      return;
    }

    const stream = streamRef.current;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      return;
    }

    const mimeType = getSupportedMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
    } catch (e) {
      try {
        recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
      } catch (err: any) {
        onError(`MediaRecorder initialization failed: ${err.message}`);
        return;
      }
    }

    const chunks: Blob[] = [];
    sliceVolumesRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = async () => {
      if (chunks.length > 0 && !isStoppingRef.current) {
        const combinedBlob = new Blob(chunks, { type: recorder.mimeType || mimeType });

        // Calculate average dB during slice
        const vols = sliceVolumesRef.current;
        const avgDb = vols.length > 0 ? vols.reduce((a, b) => a + b, 0) / vols.length : -100;
        const peakDb = vols.length > 0 ? Math.max(...vols) : -100;

        // VAD (Voice Activity Detection): Only dispatch if volume exceeds threshold or VAD disabled
        const hasHumanSpeech = !enableVAD || peakDb > silenceThresholdDb;

        if (hasHumanSpeech && combinedBlob.size > 1000) {
          try {
            const base64 = await blobToBase64(combinedBlob);
            onAudioChunk(base64, recorder.mimeType || mimeType, avgDb);
            setTelemetry((prev) => ({
              ...prev,
              totalChunksProcessed: prev.totalChunksProcessed + 1,
            }));
          } catch (err: any) {
            console.error('Error encoding audio chunk:', err);
          }
        }
      }

      // Schedule next cycle if still active
      if (!isStoppingRef.current && isActive && !isPausedRef.current) {
        recordNextChunk();
      }
    };

    recorder.start();

    // End this chunk after timesliceMs to finalize complete container headers
    cycleTimeoutRef.current = window.setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, timesliceMs);
  }, [blobToBase64, enableVAD, getSupportedMimeType, isActive, onAudioChunk, onError, silenceThresholdDb, timesliceMs]);

  // Start capturing audio from selected source
  const startPipeline = useCallback(async () => {
    isStoppingRef.current = false;
    try {
      let stream: MediaStream;

      if (sourceType === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        setVideoStream(null);
      } else {
        // Tab / System audio via getDisplayMedia
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'browser',
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });

        // Set video stream for monitor stage preview
        setVideoStream(stream);

        // Check if tab audio was included
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          setHasAudioTrack(false);
          onError('No tab audio detected. When sharing your screen or tab, make sure the "Also share tab audio" checkbox is checked!');
        } else {
          setHasAudioTrack(true);
        }
      }

      streamRef.current = stream;

      // Listen for stream ending (e.g. user clicks "Stop Sharing" on Chrome banner)
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          stopPipeline();
        };
      });

      startAudioAnalysis(stream);
      setIsActive(true);
      setIsPaused(false);

      // Start chunk recording
      recordNextChunk();
    } catch (err: any) {
      console.error('Audio capture permission error:', err);
      setIsActive(false);
      if (err.name === 'NotAllowedError') {
        onError('Audio capture permission was denied. Please allow microphone or tab access to start subtitles.');
      } else {
        onError(`Failed to start audio stream: ${err.message || 'Unknown error'}`);
      }
    }
  }, [onError, recordNextChunk, sourceType, startAudioAnalysis]);

  // Stop pipeline
  const stopPipeline = useCallback(() => {
    isStoppingRef.current = true;

    if (cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    stopAudioAnalysis();
    setIsActive(false);
    setIsPaused(false);
    setVideoStream(null);
    setTelemetry((prev) => ({
      ...prev,
      currentDb: -100,
      volumePercent: 0,
      isSpeaking: false,
    }));
  }, [stopAudioAnalysis]);

  // Toggle pause
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (!next && isActive) {
        // Resuming
        recordNextChunk();
      }
      return next;
    });
  }, [isActive, recordNextChunk]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      stopAudioAnalysis();
    };
  }, [stopAudioAnalysis]);

  return {
    isActive,
    isPaused,
    hasAudioTrack,
    videoStream,
    telemetry,
    startPipeline,
    stopPipeline,
    togglePause,
  };
}
