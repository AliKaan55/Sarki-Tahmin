import React from 'react';
import { Settings } from '../types';
import { X, Volume2, PlayCircle, Globe, EyeOff, RefreshCw, UploadCloud } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Partial<Settings>) => void;
  onReloadSongs: () => void;
  onOpenUploader: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onReloadSongs,
  onOpenUploader,
}) => {
  if (!isOpen) return null;

  const isEn = settings.language === 'en';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="relative w-full max-w-md bg-[#12121e] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 id="settings-modal-title" className="text-xl font-display uppercase tracking-wider text-white">
            {isEn ? 'Settings' : 'Ayarlar'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings options list */}
        <div className="flex flex-col gap-4 text-xs font-mono">
          {/* Volume slider */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-300 font-semibold">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>{isEn ? 'Audio Volume' : 'Ses Seviyesi'}</span>
              </span>
              <span className="text-cyan-400 font-bold">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#1b1b28] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Autoplay after guess toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex flex-col gap-0.5 max-w-[75%]">
              <span className="flex items-center gap-2 text-gray-300 font-semibold">
                <PlayCircle className="w-4 h-4 text-pink-400" />
                <span>{isEn ? 'Auto-play after guess' : 'Tahminden sonra otomatik çal'}</span>
              </span>
              <span className="text-[10px] text-gray-500">
                {isEn ? 'Plays longer clip after wrong guess or skip' : 'Yanlış tahmin veya pas sonrası yeni kesiti hemen oynatır'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoPlay}
                onChange={(e) => onUpdateSettings({ autoPlay: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 shadow-inner"></div>
            </label>
          </div>

          {/* Language selector */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="flex items-center gap-2 text-gray-300 font-semibold">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>{isEn ? 'Language' : 'Dil'}</span>
            </span>
            <div className="flex items-center gap-1 bg-[#181824] p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => onUpdateSettings({ language: 'tr' })}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  settings.language === 'tr' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                TR
              </button>
              <button
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  settings.language === 'en' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Reduce motion toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex flex-col gap-0.5 max-w-[75%]">
              <span className="flex items-center gap-2 text-gray-300 font-semibold">
                <EyeOff className="w-4 h-4 text-purple-400" />
                <span>{isEn ? 'Reduce Motion' : 'Hareketi Azalt'}</span>
              </span>
              <span className="text-[10px] text-gray-500">
                {isEn ? 'Disables pulsing glow and confetti' : 'Parıltı ve konfeti animasyonlarını kapatır'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => onUpdateSettings({ reduceMotion: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 shadow-inner"></div>
            </label>
          </div>

          {/* Song list management actions */}
          <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
            <button
              onClick={() => {
                onReloadSongs();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>{isEn ? 'Reload Song List (Clear Cache)' : 'Şarkı Listesini Yeniden Yükle'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenUploader();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>{isEn ? 'Load Custom songs.json File' : 'Farklı songs.json Dosyası Yükle'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
