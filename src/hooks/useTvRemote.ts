import { useEffect } from 'react';

type TvAction = 'up' | 'down' | 'left' | 'right' | 'ok' | 'back' | 'play';

const KEY_MAP: Record<string, TvAction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'ok',
  NumpadEnter: 'ok',
  Escape: 'back',
  Backspace: 'back',
  ' ': 'play',
  MediaPlayPause: 'play',
  MediaPlay: 'play',
};

export function useTvRemote(handlers: {
  onMove?: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onOk?: () => void;
  onBack?: () => void;
  onPlay?: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const keyCode = (e as KeyboardEvent & { keyCode?: number }).keyCode;
      let action = KEY_MAP[e.key];

      if (!action) {
        if (keyCode === 13) action = 'ok';
        else if (keyCode === 37) action = 'left';
        else if (keyCode === 38) action = 'up';
        else if (keyCode === 39) action = 'right';
        else if (keyCode === 40) action = 'down';
        else if (keyCode === 10009 || keyCode === 461 || keyCode === 8) action = 'back';
        else if (keyCode === 415 || keyCode === 19 || keyCode === 10252) action = 'play';
      }

      if (!action) return;

      if (action === 'ok') handlers.onOk?.();
      else if (action === 'back') handlers.onBack?.();
      else if (action === 'play') handlers.onPlay?.();
      else handlers.onMove?.(action);

      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('keydown', onKeyDown, true);

    try {
      const tizen = (window as unknown as { tizen?: { tvinputdevice?: { registerKey: (k: string) => void } } }).tizen;
      tizen?.tvinputdevice?.registerKey('MediaPlayPause');
      tizen?.tvinputdevice?.registerKey('MediaPlay');
      tizen?.tvinputdevice?.registerKey('MediaStop');
    } catch {
      // browser / non-Tizen
    }

    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [handlers]);
}

export function moveFocus(dir: 'up' | 'down' | 'left' | 'right') {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-tv]')).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
  );
  if (nodes.length === 0) return;

  const active = document.activeElement as HTMLElement | null;
  const current = active && nodes.includes(active) ? active : nodes[0];
  const cur = current.getBoundingClientRect();
  const cx = cur.left + cur.width / 2;
  const cy = cur.top + cur.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const node of nodes) {
    if (node === current) continue;
    const r = node.getBoundingClientRect();
    const nx = r.left + r.width / 2;
    const ny = r.top + r.height / 2;
    const dx = nx - cx;
    const dy = ny - cy;

    let aligned = false;
    if (dir === 'left' && dx < -8) aligned = Math.abs(dy) < Math.abs(dx) + r.height;
    if (dir === 'right' && dx > 8) aligned = Math.abs(dy) < Math.abs(dx) + r.height;
    if (dir === 'up' && dy < -8) aligned = Math.abs(dx) < Math.abs(dy) + r.width;
    if (dir === 'down' && dy > 8) aligned = Math.abs(dx) < Math.abs(dy) + r.width;
    if (!aligned) continue;

    const dist = dx * dx + dy * dy;
    if (dist < bestScore) {
      bestScore = dist;
      best = node;
    }
  }

  (best || current).focus();
}
