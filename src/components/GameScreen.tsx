import React, { useEffect } from 'react';
import { Song, GameMode, GuessAttempt, GameStats, Settings } from '../types';
import { CONFIG } from '../config';
import { SegmentedProgress } from './SegmentedProgress';
import { PlayButton } from './PlayButton';
import { AttemptList } from './AttemptList';
import { HintChips } from './HintChips';
import { OptionButtons } from './OptionButtons';
import { SearchBox } from './SearchBox';
import { FreeTextInput } from './FreeTextInput';
import { ArrowLeft, Flame, Trophy } from 'lucide-react';

interface GameScreenProps {
  mode: GameMode;
  song: Song;
  stageIndex: number;
  guesses: GuessAttempt[];
  hintsUsed: number;
  startOffset: number;
  stats: GameStats;
  sessionScore: number;
  allSongs: Song[];
  easyOptions: Song[];
  isPlaying: boolean;
  isLoading: boolean;
  isReady: boolean;
  currentTime: number;
  settings: Settings;
  onTogglePlay: (offset: number, length: number) => void;
  onGuess: (guess: string | Song) => void;
  onSkip: () => void;
  onUseHint: () => void;
  onBackToMenu: () => void;
  calculatePotentialScore: (attempt: number, mode: GameMode, hints: number) => number;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  mode,
  song,
  stageIndex,
  guesses,
  hintsUsed,
  startOffset,
  stats,
  sessionScore,
  allSongs,
  easyOptions,
  isPlaying,
  isLoading,
  isReady,
  currentTime,
  settings,
  onTogglePlay,
  onGuess,
  onSkip,
  onUseHint,
  onBackToMenu,
  calculatePotentialScore,
}) => {
  const config = CONFIG.MODES[mode];
  const clipLength = config.clipLengths[stageIndex] || 1;
  const nextClipSeconds = stageIndex + 1 < config.attempts ? config.clipLengths[stageIndex + 1] - clipLength : 0;
  const potentialScore = calculatePotentialScore(stageIndex + 1, mode, hintsUsed);

  // Keyboard shortcuts (Space = play/stop, S = skip, H = hint)
  // ONLY when user is not typing in a text input or textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isReady && !isLoading) {
          onTogglePlay(startOffset, clipLength);
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (isReady && !isLoading) {
          onSkip();
        }
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        onUseHint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady, isLoading, startOffset, clipLength, onTogglePlay, onSkip, onUseHint]);

  const modeBadgeColor =
    mode === 'easy'
      ? 'border-lime-500/50 text-lime-300 bg-lime-950/40'
      : mode === 'medium'
      ? 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40'
      : mode === 'hard'
      ? 'border-rose-500/50 text-rose-300 bg-rose-950/40'
      : 'border-purple-500/50 text-purple-300 bg-purple-950/40';

  const modeName =
    mode === 'easy' ? 'Kolay' : mode === 'medium' ? 'Orta' : mode === 'hard' ? 'Zor' : 'Günlük';

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center py-2 px-1 animate-in fade-in duration-200">
      {/* 1. Top bar */}
      <div className="w-full flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        {/* Back button & mode badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToMenu}
            aria-label="Menüye Dön"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase border ${modeBadgeColor}`}>
            {modeName}
          </span>
        </div>

        {/* Potential score & streak */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold" title="Mevcut denemedeki olası puan">
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span>{potentialScore} pts</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono text-amber-400 font-bold" title="Kazanma serisi">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{stats.currentStreak}</span>
          </div>
        </div>
      </div>

      {/* 2. Segmented progress bar */}
      <SegmentedProgress
        clipLengths={config.clipLengths}
        stageIndex={stageIndex}
        guesses={guesses}
        currentTime={currentTime}
        startOffset={startOffset}
        isPlaying={isPlaying}
        gameStatus="ready"
      />

      {/* 3. Circular Play Button with Equalizer */}
      <PlayButton
        isPlaying={isPlaying}
        isLoading={isLoading}
        isReady={isReady}
        onToggle={() => onTogglePlay(startOffset, clipLength)}
        clipLength={clipLength}
        reduceMotion={settings.reduceMotion}
      />

      {/* 4. Attempt list */}
      <AttemptList
        totalAttempts={config.attempts}
        guesses={guesses}
        stageIndex={stageIndex}
        gameStatus="ready"
      />

      {/* 5. Hint chips */}
      <HintChips
        hintsUsed={hintsUsed}
        song={song}
        onUseHint={onUseHint}
        disabled={!isReady || isLoading}
        isDailyMode={mode === 'daily'}
      />

      {/* 6. Mode-specific input area */}
      <div className="w-full mt-2">
        {mode === 'easy' && (
          <div className="flex flex-col gap-2">
            <OptionButtons
              options={easyOptions}
              onSelect={onGuess}
              disabled={!isReady || isLoading}
            />

            <button
              onClick={onSkip}
              disabled={!isReady || isLoading}
              className="w-full h-10 rounded-xl bg-[#161622] hover:bg-[#1e1e2e] text-gray-400 hover:text-white border border-white/5 text-xs font-mono font-medium transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pas Geç {nextClipSeconds > 0 ? `(+${nextClipSeconds}s)` : ''}
            </button>
          </div>
        )}

        {(mode === 'medium' || mode === 'daily') && (
          <SearchBox
            allSongs={allSongs}
            onGuess={onGuess}
            onSkip={onSkip}
            nextClipSeconds={nextClipSeconds}
            disabled={!isReady || isLoading}
          />
        )}

        {mode === 'hard' && (
          <FreeTextInput
            onGuess={onGuess}
            onSkip={onSkip}
            nextClipSeconds={nextClipSeconds}
            disabled={!isReady || isLoading}
          />
        )}
      </div>
    </div>
  );
};
