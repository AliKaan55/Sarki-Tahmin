import React from 'react';
import { X, Headphones, FastForward, Lightbulb, Trophy, Check } from 'lucide-react';

interface HowToModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'tr' | 'en';
}

export const HowToModal: React.FC<HowToModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;
  const isEn = language === 'en';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="howto-modal-title"
    >
      <div className="relative w-full max-w-md bg-[#12121e] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 id="howto-modal-title" className="text-xl font-display uppercase tracking-wider text-white">
            {isEn ? 'How to Play' : 'Nasıl Oynanır?'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rules cards */}
        <div className="flex flex-col gap-3 text-xs font-mono text-gray-300">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white block text-sm mb-0.5">
                {isEn ? '1. Listen to the 1-second clip' : '1. Kesiti Dinle (1 Saniye)'}
              </strong>
              {isEn
                ? 'At the start of each round, you hear a 1-second clip from a Turkish rap song. Press the big circle button to play/stop.'
                : 'Her tur başında şarkının başından 1 saniyelik çok kısa bir kesit dinlersin. Dinlemek veya durdurmak için ortadaki büyük butona bas.'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
              <FastForward className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white block text-sm mb-0.5">
                {isEn ? '2. Guess or Skip to unlock more' : '2. Yanlış Tahmin veya Pas Geç'}
              </strong>
              {isEn
                ? 'Each wrong guess or skip unlocks longer segments: 1s → 2s → 4s → 7s → 11s → 16s.'
                : 'Bilemediğin her tahminde veya Pas Geçtiğinde şarkının daha uzun bir bölümü (1s → 2s → 4s → 7s → 11s → 16s) dinlenebilir hale gelir.'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white block text-sm mb-0.5">
                {isEn ? '3. Hints & Penalties' : '3. İpuçları'}
              </strong>
              {isEn
                ? 'Stuck? Reveal up to 3 hints in order: Genre → Release Year → Artist First Letter (-15% score per hint used).'
                : 'Takılırsan sırasıyla Tür → Çıkış Yılı → Sanatçı Baş Harfi ipuçlarını açabilirsin. Her kullanılan ipucu tur puanını %15 düşürür.'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white block text-sm mb-0.5">
                {isEn ? '4. Difficulty Modes' : '4. Oyun Modları'}
              </strong>
              <ul className="list-disc list-inside space-y-1 text-gray-400 mt-1">
                <li><strong className="text-lime-300">Kolay:</strong> 4 şıklı seçenek (x1.0 puan)</li>
                <li><strong className="text-cyan-300">Orta:</strong> Arama kutusu ile tamamlama (x1.5 puan)</li>
                <li><strong className="text-rose-300">Zor:</strong> Serbest yazım + şarkının ortasından rastgele başlama! (x2.5 puan)</li>
                <li><strong className="text-purple-300">Günlük:</strong> Herkes için ortak tek şarkı (x2.0 puan)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Got it button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff2e93] to-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all mt-1"
        >
          {isEn ? 'Got It, Let’s Play!' : 'Anladım, Başla!'}
        </button>
      </div>
    </div>
  );
};
