import React, { useState, useRef } from 'react';
import { Song } from '../types';
import { validateAndCleanSongs, cacheSongs, DEMO_SONGS } from '../data/loadSongs';
import { UploadCloud, FileJson, CheckCircle2, AlertTriangle, ArrowRight, Music, X } from 'lucide-react';

interface SongUploaderProps {
  onSongsLoaded: (songs: Song[]) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export const SongUploader: React.FC<SongUploaderProps> = ({
  onSongsLoaded,
  onCancel,
  showCancel = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processJsonText = (jsonText: string) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const parsed = JSON.parse(jsonText);
      const cleaned = validateAndCleanSongs(parsed);

      if (cleaned.length === 0) {
        setErrorMsg('Dosyada geçerli şarkı bulunamadı. Şarkılarda "title", "artist" ve "previewUrl" alanları bulunmalıdır.');
        setIsLoading(false);
        return;
      }

      cacheSongs(cleaned);
      setSuccessCount(cleaned.length);
      setIsLoading(false);

      setTimeout(() => {
        onSongsLoaded(cleaned);
      }, 1000);
    } catch {
      setErrorMsg('Geçersiz JSON dosyası. Lütfen JSON sözdizimini kontrol edin.');
      setIsLoading(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setErrorMsg('Lütfen sadece .json uzantılı bir dosya seçin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        processJsonText(content);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Dosya okunamadı.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Quick fallback to load public/songs.json if available or demo songs
  const handleLoadDefaultCurated = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('./songs.json');
      if (res.ok) {
        const raw = await res.json();
        const cleaned = validateAndCleanSongs(raw);
        if (cleaned.length > 0) {
          cacheSongs(cleaned);
          setSuccessCount(cleaned.length);
          setTimeout(() => onSongsLoaded(cleaned), 800);
          return;
        }
      }
    } catch {
      // ignore
    }

    // fallback to demo
    cacheSongs(DEMO_SONGS);
    setSuccessCount(DEMO_SONGS.length);
    setTimeout(() => onSongsLoaded(DEMO_SONGS), 800);
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 bg-[#12121e] border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-4 text-center my-auto animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-left">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-display uppercase tracking-wider text-white">
              Şarkı Listeni Yükle
            </h2>
            <p className="text-[11px] font-mono text-gray-400">
              Türkçe Rap Heardle Kütüphanesi
            </p>
          </div>
        </div>

        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-300 font-mono leading-relaxed">
        Oynamak için kendi hazırladığın <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded">songs.json</code> dosyasını yükleyebilirsin.
      </p>

      {/* Drag & drop box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full py-8 px-4 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/40 scale-[1.02]'
            : 'border-white/20 bg-white/5 hover:border-cyan-400/60 hover:bg-white/10'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <FileJson className="w-10 h-10 text-cyan-400 animate-pulse" />
        <div className="text-xs font-mono font-semibold text-gray-200">
          songs.json dosyasını buraya sürükle bırak
        </div>
        <div className="text-[11px] font-mono text-gray-500">
          veya cihazından seçmek için tıkla
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* Error / Success state */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono text-left">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successCount !== null && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-lime-950/40 border border-lime-500/50 text-lime-300 text-xs font-mono text-left">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-lime-400" />
          <span><strong>{successCount}</strong> adet geçerli şarkı başarıyla yüklendi! Başlatılıyor...</span>
        </div>
      )}

      {/* Quick curated button */}
      <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
        <button
          onClick={handleLoadDefaultCurated}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff2e93] to-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          <Music className="w-4 h-4" />
          <span>Hazır Türkçe Rap Kütüphanesini Kullan (470+ Şarkı)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
