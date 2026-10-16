export interface Song {
  uri: string;
  title: string;
  artist: string;
  year: string;
  popularity: number;
  explicit: boolean;
  genres: string;
  previewUrl: string;
  artwork: string;
  source: string;
  isDemo?: boolean;
}

export type QuizMode = 'intro' | 'random';

export type ClipSeconds = 2 | 3 | 5;

export type QuizPhase = 'idle' | 'loading' | 'clip' | 'think' | 'reveal';

export type GameMode = 'easy' | 'medium' | 'hard' | 'daily';
export type GameStatus = 'loading' | 'ready' | 'playing' | 'won' | 'lost';

export interface GuessAttempt {
  text: string;
  songUri?: string;
  isSkipped: boolean;
  isCorrect: boolean;
  stageIndex: number;
  timestamp: number;
}

export interface ModeConfig {
  id: GameMode;
  nameKey: string;
  attempts: number;
  clipLengths: number[];
  inputMethod: 'options' | 'search' | 'free';
  scoreMultiplier: number;
  minPopularity?: number;
  maxPopularity?: number;
  randomOffset?: boolean;
}

export interface GameStats {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  highScore: number;
  guessDistribution: Record<number, number>;
}

export interface DailyResult {
  date: string;
  songUri: string;
  won: boolean;
  attemptsUsed: number;
  score: number;
  guesses: GuessAttempt[];
}

export interface Settings {
  volume: number;
  autoPlay: boolean;
  language: 'tr' | 'en';
  reduceMotion: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}
