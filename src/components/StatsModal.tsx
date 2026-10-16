import React, { useState } from 'react';
import { GameMode, GameStats } from '../types';
import { CONFIG } from '../config';
import { X, Flame, Trophy, Percent, Hash, RotateCcw } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: Record<GameMode, GameStats>;
  onResetStats: () => void;
  language: 'tr' | 'en';
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats,
  language,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('medium');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const currentStats = stats[selectedMode] || {
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    highScore: 0,
    guessDistribution: {},
  };

  const winRate =
    currentStats.gamesPlayed > 0
      ? Math.round((currentStats.wins / currentStats.gamesPlayed) * 100)
      : 0;

  const modeConfig = CONFIG.MODES[selectedMode];
  const maxAttempts = modeConfig.attempts;

  // Find max distribution value for bar scaling
  let maxBarCount = 1;
  for (let i = 1; i <= maxAttempts; i++) {
    const c = currentStats.guessDistribution[i] || 0;
    if (c > maxBarCount) maxBarCount = c;
  }
  const lossCount = currentStats.guessDistribution[0] || 0;
  if (lossCount > maxBarCount) maxBarCount = lossCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-modal-title"
    >
      <div className="relative w-full max-w-md bg-[#12121e] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 id="stats-modal-title" className="text-xl font-display uppercase tracking-wider text-white">
            {language === 'en' ? 'Statistics' : 'İstatistikler'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode selector tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#181824] rounded-xl border border-white/5">
          {(['easy', 'medium', 'hard', 'daily'] as GameMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMode(m)}
              className={`py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
                selectedMode === m
                  ? 'bg-gradient-to-r from-[#ff2e93] to-cyan-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {m === 'easy' ? 'Kolay' : m === 'medium' ? 'Orta' : m === 'hard' ? 'Zor' : 'Günlük'}
            </button>
          ))}
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">{language === 'en' ? 'Played' : 'Oynanan'}</div>
            <div className="text-lg font-mono font-bold text-white mt-0.5">{currentStats.gamesPlayed}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">{language === 'en' ? 'Win %' : 'Kazanma'}</div>
            <div className="text-lg font-mono font-bold text-lime-400 mt-0.5">{winRate}%</div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">{language === 'en' ? 'Streak' : 'Seri'}</div>
            <div className="text-lg font-mono font-bold text-amber-400 mt-0.5 flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{currentStats.currentStreak}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">{language === 'en' ? 'Best' : 'En İyi'}</div>
            <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">{currentStats.maxStreak}</div>
          </div>
        </div>

        {/* High score badge */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-mono">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span>{language === 'en' ? 'Mode High Score' : 'En Yüksek Skor'}</span>
          </span>
          <span className="font-bold text-cyan-300 text-sm">{currentStats.highScore} pts</span>
        </div>

        {/* Guess Distribution Chart */}
        <div className="flex flex-col gap-2 mt-1">
          <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">
            {language === 'en' ? 'Guess Distribution' : 'Tahmin Dağılımı'}
          </span>

          <div className="flex flex-col gap-1.5">
            {Array.from({ length: maxAttempts }, (_, i) => i + 1).map((attemptNum) => {
              const count = currentStats.guessDistribution[attemptNum] || 0;
              const widthPct = Math.max(8, Math.round((count / maxBarCount) * 100));

              return (
                <div key={attemptNum} className="flex items-center gap-2 text-xs font-mono">
                  <span className="w-4 text-right text-gray-400 font-bold">{attemptNum}</span>
                  <div className="flex-1 bg-white/5 rounded-md h-6 p-0.5 overflow-hidden flex items-center">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded flex items-center justify-end px-2 text-[11px] font-bold text-white transition-all duration-300 ${
                        count > 0 ? 'bg-cyan-500 shadow-sm' : 'bg-neutral-800'
                      }`}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Losses row */}
            <div className="flex items-center gap-2 text-xs font-mono pt-1">
              <span className="w-4 text-right text-rose-400 font-bold">✗</span>
              <div className="flex-1 bg-white/5 rounded-md h-6 p-0.5 overflow-hidden flex items-center">
                <div
                  style={{ width: `${Math.max(8, Math.round((lossCount / maxBarCount) * 100))}%` }}
                  className={`h-full rounded flex items-center justify-end px-2 text-[11px] font-bold text-white transition-all duration-300 ${
                    lossCount > 0 ? 'bg-rose-600' : 'bg-neutral-800'
                  }`}
                >
                  {lossCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset stats section */}
        <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
          {showConfirmReset ? (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex flex-col gap-2 text-xs font-mono text-rose-200">
              <p>Tüm istatistikleri sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-white"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => {
                    onResetStats();
                    setShowConfirmReset(false);
                  }}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Evet, Sıfırla
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="text-xs font-mono text-gray-500 hover:text-rose-400 flex items-center justify-center gap-1.5 transition-colors py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Reset Stats' : 'İstatistikleri Sıfırla'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
