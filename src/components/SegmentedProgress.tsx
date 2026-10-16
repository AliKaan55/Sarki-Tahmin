import React from 'react';
import { GuessAttempt } from '../types';

interface SegmentedProgressProps {
  clipLengths: number[];
  stageIndex: number;
  guesses: GuessAttempt[];
  currentTime: number;
  startOffset: number;
  isPlaying: boolean;
  gameStatus: 'ready' | 'playing' | 'won' | 'lost' | 'loading';
}

export const SegmentedProgress: React.FC<SegmentedProgressProps> = ({
  clipLengths,
  stageIndex,
  guesses,
  currentTime,
  startOffset,
  isPlaying,
  gameStatus,
}) => {
  const maxSeconds = clipLengths[clipLengths.length - 1] || 16;
  const currentUnlocked = clipLengths[stageIndex] || 1;

  // Segments calculate individual slice lengths:
  // e.g. for [1, 2, 4, 7, 11] -> slice widths are 1, 1, 2, 3, 4
  const segments = clipLengths.map((len, idx) => {
    const prevLen = idx === 0 ? 0 : clipLengths[idx - 1];
    const slice = len - prevLen;
    const widthPercent = (slice / maxSeconds) * 100;
    return {
      index: idx,
      targetLen: len,
      slice,
      widthPercent,
    };
  });

  // Calculate current playback progress relative to maxSeconds
  const elapsedSinceStart = Math.max(0, currentTime - startOffset);
  const playheadPercent = Math.min(100, (elapsedSinceStart / maxSeconds) * 100);
  const unlockedPercent = (currentUnlocked / maxSeconds) * 100;

  return (
    <div className="w-full flex flex-col gap-1.5 my-2">
      {/* Outer segmented bar container */}
      <div 
        className="relative w-full h-4 bg-[#14141f] rounded-lg p-0.5 border border-white/10 overflow-hidden flex items-stretch gap-1 shadow-inner"
        role="progressbar"
        aria-valuenow={elapsedSinceStart}
        aria-valuemin={0}
        aria-valuemax={currentUnlocked}
        aria-label="Audio clip progression"
      >
        {/* Active playhead line overlay */}
        {isPlaying && (
          <div
            className="absolute top-0 bottom-0 left-0 bg-cyan-400/30 z-20 pointer-events-none transition-none"
            style={{ width: `${playheadPercent}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-cyan-300 shadow-[0_0_8px_#00e5ff]" />
          </div>
        )}

        {/* Individual segments */}
        {segments.map((seg) => {
          const isPast = seg.index < guesses.length;
          const isCurrent = seg.index === stageIndex && gameStatus !== 'won' && gameStatus !== 'lost';
          const guess = guesses[seg.index];

          let segBg = 'bg-[#1b1b26]/70';
          let borderStyle = 'border-transparent';

          if (isPast && guess) {
            if (guess.isCorrect) {
              segBg = 'bg-lime-400/90 shadow-[0_0_10px_rgba(182,255,59,0.5)]';
            } else if (guess.isSkipped) {
              segBg = 'bg-neutral-600/90';
            } else {
              segBg = 'bg-rose-500/90 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
            }
          } else if (isCurrent) {
            segBg = 'bg-cyan-950/60';
            borderStyle = 'border border-cyan-400/80 shadow-[0_0_8px_rgba(0,229,255,0.4)]';
          } else if (seg.index < stageIndex) {
            segBg = 'bg-neutral-800/80';
          }

          return (
            <div
              key={seg.index}
              style={{ width: `${seg.widthPercent}%` }}
              className={`relative h-full rounded-sm transition-all duration-200 ${segBg} ${borderStyle} flex items-center justify-center`}
            >
              {/* Length indicator label on wider segments */}
              {seg.slice >= 2 && (
                <span className="text-[9px] font-mono font-semibold text-white/40 select-none">
                  {seg.targetLen}s
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Time indicators */}
      <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
        <span>0:00</span>
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Açılan: {currentUnlocked.toFixed(currentUnlocked < 1 ? 1 : 0)}s</span>
        </div>
        <span>0:{maxSeconds < 10 ? `0${maxSeconds}` : maxSeconds}</span>
      </div>
    </div>
  );
};
