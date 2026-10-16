import { Song } from '../types';
import { CONFIG } from '../config';

/**
 * Turkish text normalization:
 * - Lowercase using Turkish rules
 * - Maps ç→c, ğ→g, ı→i, i̇→i, ö→o, ş→s, ü→u, â→a, î→i, û→u
 * - Removes text in parentheses/brackets
 * - Removes feat./ft. and everything after it
 * - Removes punctuation
 * - Collapses whitespace
 */
export function normalize(str: string): string {
  if (!str) return '';

  let s = str.toLocaleLowerCase('tr');

  // Explicit Turkish character mapping
  s = s
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');

  // Strip remaining combining diacritics
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Remove parentheses and bracketed contents
  s = s.replace(/\([^)]*\)/g, ' ');
  s = s.replace(/\[[^\]]*\]/g, ' ');

  // Remove feat./ft. and anything following it
  s = s.replace(/\b(feat|ft|featuring)\b.*$/i, '');

  // Remove punctuation (keep alphanumeric and spaces)
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');

  // Collapse whitespace
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Standard Levenshtein distance between two strings
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1,       // deletion
        dp[j - 1] + 1,   // insertion
        prev + cost      // substitution
      );
      prev = temp;
    }
  }

  return dp[b.length];
}

/**
 * Normalized similarity score: 1.0 = identical, 0.0 = completely different
 */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return Math.max(0, 1 - levenshtein(a, b) / maxLen);
}

/**
 * Verifies if free text guess in Hard Mode is correct according to the rules:
 * 1. normalize(guess) === normalize(title)
 * 2. normalize(guess) === normalize(artist + " " + title) or normalize(title + " " + artist) or "artist - title"
 * 3. similarity(normalize(guess), normalize(title)) >= 0.85
 * 4. guess contains full normalized title as whole-word match AND rest of text fuzzy-matches one of the song's artists
 */
export function isHardGuessCorrect(guess: string, song: Song): boolean {
  const normGuess = normalize(guess);
  const normTitle = normalize(song.title);
  const normArtist = normalize(song.artist);

  if (!normGuess || !normTitle) return false;

  // 1. Exact title match
  if (normGuess === normTitle) return true;

  // 2. Exact combinations
  if (
    normGuess === normalize(`${song.artist} ${song.title}`) ||
    normGuess === normalize(`${song.title} ${song.artist}`) ||
    normGuess === normalize(`${song.artist} - ${song.title}`)
  ) {
    return true;
  }

  // 3. High similarity to title
  if (similarity(normGuess, normTitle) >= CONFIG.HARD_SIMILARITY_THRESHOLD) {
    return true;
  }

  // 4. Whole-word title match + artist fuzzy match
  // Check if title appears as whole words in guess
  const regex = new RegExp(`(^|\\s)${escapeRegExp(normTitle)}(\\s|$)`, 'i');
  if (regex.test(normGuess)) {
    // Extract remaining parts of the guess
    const remaining = normGuess.replace(normTitle, '').replace(/\s+/g, ' ').trim();
    if (!remaining) return true;

    // Check individual artist names if multiple
    const artists = song.artist.split(/[,&/]/).map(a => normalize(a)).filter(Boolean);
    for (const art of artists) {
      if (similarity(remaining, art) >= 0.70 || remaining.includes(art) || art.includes(remaining)) {
        return true;
      }
    }
  }

  return false;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface AutocompleteResult {
  song: Song;
  matchScore: number;
  highlightTitleRange?: [number, number];
}

/**
 * Search autocomplete for Medium and Daily modes:
 * Match against normalize(artist + " " + title).
 * A song is a suggestion when every typed token is a substring of that string.
 * Rank by: prefix match on title, then prefix match on artist, then popularity descending.
 * Limit to CONFIG.MAX_AUTOCOMPLETE_SUGGESTIONS (8).
 */
export function getAutocompleteSuggestions(query: string, allSongs: Song[]): Song[] {
  const normQuery = normalize(query);
  if (!normQuery) return [];

  const tokens = normQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const matches: { song: Song; score: number }[] = [];

  for (const song of allSongs) {
    const normTitle = normalize(song.title);
    const normArtist = normalize(song.artist);
    const fullCombined = `${normArtist} ${normTitle} ${normArtist}`;

    // Every typed token must be a substring of the combined artist+title
    const allTokensMatch = tokens.every(token => fullCombined.includes(token));
    if (!allTokensMatch) continue;

    // Scoring heuristics:
    // Prefix match on title: highest priority (+1000)
    // Prefix match on artist: high priority (+500)
    // Title includes full query: (+200)
    // Popularity score: (+ popularity 0-100)
    let score = song.popularity || 0;

    if (normTitle.startsWith(normQuery)) {
      score += 1000;
    } else if (normTitle.includes(normQuery)) {
      score += 300;
    }

    if (normArtist.startsWith(normQuery)) {
      score += 500;
    } else if (normArtist.includes(normQuery)) {
      score += 200;
    }

    matches.push({ song, score });
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, CONFIG.MAX_AUTOCOMPLETE_SUGGESTIONS).map(m => m.song);
}
