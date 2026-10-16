import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config';
import { ClipSeconds, QuizMode, QuizPhase, Song } from '../types';
import { shuffle } from '../utils/rng';
import { pickClipOffset, pickRevealOffset } from '../utils/offsets';

interface UseQuizProps {
  songs: Song[];
  duration: number;
  isReady: boolean;
  loadSong: (url: string) => void;
  playSegment: (offset: number, length?: number, onEnd?: () => void) => void;
  stop: () => void;
}

export function useQuiz({ songs, duration, isReady, loadSong, playSegment, stop }: UseQuizProps) {
  const [mode, setMode] = useState<QuizMode>('intro');
  const [clipSeconds, setClipSeconds] = useState<ClipSeconds>(CONFIG.DEFAULT_CLIP_SECONDS);
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [song, setSong] = useState<Song | null>(null);
  const [round, setRound] = useState(0);
  const [thinkLeft, setThinkLeft] = useState(CONFIG.THINK_SECONDS);
  const [clipOffset, setClipOffset] = useState(0);

  const queueRef = useRef<Song[]>([]);
  const thinkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipSongUrisRef = useRef<Set<string>>(new Set());
  const waitingReadyRef = useRef(false);
  const clipOffsetRef = useRef(0);
  const modeRef = useRef<QuizMode>('intro');
  const clipSecondsRef = useRef<ClipSeconds>(CONFIG.DEFAULT_CLIP_SECONDS);
  const phaseRef = useRef<QuizPhase>('idle');
  const songRef = useRef<Song | null>(null);

  modeRef.current = mode;
  clipSecondsRef.current = clipSeconds;
  phaseRef.current = phase;
  songRef.current = song;

  const clearThinkTimer = () => {
    if (thinkTimerRef.current) {
      clearInterval(thinkTimerRef.current);
      thinkTimerRef.current = null;
    }
  };

  const nextFromQueue = useCallback((): Song | null => {
    const pool = songs.filter((s) => s.previewUrl && !skipSongUrisRef.current.has(s.uri));
    if (pool.length === 0) return null;
    if (queueRef.current.length === 0) {
      queueRef.current = shuffle(pool);
    }
    let next = queueRef.current.pop();
    while (next && skipSongUrisRef.current.has(next.uri)) {
      next = queueRef.current.pop();
    }
    if (!next) {
      queueRef.current = shuffle(pool);
      next = queueRef.current.pop();
    }
    return next || pool[0];
  }, [songs]);

  const beginReveal = useCallback(() => {
    clearThinkTimer();
    const current = songRef.current;
    if (!current) return;
    setPhase('reveal');
    const revealAt = pickRevealOffset(
      duration,
      modeRef.current,
      clipSecondsRef.current,
      clipOffsetRef.current
    );
    playSegment(revealAt, CONFIG.REVEAL_PLAY_SECONDS);
  }, [duration, playSegment]);

  const startThink = useCallback(() => {
    clearThinkTimer();
    setPhase('think');
    setThinkLeft(CONFIG.THINK_SECONDS);
    let left = CONFIG.THINK_SECONDS;
    thinkTimerRef.current = setInterval(() => {
      left -= 1;
      setThinkLeft(left);
      if (left <= 0) {
        clearThinkTimer();
        beginReveal();
      }
    }, 1000);
  }, [beginReveal]);

  const startClip = useCallback(() => {
    const seconds = clipSecondsRef.current;
    const offset = pickClipOffset(duration, seconds, modeRef.current);
    clipOffsetRef.current = offset;
    setClipOffset(offset);
    setPhase('clip');
    playSegment(offset, seconds, () => {
      startThink();
    });
  }, [duration, playSegment, startThink]);

  useEffect(() => {
    if (phase === 'loading' && isReady && waitingReadyRef.current) {
      waitingReadyRef.current = false;
      startClip();
    }
  }, [phase, isReady, startClip]);

  const loadRound = useCallback(
    (next: Song) => {
      waitingReadyRef.current = true;
      setSong(next);
      setPhase('loading');
      setThinkLeft(CONFIG.THINK_SECONDS);
      loadSong(next.previewUrl);
    },
    [loadSong]
  );

  const startSession = useCallback(
    (nextMode: QuizMode, seconds: ClipSeconds) => {
      stop();
      clearThinkTimer();
      skipSongUrisRef.current = new Set();
      queueRef.current = [];
      setMode(nextMode);
      setClipSeconds(seconds);
      modeRef.current = nextMode;
      clipSecondsRef.current = seconds;
      const next = nextFromQueue();
      if (!next) return false;
      setRound(1);
      loadRound(next);
      return true;
    },
    [loadRound, nextFromQueue, stop]
  );

  const nextRound = useCallback(() => {
    stop();
    clearThinkTimer();
    const next = nextFromQueue();
    if (!next) {
      setPhase('idle');
      setSong(null);
      return;
    }
    setRound((n) => n + 1);
    loadRound(next);
  }, [loadRound, nextFromQueue, stop]);

  const skipBrokenSong = useCallback(() => {
    if (phaseRef.current === 'idle') return;
    const current = songRef.current;
    if (current) skipSongUrisRef.current.add(current.uri);
    nextRound();
  }, [nextRound]);

  const skipToReveal = useCallback(() => {
    if (phaseRef.current === 'think' || phaseRef.current === 'clip') {
      stop();
      beginReveal();
    }
  }, [beginReveal, stop]);

  const exitToMenu = useCallback(() => {
    stop();
    clearThinkTimer();
    waitingReadyRef.current = false;
    setPhase('idle');
    setSong(null);
    setRound(0);
  }, [stop]);

  useEffect(() => {
    return () => {
      clearThinkTimer();
    };
  }, []);

  return {
    mode,
    clipSeconds,
    phase,
    song,
    round,
    thinkLeft,
    clipOffset,
    startSession,
    nextRound,
    skipBrokenSong,
    skipToReveal,
    exitToMenu,
  };
}
