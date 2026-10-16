import React from 'react';
import { Song } from '../types';
import { Music2 } from 'lucide-react';

interface OptionButtonsProps {
  options: Song[];
  onSelect: (song: Song) => void;
  disabled: boolean;
}

export const OptionButtons: React.FC<OptionButtonsProps> = ({
  options,
  onSelect,
  disabled,
}) => {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2">
      {options.map((song, idx) => {
        return (
          <button
            key={song.uri + idx}
            onClick={() => onSelect(song)}
            disabled={disabled}
            className={`group relative flex items-center gap-3 p-3 text-left rounded-xl border transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              disabled
                ? 'bg-[#151520]/50 border-white/5 opacity-50 cursor-not-allowed text-gray-500'
                : 'bg-[#161624] border-white/10 text-gray-200 hover:border-cyan-400 hover:bg-[#1a1a2e] active:scale-[0.98] shadow-sm hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]'
            }`}
          >
            {/* Number badge */}
            <span className="w-6 h-6 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 text-gray-400 text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-white/5 transition-colors">
              {idx + 1}
            </span>

            {/* Thumbnail */}
            {song.artwork ? (
              <img
                src={song.artwork}
                alt=""
                className="w-10 h-10 rounded-lg object-cover bg-black/40 shrink-0 border border-white/10"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                <Music2 className="w-4 h-4 text-gray-500" />
              </div>
            )}

            {/* Song title and artist */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white group-hover:text-cyan-300 truncate transition-colors">
                {song.title}
              </span>
              <span className="text-xs text-gray-400 truncate">
                {song.artist}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
