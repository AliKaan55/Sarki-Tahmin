import { Song } from '../types';
import { normalize } from '../utils/text';
import { CONFIG } from '../config';

const STORAGE_CACHE_KEY_1 = `${CONFIG.STORAGE_PREFIX}songsData`;
const STORAGE_CACHE_KEY_2 = 'songsData';

// 3 hardcoded placeholder songs as requested (marked as demo)
export const DEMO_SONGS: Song[] = [
  {
    uri: 'spotify:track:demo_ceza_holocaust',
    title: 'Holocaust',
    artist: 'Ceza',
    year: '2004',
    popularity: 90,
    explicit: false,
    genres: 'türkçe hip hop,hardcore rap',
    previewUrl: '',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
    source: 'demo',
    isDemo: true,
  },
  {
    uri: 'spotify:track:demo_sagopa_galiba',
    title: 'Galiba',
    artist: 'Sagopa Kajmer',
    year: '2008',
    popularity: 88,
    explicit: false,
    genres: 'türkçe hip hop,melankolik rap',
    previewUrl: '',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    source: 'demo',
    isDemo: true,
  },
  {
    uri: 'spotify:track:demo_ezhel_geceler',
    title: 'Geceler',
    artist: 'Ezhel',
    year: '2017',
    popularity: 85,
    explicit: true,
    genres: 'türkçe hip hop,trap',
    previewUrl: '',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
    source: 'demo',
    isDemo: true,
  },
];

/**
 * Validates, deduplicates, and cleans raw song items
 */
export function validateAndCleanSongs(rawList: unknown[]): Song[] {
  if (!Array.isArray(rawList)) return [];

  const validSongs: Song[] = [];
  const seen = new Set<string>();

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;

    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    const artist = typeof raw.artist === 'string' ? raw.artist.trim() : '';
    const previewUrl = typeof raw.previewUrl === 'string' ? raw.previewUrl.trim() : '';

    // Validation: drop any entry with no previewUrl, no title, or no artist
    if (!title || !artist || !previewUrl) continue;

    // Coerce popularity to number (default 0)
    let popularity = 0;
    if (typeof raw.popularity === 'number' && !isNaN(raw.popularity)) {
      popularity = Math.max(0, Math.min(100, Math.round(raw.popularity)));
    } else if (typeof raw.popularity === 'string') {
      const parsed = parseInt(raw.popularity, 10);
      if (!isNaN(parsed)) popularity = Math.max(0, Math.min(100, parsed));
    }

    // Deduplicate by normalized title + artist
    const dedupeKey = `${normalize(title)}|${normalize(artist)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const uri = typeof raw.uri === 'string' && raw.uri.trim() 
      ? raw.uri.trim() 
      : `track:${seen.size}_${encodeURIComponent(title.slice(0, 15))}`;

    validSongs.push({
      uri,
      title,
      artist,
      year: typeof raw.year === 'string' ? raw.year.trim() : (typeof raw.year === 'number' ? String(raw.year) : ''),
      popularity,
      explicit: Boolean(raw.explicit),
      genres: typeof raw.genres === 'string' ? raw.genres.trim() : 'türkçe hip hop',
      previewUrl,
      artwork: typeof raw.artwork === 'string' ? raw.artwork.trim() : '',
      source: typeof raw.source === 'string' ? raw.source.trim() : 'itunes',
      isDemo: false,
    });
  }

  return validSongs;
}

/**
 * Reads cached songs from localStorage
 */
export function getCachedSongs(): Song[] | null {
  try {
    const raw1 = localStorage.getItem(STORAGE_CACHE_KEY_1);
    const raw2 = localStorage.getItem(STORAGE_CACHE_KEY_2);
    const data = raw1 || raw2;
    if (!data) return null;
    const parsed = JSON.parse(data);
    const cleaned = validateAndCleanSongs(parsed);
    return cleaned.length > 0 ? cleaned : null;
  } catch (err) {
    console.warn('Could not read cached songs from localStorage:', err);
    return null;
  }
}

/**
 * Saves valid songs to localStorage
 */
export function cacheSongs(songs: Song[]): void {
  try {
    const serialized = JSON.stringify(songs);
    localStorage.setItem(STORAGE_CACHE_KEY_1, serialized);
    localStorage.setItem(STORAGE_CACHE_KEY_2, serialized);
  } catch (err) {
    console.warn('Could not cache songs to localStorage (possibly quota exceeded):', err);
  }
}

/**
 * Clears cached songs from localStorage
 */
export function clearCachedSongs(): void {
  try {
    localStorage.removeItem(STORAGE_CACHE_KEY_1);
    localStorage.removeItem(STORAGE_CACHE_KEY_2);
  } catch (err) {
    console.warn('Could not clear cached songs:', err);
  }
}

/**
 * Startup song loader (fetch-first):
 * 1. Try fetch("./songs.json") and fetch("/songs.json") -> always the freshest file
 * 2. If the file is not reachable, fall back to the localStorage cache
 * 3. Otherwise return "none" so the upload screen is shown
 */
async function fetchSongsFile(url: string): Promise<Song[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const raw = await res.json();
    return validateAndCleanSongs(raw);
  } catch {
    return [];
  }
}

export async function loadInitialSongs(): Promise<{ songs: Song[]; source: 'cache' | 'fetch' | 'none' }> {
  for (const url of ['./songs.json', '/songs.json']) {
    const songs = await fetchSongsFile(url);
    if (songs.length > 0) {
      cacheSongs(songs); // keep the cache in sync with the file
      return { songs, source: 'fetch' };
    }
  }

  const cached = getCachedSongs();
  if (cached && cached.length > 0) {
    return { songs: cached, source: 'cache' };
  }

  return { songs: [], source: 'none' };
}