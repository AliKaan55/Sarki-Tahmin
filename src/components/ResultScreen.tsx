import React, { useState, useEffect } from 'react';
import { Song, GameMode, GuessAttempt, GameStats } from '../types';
import { CONFIG } from '../config';
import { Play, Pause, Share2, ArrowRight, Home, Flame, Music, Sparkles } from 'lucide-react';

interface ResultScreenProps {
  status: 'won' | 'lost';
  song: Song;
  mode: GameMode;
  stageIndex: number;
  guesses: GuessAttempt[];
  hintsUsed: number;
  roundScore: number;
  sessionScore: number;
  stats: GameStats;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: (offset: number, length: number, fullMode: boolean) => void;
  onSeek: (time: number) => void;
  onNextRound: () => void;
  onBackToMenu: () => void;
  showToast: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  status,
  song,
  mode,
  stageIndex,
  guesses,
  hintsUsed,
  roundScore,
  sessionScore,
  stats,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onNextRound,
  onBackToMenu,
  showToast,
}) => {
  const isWon = status === 'won';
  const config = CONFIG.MODES[mode];
  const [countdown, setCountdown] = useState<string>('');

  // Daily countdown timer to next UTC/local midnight
  useEffect(() => {
    if (mode !== 'daily') return;

    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diff = Math.max(0, tomorrow.getTime() - now.getTime());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  // Generate Wordle-style share text
  // e.g.: 🎤 1 SANİYE (Orta) 🟥🟥🟩⬜⬜ 1350 pts
  const handleShare = () => {
    const modeName = mode === 'easy' ? 'Kolay' : mode === 'medium' ? 'Orta' : mode === 'hard' ? 'Zor' : 'Günlük';
    const totalSlots = config.attempts;

    let emojis = '';
    for (let i = 0; i < totalSlots; i++) {
      const g = guesses[i];
      if (!g) {
        emojis += '⬜';
      } else if (g.isCorrect) {
        emojis += '🟩';
      } else if (g.isSkipped) {
        emojis += '⬛';
      } else {
        emojis += '🟥';
      }
    }

    const shareText = `🎤 1 SANİYE (${modeName})\n${emojis} ${roundScore} puan\n🔥 Seri: ${stats.currentStreak}\n#1Saniye #TürkçeRap`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Sonuç panoya kopyalandı!', 'success');
      }).catch(() => {
        showToast('Kopyalama başarısız oldu.', 'warning');
      });
    } else {
      showToast('Panoya erişilemedi.', 'warning');
    }
  };

  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? `0${rem}` : rem}`;
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Banner */}
      <div
        className={`w-full text-center py-3 px-4 rounded-2xl border ${
          isWon
            ? 'bg-lime-950/40 border-lime-500/60 shadow-[0_0_25px_rgba(182,255,59,0.25)]'
            : 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.25)]'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isWon && <Sparkles className="w-5 h-5 text-lime-400" />}
          <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider text-white">
            {isWon ? 'TEBRİKLER! BİLDİN!' : 'BU SEFER OLMADI!'}
          </h2>
          {isWon && <Sparkles className="w-5 h-5 text-lime-400" />}
        </div>
        <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
          {isWon
            ? stageIndex === 0
              ? '⚡ Efsanevi! İlk saniyeden tanıdın!'
              : `${stageIndex + 1}. denemede doğru tahmin ettin.`
            : 'Doğru cevap aşağıda. Bir sonrakinde şansını dene!'}
        </p>
      </div>

      {/* Song details card */}
      <div className="w-full bg-[#12121e] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xl">
        {/* Artwork */}
        <div className="relative group shrink-0">
          {song.artwork ? (
            <img
              src={song.artwork}
              alt={song.title}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover shadow-2xl border border-white/10"
            />
          ) : (
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Music className="w-10 h-10 text-gray-500" />
            </div>
          )}

          {song.explicit && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold bg-neutral-900/90 text-white rounded border border-white/20">
              E
            </span>
          )}
        </div>

        {/* Text info */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-white truncate max-w-full">
            {song.title}
          </h3>
          <p className="text-base text-cyan-400 font-medium truncate max-w-full">
            {song.artist}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
            {song.year && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                {song.year}
              </span>
            )}
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
              Popülerlik: {song.popularity}
            </span>
            {song.genres && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 truncate max-w-[150px]">
                {song.genres.split(',')[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 30-second Full Player */}
      <div className="w-full bg-[#12121e] border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5 shadow-lg">
        <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
          <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Tam Kesit (30 saniye)
          </span>
          <span>{formatTime(currentTime)} / {formatTime(duration || 30)}</span>
        </div>

        {/* Seek bar */}
        <div className="relative w-full flex items-center group">
          <input
            type="range"
            min={0}
            max={duration || 30}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            aria-label="Şarkı çalma konumu"
            className="w-full h-2 bg-[#1e1e2d] rounded-lg appearance-none cursor-pointer accent-[#00e5ff] focus:outline-none"
          />
        </div>

        {/* Play/pause toggle */}
        <div className="flex items-center justify-center mt-1">
          <button
            onClick={() => onTogglePlay(0, 30, true)}
            aria-label={isPlaying ? 'Durdur' : 'Tam Kesiti Çal'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.35)] active:scale-95 transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Durdur</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Dinle (30s)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Score breakdown card */}
      <div className="w-full bg-[#141422] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-mono uppercase text-gray-400">Puan Hesabı</span>
          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>Seri: {stats.currentStreak}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">Temel Puan</div>
            <div className="text-sm font-mono font-bold text-white">
              {isWon ? CONFIG.BASE_POINTS[Math.min(stageIndex, CONFIG.BASE_POINTS.length - 1)] : 0}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">Mod Çarpanı</div>
            <div className="text-sm font-mono font-bold text-cyan-400">
              x{config.scoreMultiplier.toFixed(1)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">İpucu Kesintisi</div>
            <div className="text-sm font-mono font-bold text-amber-400">
              -%{hintsUsed * 15}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-lime-950/30 border border-lime-500/30">
            <div className="text-[10px] font-mono text-lime-400 font-semibold">Toplam</div>
            <div className="text-sm font-mono font-bold text-lime-300">
              +{roundScore} pts
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-1">
          <span>Oturum Toplamı: <strong className="text-white">{sessionScore} pts</strong></span>
          <span>Mod Rekoru: <strong className="text-cyan-300">{stats.highScore} pts</strong></span>
        </div>
      </div>

      {/* Daily mode countdown if applicable */}
      {mode === 'daily' && countdown && (
        <div className="w-full text-center py-2 px-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono text-cyan-300">
          Yeni Günlük Şarkı: <span className="font-bold text-white ml-1">{countdown}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-1">
        {mode !== 'daily' ? (
          <button
            onClick={onNextRound}
            className="flex-1 flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-gradient-to-r from-[#ff2e93] to-[#ff47a1] text-white text-sm font-mono font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,46,147,0.4)] hover:shadow-[0_0_25px_rgba(255,46,147,0.6)] active:scale-95 transition-all"
          >
            <span>Sıradaki Şarkı</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex-1 text-center py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
            Günün şarkısını tamamladın!
          </div>
        )}

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-[#1a1a2c] hover:bg-[#222238] text-cyan-300 border border-cyan-500/40 text-sm font-mono font-semibold transition-all active:scale-95"
        >
          <Share2 className="w-4 h-4 text-cyan-400" />
          <span>Paylaş</span>
        </button>

        <button
          onClick={onBackToMenu}
          className="flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 text-sm font-mono transition-all active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span className="sm:hidden">Menü</span>
        </button>
      </div>
    </div>
  );
};
