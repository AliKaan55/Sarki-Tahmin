import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Song } from '../types';
import { getAutocompleteSuggestions, normalize } from '../utils/text';
import { Search, Music2, Check, FastForward, Send, X } from 'lucide-react';

interface SearchBoxProps {
  allSongs: Song[];
  onGuess: (song: Song) => void;
  onSkip: () => void;
  nextClipSeconds: number;
  disabled: boolean;
  placeholder?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  allSongs,
  onGuess,
  onSkip,
  nextClipSeconds,
  disabled,
  placeholder = 'Şarkı veya sanatçı adı ara...',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = useMemo(() => {
    if (!query.trim() || selectedSong) return [];
    return getAutocompleteSuggestions(query, allSongs);
  }, [query, selectedSong, allSongs]);

  // Open suggestions when query changes and we haven't locked in a selection
  useEffect(() => {
    if (query.trim().length >= 1 && !selectedSong) {
      setIsOpen(true);
      setSelectedIndex(0);
    } else {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [query, selectedSong]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation inside input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (isOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSong(suggestions[selectedIndex]);
        }
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSong) {
        handleSubmit();
      } else if (suggestions.length > 0) {
        handleSelectSong(suggestions[0]);
      }
    }
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setQuery(`${song.artist} - ${song.title}`);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedSong(null);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!selectedSong || disabled) return;
    onGuess(selectedSong);
    setSelectedSong(null);
    setQuery('');
    setIsOpen(false);
  };

  // Helper to highlight matching text in title / artist
  const renderHighlighted = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return <span>{text}</span>;
    const normText = normalize(text);
    const normQ = normalize(searchQuery);

    const index = normText.indexOf(normQ);
    if (index === -1) return <span>{text}</span>;

    // Approximate highlighting
    const before = text.substring(0, index);
    const match = text.substring(index, index + searchQuery.length);
    const after = text.substring(index + searchQuery.length);

    return (
      <span>
        {before}
        <span className="text-cyan-300 font-bold bg-cyan-950/60 px-0.5 rounded">
          {match}
        </span>
        {after}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-3 my-2">
      {/* Combobox container */}
      <div className="relative w-full">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-gray-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="autocomplete-suggestions-list"
            aria-label="Türkçe rap şarkısı ara"
            value={query}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedSong(null);
            }}
            onFocus={() => {
              if (query.trim() && !selectedSong) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className={`w-full h-12 pl-10 pr-10 bg-[#141420] text-sm text-white placeholder-gray-500 rounded-xl border transition-all duration-200 outline-none ${
              selectedSong
                ? 'border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                : 'border-white/10 hover:border-white/20 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />

          {query && (
            <button
              onClick={handleClearSelection}
              aria-label="Aramayı temizle"
              className="absolute right-3 p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {isOpen && suggestions.length > 0 && (
          <ul
            id="autocomplete-suggestions-list"
            ref={listRef}
            role="listbox"
            aria-label="Arama önerileri"
            className="absolute z-30 left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto bg-[#141422] border border-cyan-500/30 rounded-xl shadow-2xl shadow-black/90 p-1.5 flex flex-col gap-1 backdrop-blur-md"
          >
            {suggestions.map((song, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <li
                  key={song.uri}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectSong(song)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors duration-100 ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                      : 'hover:bg-white/5 text-gray-300 border border-transparent'
                  }`}
                >
                  {/* Thumbnail */}
                  {song.artwork ? (
                    <img
                      src={song.artwork}
                      alt=""
                      className="w-9 h-9 rounded-md object-cover bg-black/40 shrink-0 border border-white/10"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                      <Music2 className="w-4 h-4 text-gray-500" />
                    </div>
                  )}

                  {/* Text */}
                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <span className="text-sm font-semibold truncate text-white">
                      {renderHighlighted(song.title, query)}
                    </span>
                    <span className="text-xs text-gray-400 truncate">
                      {renderHighlighted(song.artist, query)}
                    </span>
                  </div>

                  {/* Popularity indicator dot */}
                  <span
                    title={`Popülerlik: ${song.popularity}`}
                    className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/5 text-gray-400 shrink-0"
                  >
                    ★ {song.popularity}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Action buttons: Skip & Submit */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onSkip}
          disabled={disabled}
          className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#181824] hover:bg-[#202030] text-gray-300 hover:text-white border border-white/10 text-xs font-mono font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FastForward className="w-4 h-4 text-gray-400" />
          <span>Pas Geç {nextClipSeconds > 0 ? `(+${nextClipSeconds}s)` : ''}</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={disabled || !selectedSong}
          className={`flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 outline-none ${
            selectedSong && !disabled
              ? 'bg-gradient-to-r from-[#ff2e93] to-[#ff47a1] text-white shadow-[0_0_20px_rgba(255,46,147,0.45)] hover:shadow-[0_0_25px_rgba(255,46,147,0.65)] hover:scale-[1.02] active:scale-95'
              : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Tahmin Et</span>
        </button>
      </div>
    </div>
  );
};
