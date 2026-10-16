import React, { useState } from 'react';
import { FastForward, Send, Flame } from 'lucide-react';

interface FreeTextInputProps {
  onGuess: (text: string) => void;
  onSkip: () => void;
  nextClipSeconds: number;
  disabled: boolean;
  placeholder?: string;
}

export const FreeTextInput: React.FC<FreeTextInputProps> = ({
  onGuess,
  onSkip,
  nextClipSeconds,
  disabled,
  placeholder = 'Şarkı adını veya "Sanatçı - Şarkı" yaz...',
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;
    onGuess(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 my-2">
      {/* Input container */}
      <div className="relative w-full">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500 pointer-events-none">
          <Flame className="w-4 h-4 fill-rose-500/30" />
        </div>

        <input
          type="text"
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          aria-label="Şarkı adını yaz"
          className={`w-full h-12 pl-10 pr-4 bg-[#141420] text-sm text-white placeholder-gray-500 rounded-xl border border-white/10 transition-all duration-200 outline-none hover:border-rose-500/40 focus:border-rose-500 focus:shadow-[0_0_15px_rgba(244,63,94,0.3)] ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#181824] hover:bg-[#202030] text-gray-300 hover:text-white border border-white/10 text-xs font-mono font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FastForward className="w-4 h-4 text-gray-400" />
          <span>Pas Geç {nextClipSeconds > 0 ? `(+${nextClipSeconds}s)` : ''}</span>
        </button>

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className={`flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 outline-none ${
            text.trim() && !disabled
              ? 'bg-gradient-to-r from-rose-500 to-[#ff2e93] text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] hover:scale-[1.02] active:scale-95'
              : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Tahmin Et</span>
        </button>
      </div>
    </form>
  );
};
