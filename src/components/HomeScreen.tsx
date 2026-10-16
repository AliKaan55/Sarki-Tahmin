import React, { useEffect } from 'react';
import { ClipSeconds, QuizMode } from '../types';
import { CONFIG } from '../config';
import { Headphones, Shuffle, Volume2 } from 'lucide-react';

interface HomeScreenProps {
  clipSeconds: ClipSeconds;
  volume: number;
  songCount: number;
  onClipSeconds: (seconds: ClipSeconds) => void;
  onVolume: (volume: number) => void;
  onStart: (mode: QuizMode) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  clipSeconds,
  volume,
  songCount,
  onClipSeconds,
  onVolume,
  onStart,
}) => {
  useEffect(() => {
    const first = document.querySelector<HTMLElement>('[data-tv]');
    first?.focus();
  }, []);

  return (
    <div className="tv-shell flex flex-col justify-between px-16 py-12">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xl tracking-[0.35em] text-cyan-400 uppercase font-mono">Türkçe Rap</p>
          <h1 className="font-display text-7xl text-white mt-2 drop-shadow-[0_0_40px_rgba(255,46,147,0.45)]">
            RAP QUIZ
          </h1>
        </div>
        <p className="text-lg text-gray-400 font-mono">{songCount} şarkı hazır</p>
      </header>

      <div className="grid grid-cols-2 gap-10 mt-8">
        <button
          type="button"
          data-tv
          tabIndex={0}
          className="tv-card text-left p-10 rounded-3xl bg-[#12121e] border-2 border-white/10"
          onClick={() => onStart('intro')}
        >
          <Headphones className="w-14 h-14 text-[#ff2e93] mb-6" />
          <h2 className="font-display text-5xl text-white">INTRO MODU</h2>
          <p className="mt-4 text-2xl text-gray-300 leading-snug">
            Şarkının girişi çalar. 5 saniye düşünün. Cevap gelince rastgele bir yerden devam eder.
          </p>
        </button>

        <button
          type="button"
          data-tv
          tabIndex={0}
          className="tv-card text-left p-10 rounded-3xl bg-[#12121e] border-2 border-white/10"
          onClick={() => onStart('random')}
        >
          <Shuffle className="w-14 h-14 text-cyan-400 mb-6" />
          <h2 className="font-display text-5xl text-white">RASTGELE KESİT</h2>
          <p className="mt-4 text-2xl text-gray-300 leading-snug">
            Şarkının rastgele bir yeri çalar. 5 saniye sonra isim açılır, parça arka planda devam eder.
          </p>
        </button>
      </div>

      <footer className="flex items-center justify-between mt-10">
        <div>
          <p className="text-lg text-gray-400 mb-3">Kesit süresi</p>
          <div className="flex gap-4">
            {CONFIG.CLIP_OPTIONS.map((sec) => (
              <button
                key={sec}
                type="button"
                data-tv
                tabIndex={0}
                onClick={() => onClipSeconds(sec)}
                className={`tv-chip px-8 py-4 rounded-2xl text-2xl font-bold border-2 ${
                  clipSeconds === sec
                    ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300'
                    : 'border-white/10 bg-white/5 text-gray-300'
                }`}
              >
                {sec} sn
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 min-w-[360px]">
          <Volume2 className="w-8 h-8 text-gray-400" />
          <input
            data-tv
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
            className="w-full h-3 accent-cyan-400"
          />
        </div>
      </footer>

      <p className="text-center text-lg text-gray-500 mt-6">
        Kumanda: yön tuşları ile seç · OK ile başlat · Geri ile çık
      </p>
    </div>
  );
};
