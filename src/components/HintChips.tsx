import React from 'react';
import { Song } from '../types';
import { Lightbulb, Tag, Calendar, User } from 'lucide-react';
import { CONFIG } from '../config';

interface HintChipsProps {
  hintsUsed: number;
  song: Song | null;
  onUseHint: () => void;
  disabled: boolean;
  isDailyMode?: boolean;
}

export const HintChips: React.FC<HintChipsProps> = ({
  hintsUsed,
  song,
  onUseHint,
  disabled,
  isDailyMode = false,
}) => {
  if (!song) return null;

  const maxHints = CONFIG.HINTS_MAX;
  const canUseMore = hintsUsed < maxHints && !disabled;
  const isDailyDisabled = isDailyMode && !CONFIG.DAILY_HINTS_ENABLED;

  // Extract hints
  // Hint 1: Genres
  const genres = song.genres ? song.genres.split(',').slice(0, 2).join(' • ') : 'türkçe hip hop';
  // Hint 2: Year
  const year = song.year || 'Bilinmiyor';
  // Hint 3: First letter of artist
  const firstLetter = song.artist ? song.artist.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className="w-full flex flex-col gap-2 my-2">
      {/* Revealed hints chips container */}
      {hintsUsed > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-in fade-in">
          {hintsUsed >= 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-sm">
              <Tag className="w-3 h-3 text-cyan-400" />
              <span>Tür: <strong className="text-white font-semibold">{genres}</strong></span>
            </div>
          )}

          {hintsUsed >= 2 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono shadow-sm">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>Yıl: <strong className="text-white font-semibold">{year}</strong></span>
            </div>
          )}

          {hintsUsed >= 3 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/60 border border-pink-500/40 text-pink-300 text-xs font-mono shadow-sm">
              <User className="w-3 h-3 text-pink-400" />
              <span>Sanatçı Baş Harfi: <strong className="text-white font-bold text-sm">{firstLetter}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Trigger button */}
      {!isDailyDisabled && (
        <div className="flex items-center justify-between">
          <button
            onClick={onUseHint}
            disabled={!canUseMore}
            className={`flex items-center gap-2 text-xs font-mono transition-all duration-150 px-3 py-1.5 rounded-lg border ${
              canUseMore
                ? 'bg-[#181824] text-amber-400 border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/30 active:scale-95'
                : 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed opacity-60'
            }`}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${hintsUsed > 0 ? 'text-amber-400' : 'text-gray-400'}`} />
            <span>
              {hintsUsed < maxHints
                ? `İpucu Al (-%15 Puan) [${hintsUsed}/${maxHints}]`
                : 'Tüm İpuçları Açıldı'}
            </span>
          </button>

          {hintsUsed > 0 && (
            <span className="text-[11px] font-mono text-amber-400/80">
              -%{hintsUsed * 15} Puan Cezası
            </span>
          )}
        </div>
      )}
    </div>
  );
};
