import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config';

interface UseClipPlayerOptions {
  volume: number;
  onAudioError?: () => void;
}

export function useClipPlayer({ volume, onAudioError }: UseClipPlayerOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(CONFIG.PREVIEW_FALLBACK_DURATION);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopAtRef = useRef<number | null>(null);
  const onSegmentEndRef = useRef<(() => void) | null>(null);
  const errorHandlerRef = useRef(onAudioError);
  const generationRef = useRef(0);

  errorHandlerRef.current = onAudioError;

  const clearRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const clearClipTimer = () => {
    if (clipTimerRef.current) {
      clearTimeout(clipTimerRef.current);
      clipTimerRef.current = null;
    }
  };

  const finishSegment = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setIsPlaying(false);
    clearRaf();
    clearClipTimer();
    const done = onSegmentEndRef.current;
    onSegmentEndRef.current = null;
    stopAtRef.current = null;
    if (done) done();
  }, []);

  const stop = useCallback(() => {
    clearRaf();
    clearClipTimer();
    onSegmentEndRef.current = null;
    stopAtRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
  }, []);

  const watchPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const limit = stopAtRef.current;
    if (limit !== null && (audio.currentTime >= limit || audio.ended)) {
      finishSegment();
      return;
    }

    if (audio.ended) {
      finishSegment();
      return;
    }

    rafRef.current = requestAnimationFrame(watchPlayback);
  }, [finishSegment]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = Math.max(0, Math.min(1, volume));
    audioRef.current = audio;

    const handleMeta = () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (audio.duration && !Number.isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
      setIsReady(true);
    };

    const handleError = () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setIsLoading(false);
      setIsReady(false);
      setIsPlaying(false);
      errorHandlerRef.current?.();
    };

    audio.addEventListener('loadedmetadata', handleMeta);
    audio.addEventListener('canplay', handleMeta);
    audio.addEventListener('error', handleError);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      clearRaf();
      audio.removeEventListener('loadedmetadata', handleMeta);
      audio.removeEventListener('canplay', handleMeta);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
    // volume is applied in a separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  const loadSong = useCallback(
    (previewUrl: string) => {
      stop();
      generationRef.current += 1;
      const gen = generationRef.current;

      if (!previewUrl) {
        setIsReady(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsReady(false);

      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        if (generationRef.current !== gen) return;
        setIsLoading(false);
        errorHandlerRef.current?.();
      }, CONFIG.AUDIO_LOAD_TIMEOUT_MS);

      const audio = audioRef.current;
      if (audio) {
        audio.src = previewUrl;
        audio.load();
      }
    },
    [stop]
  );

  const playSegment = useCallback(
    (offset: number, length?: number, onEnd?: () => void) => {
      const audio = audioRef.current;
      if (!audio || !audio.src) return;

      clearRaf();
      clearClipTimer();
      onSegmentEndRef.current = onEnd || null;
      stopAtRef.current = length !== undefined ? offset + length : null;
      if (length !== undefined) {
        clipTimerRef.current = setTimeout(() => {
          finishSegment();
        }, Math.round(length * 1000) + 350);
      }

      try {
        audio.currentTime = Math.max(0, offset);
      } catch {
        // Tizen may throw if metadata is not ready yet
      }

      const promise = audio.play();
      const startWatch = () => {
        setIsPlaying(true);
        rafRef.current = requestAnimationFrame(watchPlayback);
      };

      if (promise !== undefined) {
        promise.then(startWatch).catch((err) => {
          console.warn('Playback blocked:', err);
          setIsPlaying(false);
        });
      } else {
        startWatch();
      }
    },
    [watchPlayback, finishSegment]
  );

  return {
    isReady,
    isPlaying,
    isLoading,
    duration,
    playSegment,
    stop,
    loadSong,
  };
}
