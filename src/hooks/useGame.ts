import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Song, GameMode, GameStatus, GuessAttempt, GameStats, DailyResult, Settings } from '../types';
import { CONFIG } from '../config';
import { normalize, isHardGuessCorrect } from '../utils/text';
import { mulberry32, hashString, shuffle, getLocalDateString } from '../utils/rng';

export interface UseGameProps {
  allSongs: Song[];
  settings: Settings;
  showToast: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  playClip: (offset: number, length: number) => void;
  loadAudio: (previewUrl: string, offset: number, length: number) => void;
  preloadAudio: (previewUrl: string) => void;
  stopAudio: () => void;
}

const DEFAULT_STATS: Record<GameMode, GameStats> = {
  easy: { gamesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0, highScore: 0, guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 } },
  medium: { gamesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0, highScore: 0, guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 0: 0 } },
  hard: { gamesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0, highScore: 0, guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 0: 0 } },
  daily: { gamesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0, highScore: 0, guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 0: 0 } },
};

export function useGame({
  allSongs,
  settings,
  showToast,
  playClip,
  loadAudio,
  preloadAudio,
  stopAudio,
}: UseGameProps) {
  const [currentMode, setCurrentMode] = useState<GameMode>('medium');
  const [status, setStatus] = useState<GameStatus>('loading');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [nextSong, setNextSong] = useState<Song | null>(null);
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [guesses, setGuesses] = useState<GuessAttempt[]>([]);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [startOffset, setStartOffset] = useState<number>(0);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [easyOptions, setEasyOptions] = useState<Song[]>([]);

  // Persistent stats
  const [stats, setStats] = useState<Record<GameMode, GameStats>>(() => {
    try {
      const saved = localStorage.getItem(`${CONFIG.STORAGE_PREFIX}stats`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_STATS;
  });

  // Daily records
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(() => {
    try {
      const today = getLocalDateString();
      const saved = localStorage.getItem(`${CONFIG.STORAGE_PREFIX}daily_${today}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Session queues per mode so there are no repeats in a session
  const queuesRef = useRef<Record<GameMode, Song[]>>({
    easy: [],
    medium: [],
    hard: [],
    daily: [],
  });

  // Save stats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`${CONFIG.STORAGE_PREFIX}stats`, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [stats]);

  // Helper to filter pool according to mode rules & handle borrowing if < 15
  const getPoolForMode = useCallback((mode: GameMode, songs: Song[]): Song[] => {
    if (songs.length === 0) return [];
    if (mode === 'daily') return songs;

    const config = CONFIG.MODES[mode];
    let filtered = songs.filter(s => {
      if (config.minPopularity !== undefined && s.popularity < config.minPopularity) return false;
      if (config.maxPopularity !== undefined && s.popularity > config.maxPopularity) return false;
      return true;
    });

    if (filtered.length < CONFIG.MIN_POOL_SIZE) {
      console.warn(`Mode [${mode}] pool has only ${filtered.length} songs (< ${CONFIG.MIN_POOL_SIZE}). Borrowing from adjacent songs.`);
      // Sort all songs by popularity distance to this mode's midpoint
      const mid = config.minPopularity !== undefined && config.maxPopularity !== undefined 
        ? (config.minPopularity + config.maxPopularity) / 2
        : (config.minPopularity !== undefined ? config.minPopularity : (config.maxPopularity || 35));
      const sorted = [...songs].sort((a, b) => Math.abs(a.popularity - mid) - Math.abs(b.popularity - mid));
      filtered = sorted.slice(0, Math.max(CONFIG.MIN_POOL_SIZE, filtered.length));
    }

    return filtered;
  }, []);

  // Generate 4 easy mode options: correct song + 3 distractors with different artist
  const generateEasyOptions = useCallback((targetSong: Song, pool: Song[]): Song[] => {
    const distractors = pool.filter(s => s.uri !== targetSong.uri && normalize(s.artist) !== normalize(targetSong.artist));
    const shuffledDistractors = shuffle(distractors);
    const chosenDistractors = shuffledDistractors.slice(0, 3);
    const options = shuffle([targetSong, ...chosenDistractors]);
    return options;
  }, []);

  // Reset or refill the mode's queue
  const getNextSongFromQueue = useCallback((mode: GameMode, songs: Song[]): Song | null => {
    const pool = getPoolForMode(mode, songs);
    if (pool.length === 0) return null;

    if (mode === 'daily') {
      const today = getLocalDateString();
      const seed = hashString(`rapguess-daily-${today}`);
      const prng = mulberry32(seed);
      const index = Math.floor(prng() * pool.length);
      return pool[index];
    }

    if (!queuesRef.current[mode] || queuesRef.current[mode].length === 0) {
      queuesRef.current[mode] = shuffle(pool);
    }

    return queuesRef.current[mode].pop() || pool[0];
  }, [getPoolForMode]);

  // Calculate score according to the formula:
  // roundScore = round(base * modeMultiplier * (1 - 0.15 * hintsUsed) * (1 + streakBonus))
  const calculateScore = useCallback((attemptNumber: number, mode: GameMode, hintsCount: number): number => {
    const config = CONFIG.MODES[mode];
    const baseIndex = Math.min(attemptNumber - 1, CONFIG.BASE_POINTS.length - 1);
    const base = CONFIG.BASE_POINTS[baseIndex] || 150;
    const multiplier = config.scoreMultiplier;

    const hintFactor = Math.max(CONFIG.MIN_HINT_FACTOR, 1 - CONFIG.HINT_PENALTY_RATE * hintsCount);
    const currentStreak = stats[mode]?.currentStreak || 0;
    const streakBonus = Math.min(CONFIG.MAX_STREAK_BONUS, CONFIG.STREAK_BONUS_PER_WIN * currentStreak);

    return Math.round(base * multiplier * hintFactor * (1 + streakBonus));
  }, [stats]);

  // Start a new round
  const startRound = useCallback((mode: GameMode, overrideSong?: Song) => {
    stopAudio();
    setCurrentMode(mode);

    if (allSongs.length === 0) {
      setStatus('loading');
      return;
    }

    // Check if daily was already completed today
    if (mode === 'daily') {
      const today = getLocalDateString();
      try {
        const saved = localStorage.getItem(`${CONFIG.STORAGE_PREFIX}daily_${today}`);
        if (saved) {
          const parsed = JSON.parse(saved) as DailyResult;
          setDailyResult(parsed);
          const dailySong = allSongs.find(s => s.uri === parsed.songUri) || allSongs[0];
          setCurrentSong(dailySong);
          setGuesses(parsed.guesses || []);
          setStatus(parsed.won ? 'won' : 'lost');
          setRoundScore(parsed.score);
          loadAudio(dailySong.previewUrl, 0, 30);
          return;
        }
      } catch {
        // ignore
      }
    }

    const song = overrideSong || getNextSongFromQueue(mode, allSongs);
    if (!song) {
      showToast('Şarkı havuzu boş görünüyor!', 'error');
      return;
    }

    setCurrentSong(song);
    setStageIndex(0);
    setGuesses([]);
    setHintsUsed(0);
    setRoundScore(0);
    setStatus('ready');

    // Hard mode starts at a random offset between 0 and 20 seconds
    const config = CONFIG.MODES[mode];
    let offset = 0;
    if (config.randomOffset) {
      offset = Math.floor(Math.random() * 20);
    }
    setStartOffset(offset);

    // If easy mode, generate 4 options
    if (mode === 'easy') {
      const pool = getPoolForMode('easy', allSongs);
      setEasyOptions(generateEasyOptions(song, pool));
    }

    // Load audio for first stage
    const firstLength = config.clipLengths[0];
    loadAudio(song.previewUrl, offset, firstLength);

    // Preload next upcoming song in advance
    const pool = getPoolForMode(mode, allSongs);
    const futureNext = queuesRef.current[mode]?.[queuesRef.current[mode].length - 1] || pool[Math.floor(Math.random() * pool.length)];
    if (futureNext && futureNext.uri !== song.uri) {
      setNextSong(futureNext);
      preloadAudio(futureNext.previewUrl);
    }
  }, [allSongs, getNextSongFromQueue, getPoolForMode, generateEasyOptions, loadAudio, preloadAudio, stopAudio, showToast]);

  // Handle wrong audio link or loading error: pick another song without penalizing
  const handleAudioError = useCallback(() => {
    showToast('Bu şarkının kesiti yüklenemedi, yeni bir şarkı seçildi.', 'warning');
    if (!currentSong) return;

    // Remove bad song from current mode's queue
    queuesRef.current[currentMode] = queuesRef.current[currentMode].filter(s => s.uri !== currentSong.uri);

    // Pick replacement
    const replacement = getNextSongFromQueue(currentMode, allSongs);
    if (replacement) {
      startRound(currentMode, replacement);
    }
  }, [currentSong, currentMode, allSongs, getNextSongFromQueue, startRound, showToast]);

  // Update statistics after game outcome
  const recordGameResult = useCallback((mode: GameMode, won: boolean, attemptsCount: number, finalScore: number) => {
    setStats(prev => {
      const modeStats = { ...prev[mode] };
      modeStats.gamesPlayed += 1;

      if (won) {
        modeStats.wins += 1;
        modeStats.currentStreak += 1;
        if (modeStats.currentStreak > modeStats.maxStreak) {
          modeStats.maxStreak = modeStats.currentStreak;
        }
        modeStats.guessDistribution = {
          ...modeStats.guessDistribution,
          [attemptsCount]: (modeStats.guessDistribution[attemptsCount] || 0) + 1,
        };
      } else {
        modeStats.currentStreak = 0;
        modeStats.guessDistribution = {
          ...modeStats.guessDistribution,
          0: (modeStats.guessDistribution[0] || 0) + 1,
        };
      }

      if (finalScore > modeStats.highScore) {
        modeStats.highScore = finalScore;
      }

      return {
        ...prev,
        [mode]: modeStats,
      };
    });

    // If daily, persist result for today
    if (mode === 'daily' && currentSong) {
      const today = getLocalDateString();
      const result: DailyResult = {
        date: today,
        songUri: currentSong.uri,
        won,
        attemptsUsed: attemptsCount,
        score: finalScore,
        guesses: guesses,
      };
      setDailyResult(result);
      try {
        localStorage.setItem(`${CONFIG.STORAGE_PREFIX}daily_${today}`, JSON.stringify(result));
      } catch {
        // ignore
      }
    }
  }, [currentSong, guesses]);

  // Submit a guess
  const submitGuess = useCallback((guessInput: string | Song) => {
    if (!currentSong || status === 'won' || status === 'lost') return;

    const config = CONFIG.MODES[currentMode];
    let isCorrect = false;
    let guessText = '';
    let songUri: string | undefined;

    if (typeof guessInput === 'object' && guessInput !== null) {
      // Guess passed as Song object (Easy / Autocomplete selection)
      songUri = guessInput.uri;
      guessText = `${guessInput.artist} - ${guessInput.title}`;

      // Check uri exact match OR same normalized title + artist
      if (
        guessInput.uri === currentSong.uri ||
        (normalize(guessInput.title) === normalize(currentSong.title) &&
         normalize(guessInput.artist) === normalize(currentSong.artist))
      ) {
        isCorrect = true;
      }
    } else {
      // Free text guess (Hard mode) or typed string
      guessText = guessInput.trim();
      if (!guessText) return;

      if (currentMode === 'hard') {
        isCorrect = isHardGuessCorrect(guessText, currentSong);
      } else {
        // Fallback exact match comparison
        if (
          normalize(guessText) === normalize(currentSong.title) ||
          normalize(guessText) === normalize(`${currentSong.artist} ${currentSong.title}`) ||
          normalize(guessText) === normalize(`${currentSong.artist} - ${currentSong.title}`)
        ) {
          isCorrect = true;
        }
      }
    }

    const newAttempt: GuessAttempt = {
      text: guessText,
      songUri,
      isSkipped: false,
      isCorrect,
      stageIndex,
      timestamp: Date.now(),
    };

    const nextGuesses = [...guesses, newAttempt];
    setGuesses(nextGuesses);

    if (isCorrect) {
      stopAudio();
      const points = calculateScore(stageIndex + 1, currentMode, hintsUsed);
      setRoundScore(points);
      setSessionScore(prev => prev + points);
      setStatus('won');
      recordGameResult(currentMode, true, stageIndex + 1, points);
      // Prepare full preview on result screen
      loadAudio(currentSong.previewUrl, 0, 30);
    } else {
      // Incorrect guess
      if (stageIndex + 1 < config.attempts) {
        const nextStage = stageIndex + 1;
        setStageIndex(nextStage);

        // Regenerate options in easy mode
        if (currentMode === 'easy') {
          const pool = getPoolForMode('easy', allSongs);
          setEasyOptions(generateEasyOptions(currentSong, pool));
        }

        // Auto-play the newly unlocked clip if enabled
        const nextLength = config.clipLengths[nextStage];
        if (settings.autoPlay) {
          playClip(startOffset, nextLength);
        }
      } else {
        // Out of attempts: Lost
        stopAudio();
        setRoundScore(0);
        setStatus('lost');
        recordGameResult(currentMode, false, config.attempts, 0);
        // Prepare full preview on result screen
        loadAudio(currentSong.previewUrl, 0, 30);
      }
    }
  }, [currentSong, status, currentMode, stageIndex, guesses, hintsUsed, calculateScore, recordGameResult, loadAudio, allSongs, getPoolForMode, generateEasyOptions, settings.autoPlay, playClip, startOffset, stopAudio]);

  // Skip current stage
  const skipStage = useCallback(() => {
    if (!currentSong || status === 'won' || status === 'lost') return;

    const config = CONFIG.MODES[currentMode];
    const newAttempt: GuessAttempt = {
      text: '',
      isSkipped: true,
      isCorrect: false,
      stageIndex,
      timestamp: Date.now(),
    };

    const nextGuesses = [...guesses, newAttempt];
    setGuesses(nextGuesses);

    if (stageIndex + 1 < config.attempts) {
      const nextStage = stageIndex + 1;
      setStageIndex(nextStage);

      if (currentMode === 'easy') {
        const pool = getPoolForMode('easy', allSongs);
        setEasyOptions(generateEasyOptions(currentSong, pool));
      }

      const nextLength = config.clipLengths[nextStage];
      if (settings.autoPlay) {
        playClip(startOffset, nextLength);
      }
    } else {
      // Out of attempts
      stopAudio();
      setRoundScore(0);
      setStatus('lost');
      recordGameResult(currentMode, false, config.attempts, 0);
      loadAudio(currentSong.previewUrl, 0, 30);
    }
  }, [currentSong, status, currentMode, stageIndex, guesses, recordGameResult, loadAudio, allSongs, getPoolForMode, generateEasyOptions, settings.autoPlay, playClip, startOffset, stopAudio]);

  // Reveal next hint
  const useHint = useCallback(() => {
    if (hintsUsed >= CONFIG.HINTS_MAX) return;
    if (currentMode === 'daily' && !CONFIG.DAILY_HINTS_ENABLED) return;
    setHintsUsed(prev => prev + 1);
  }, [hintsUsed, currentMode]);

  // Reset stats confirmation
  const resetAllStats = useCallback(() => {
    setStats(DEFAULT_STATS);
    try {
      localStorage.removeItem(`${CONFIG.STORAGE_PREFIX}stats`);
    } catch {
      // ignore
    }
    showToast('İstatistikler başarıyla sıfırlandı.', 'info');
  }, [showToast]);

  return {
    currentMode,
    status,
    currentSong,
    nextSong,
    stageIndex,
    guesses,
    hintsUsed,
    startOffset,
    roundScore,
    sessionScore,
    easyOptions,
    stats,
    dailyResult,
    startRound,
    submitGuess,
    skipStage,
    useHint,
    handleAudioError,
    resetAllStats,
    calculateScore,
    getPoolForMode,
  };
}
