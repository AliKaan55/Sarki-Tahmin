import React from 'react';
import { GuessAttempt } from '../types';
import { X, Check, FastForward } from 'lucide-react';

interface AttemptListProps {
  totalAttempts: number;
  guesses: GuessAttempt[];
  stageIndex: number;
  gameStatus: 'loading' | 'ready' | 'playing' | 'won' | 'lost';
}

export const AttemptList: React.FC<AttemptListProps> = ({
  totalAttempts,
  guesses,
  stageIndex,
  gameStatus,
}) => {
  const rows = Array.from({ length: totalAttempts }, (_, i) => i);

  return (
    <div className="w-full flex flex-col gap-1.5 my-2">
      {rows.map((index) => {
        const guess = guesses[index];
        const isCurrentActive = index === stageIndex && gameStatus !== 'won' && gameStatus !== 'lost';

        if (guess) {
          if (guess.isCorrect) {
            return (
              <div
                key={index}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-lime-950/40 border border-lime-500/70 text-lime-200 shadow-[0_0_15px_rgba(182,255,59,0.25)] animate-in fade-in"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-5 h-5 rounded-full bg-lime-500/30 text-lime-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span className="text-sm font-semibold truncate">{guess.text}</span>
                </div>
                <span className="text-xs font-mono text-lime-400 font-bold shrink-0 ml-2">✓ DOĞRU</span>
              </div>
            );
          }

          if (guess.isSkipped) {
            return (
              <div
                key={index}
                className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#171722]/80 border border-white/10 text-gray-400"
              >
                <div className="flex items-center gap-2.5 text-xs font-mono">
                  <FastForward className="w-4 h-4 text-gray-500" />
                  <span className="italic">Pas Geçildi</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">#{index + 1}</span>
              </div>
            );
          }

          // Incorrect guess
          return (
            <div
              key={index}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-rose-950/30 border border-rose-500/50 text-rose-200"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                <span className="text-sm font-medium truncate text-gray-200 line-through decoration-rose-500/80">
                  {guess.text}
                </span>
              </div>
              <span className="text-xs font-mono text-rose-400 shrink-0 ml-2">✗</span>
            </div>
          );
        }

        // Empty row
        return (
          <div
            key={index}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200 ${
              isCurrentActive
                ? 'bg-[#151522] border-cyan-500/50 shadow-[0_0_12px_rgba(0,229,255,0.15)] text-gray-400'
                : 'bg-[#101018]/50 border-white/5 text-gray-600'
            }`}
          >
            <span className="text-xs font-mono select-none">
              {index + 1}. Deneme
            </span>
            {isCurrentActive && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Sıradaki
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
