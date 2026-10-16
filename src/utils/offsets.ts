import { CONFIG } from '../config';
import { QuizMode } from '../types';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pickClipOffset(duration: number, clipSeconds: number, mode: QuizMode): number {
  const usable = Number.isFinite(duration) && duration > 1 ? duration : CONFIG.PREVIEW_FALLBACK_DURATION;
  const maxStart = Math.max(0, usable - clipSeconds - 0.25);

  if (mode === 'intro') return 0;
  return Math.random() * maxStart;
}

export function pickRevealOffset(
  duration: number,
  mode: QuizMode,
  clipSeconds: number,
  clipOffset: number
): number {
  const usable = Number.isFinite(duration) && duration > 1 ? duration : CONFIG.PREVIEW_FALLBACK_DURATION;
  const minPlay = 8;
  const maxStart = Math.max(0, usable - minPlay);

  if (mode === 'random') {
    return clamp(clipOffset, 0, maxStart);
  }

  const introEnd = clipOffset + clipSeconds + CONFIG.INTRO_GAP_SECONDS;
  const from = clamp(introEnd, 0, maxStart);
  if (from >= maxStart) {
    return maxStart;
  }
  return from + Math.random() * (maxStart - from);
}
