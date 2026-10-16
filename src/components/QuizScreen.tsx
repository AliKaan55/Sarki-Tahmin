import React, { useEffect } from 'react';
import { QuizMode, QuizPhase, Song } from '../types';
import { CONFIG } from '../config';

interface QuizScreenProps {
  mode: QuizMode;
  phase: QuizPhase;
  song: Song | null;
  round: number;
  thinkLeft: number;
  clipSeconds: number;
  isPlaying: boolean;
  onNext: () => void;
  onMenu: () => void;
  onSkipWait: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  mode,
  phase,
  song,
  round,
  thinkLeft,
  clipSeconds,
  isPlaying,
  onNext,
  onMenu,
  onSkipWait,
}) => {
  const revealed = phase === 'reveal';

  useEffect(() => {
    const id = window.setTimeout(() => {
      const target = revealed
        ? document.querySelector<HTMLElement>('[data-tv-next]')
        : document.querySelector<HTMLElement>('[data-tv]');
      target?.focus();
    }, 50);
    return () => window.clearTimeout(id);
  }, [revealed, phase]);

  const headline =
    phase === 'loading'
      ? 'Yükleniyor…'
      : phase === 'clip'
        ? 'Dinle'
        : phase === 'think'
          ? 'Tahmin et'
          : 'Cevap';

  const sub =
    phase === 'clip'
      ? mode === 'intro'
        ? `Intro · ${clipSeconds} saniye`
        : `Rastgele kesit · ${clipSeconds} saniye`
      : phase === 'think'
        ? 'Cevabı söyleyin'
        : phase === 'reveal'
          ? mode === 'intro'
            ? 'Rastgele bir yerden çalıyor'
            : 'Şarkı arka planda çalıyor'
          : 'Şarkı hazırlanıyor';

  return (
    <div className="tv-shell flex flex-col px-16 py-10">
      <header className="flex items-center justify-between">
        <span className="px-5 py-2 rounded-xl border border-white/15 text-xl font-mono text-cyan-300">
          {mode === 'intro' ? 'INTRO' : 'RASTGELE'}
        </span>
        <span className="text-2xl font-mono text-gray-400">Tur {round}</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative mb-8">
          {song?.artwork && revealed ? (
            <img
              src={song.artwork}
              alt=""
              className="w-64 h-64 rounded-3xl object-cover shadow-[0_0_50px_rgba(255,46,147,0.35)]"
            />
          ) : (
            <div className="w-64 h-64 rounded-3xl bg-[#161624] border-2 border-white/10 flex items-center justify-center">
              <div className={`eq ${isPlaying ? 'eq-on' : ''}`}>
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        <p className="text-2xl tracking-[0.3em] uppercase text-cyan-400 font-mono">{headline}</p>

        {revealed && song ? (
          <>
            <h2 className="font-display text-6xl text-white mt-4 max-w-5xl leading-none">{song.title}</h2>
            <p className="text-3xl text-gray-300 mt-4">{song.artist}</p>
            {song.year ? <p className="text-xl text-gray-500 mt-2">{song.year}</p> : null}
          </>
        ) : (
          <>
            <h2 className="font-display text-6xl text-white/90 mt-4">Hangi şarkı?</h2>
            {phase === 'think' ? (
              <p className="text-8xl font-display text-[#ff2e93] mt-6">{thinkLeft}</p>
            ) : (
              <p className="text-2xl text-gray-400 mt-6">{sub}</p>
            )}
          </>
        )}

        {revealed ? <p className="text-xl text-gray-400 mt-6">{sub}</p> : null}
      </div>

      <footer className="flex items-center justify-between">
        <button type="button" data-tv tabIndex={0} className="tv-btn" onClick={onMenu}>
          Menü
        </button>

        {phase === 'think' || phase === 'clip' ? (
          <button type="button" data-tv tabIndex={0} className="tv-btn" onClick={onSkipWait}>
            Cevabı göster
          </button>
        ) : (
          <button
            type="button"
            data-tv
            data-tv-next
            tabIndex={0}
            className="tv-btn tv-btn-primary"
            onClick={onNext}
            disabled={phase === 'loading'}
          >
            Sonraki şarkı
          </button>
        )}
      </footer>

      <p className="text-center text-lg text-gray-500 mt-4">
        {phase === 'reveal'
          ? 'OK: sonraki şarkı · Geri: menü'
          : `Kesit ${clipSeconds}s · Bekleme ${CONFIG.THINK_SECONDS}s · OK: cevabı göster`}
      </p>
    </div>
  );
};
