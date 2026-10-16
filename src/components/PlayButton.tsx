import React from 'react';
import { Play, Square, Loader2 } from 'lucide-react';

interface PlayButtonProps {
  isPlaying: boolean;
  isLoading: boolean;
  isReady: boolean;
  onToggle: () => void;
  clipLength: number;
  reduceMotion?: boolean;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  isPlaying,
  isLoading,
  isReady,
  onToggle,
  clipLength,
  reduceMotion = false,
}) => {
  const disabled = isLoading || !isReady;

  return (
    <div className="relative flex flex-col items-center justify-center my-4">
      {/* Outer pulsing glow halo when playing */}
      {isPlaying && !reduceMotion && (
        <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-cyan-400/20 blur-xl animate-pulse pointer-events-none" />
      )}

      {/* Main button */}
      <button
        onClick={onToggle}
        disabled={disabled}
        aria-label={isPlaying ? 'Durdur' : `Kesiti Oynat (${clipLength}s)`}
        className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-cyan-400 ${
          disabled
            ? 'bg-[#181824] text-gray-600 border border-white/5 cursor-not-allowed'
            : isPlaying
            ? 'bg-[#0f172a] text-[#ff2e93] border-2 border-[#ff2e93] shadow-[0_0_30px_rgba(255,46,147,0.5)] active:scale-95'
            : 'bg-gradient-to-br from-[#1c1c2e] to-[#12121e] text-[#00e5ff] border-2 border-[#00e5ff] shadow-[0_0_25px_rgba(0,229,255,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.6)] hover:scale-105 active:scale-95'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 animate-spin text-cyan-400" />
        ) : isPlaying ? (
          <div className="flex flex-col items-center justify-center gap-1">
            <Square className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
            {/* Equalizer bars */}
            {!reduceMotion && (
              <div className="flex items-end gap-1 h-3">
                <span className="w-1 bg-[#ff2e93] rounded-full bar-anim-1" />
                <span className="w-1 bg-[#ff2e93] rounded-full bar-anim-2" />
                <span className="w-1 bg-[#ff2e93] rounded-full bar-anim-3" />
                <span className="w-1 bg-[#ff2e93] rounded-full bar-anim-4" />
                <span className="w-1 bg-[#ff2e93] rounded-full bar-anim-5" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-current translate-x-0.5" />
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider mt-0.5 text-cyan-300">
              {clipLength}s
            </span>
          </div>
        )}
      </button>

      {/* Subtitle helper */}
      <div className="text-[11px] font-mono tracking-wider text-gray-400 mt-2.5 flex items-center gap-1.5 select-none">
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-semibold text-gray-300 bg-white/10 rounded border border-white/15">
          BOŞLUK
        </kbd>
        <span>{isPlaying ? 'Durdurmak için tıkla' : 'Dinlemek için bas'}</span>
      </div>
    </div>
  );
};
