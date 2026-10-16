import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ClipSeconds, QuizMode, Song } from './types';
import { CONFIG } from './config';
import { loadInitialSongs } from './data/loadSongs';
import { useClipPlayer } from './hooks/useClipPlayer';
import { useQuiz } from './hooks/useQuiz';
import { moveFocus, useTvRemote } from './hooks/useTvRemote';
import { HomeScreen } from './components/HomeScreen';
import { QuizScreen } from './components/QuizScreen';

export default function App() {
  const [screen, setScreen] = useState<'loading' | 'home' | 'quiz'>('loading');
  const [songs, setSongs] = useState<Song[]>([]);
  const [clipSeconds, setClipSeconds] = useState<ClipSeconds>(CONFIG.DEFAULT_CLIP_SECONDS);
  const [volume, setVolume] = useState(CONFIG.DEFAULT_VOLUME);
  const skipBrokenRef = useRef<() => void>(() => {});

  const handleAudioError = useCallback(() => {
    skipBrokenRef.current();
  }, []);

  const player = useClipPlayer({
    volume,
    onAudioError: handleAudioError,
  });

  const quiz = useQuiz({
    songs,
    duration: player.duration,
    isReady: player.isReady,
    loadSong: player.loadSong,
    playSegment: player.playSegment,
    stop: player.stop,
  });

  skipBrokenRef.current = quiz.skipBrokenSong;

  useEffect(() => {
    loadInitialSongs().then((res) => {
      setSongs(res.songs);
      setScreen('home');
    });
  }, []);

  const startMode = useCallback(
    (mode: QuizMode) => {
      const ok = quiz.startSession(mode, clipSeconds);
      if (ok) setScreen('quiz');
    },
    [clipSeconds, quiz]
  );

  const goHome = useCallback(() => {
    quiz.exitToMenu();
    setScreen('home');
  }, [quiz]);

  const remoteHandlers = useMemo(
    () => ({
      onMove: (dir: 'up' | 'down' | 'left' | 'right') => moveFocus(dir),
      onOk: () => {
        const el = document.activeElement as HTMLElement | null;
        if (el && typeof el.click === 'function' && el !== document.body) {
          el.click();
          return;
        }
        if (screen === 'quiz') {
          if (quiz.phase === 'clip' || quiz.phase === 'think') quiz.skipToReveal();
          else if (quiz.phase === 'reveal') quiz.nextRound();
        }
      },
      onBack: () => {
        if (screen === 'quiz') goHome();
      },
      onPlay: () => {
        if (screen === 'quiz' && (quiz.phase === 'clip' || quiz.phase === 'think')) {
          quiz.skipToReveal();
        }
      },
    }),
    [goHome, quiz, screen]
  );

  useTvRemote(remoteHandlers);

  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] text-[#f3f4f6] bg-street-grid noise-overlay">
      {screen === 'loading' && (
        <div className="tv-shell flex flex-col items-center justify-center gap-4">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#ff2e93] to-cyan-400 flex items-center justify-center text-black font-black text-4xl">
            RQ
          </div>
          <h1 className="font-display text-6xl">RAP QUIZ</h1>
          <div className="flex items-center gap-3 text-cyan-400 text-2xl">
            <Loader2 className="w-8 h-8 animate-spin" />
            Şarkılar yükleniyor
          </div>
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          clipSeconds={clipSeconds}
          volume={volume}
          songCount={songs.length}
          onClipSeconds={setClipSeconds}
          onVolume={setVolume}
          onStart={startMode}
        />
      )}

      {screen === 'quiz' && (
        <QuizScreen
          mode={quiz.mode}
          phase={quiz.phase}
          song={quiz.song}
          round={quiz.round}
          thinkLeft={quiz.thinkLeft}
          clipSeconds={quiz.clipSeconds}
          isPlaying={player.isPlaying}
          onNext={quiz.nextRound}
          onMenu={goHome}
          onSkipWait={quiz.skipToReveal}
        />
      )}
    </div>
  );
}
