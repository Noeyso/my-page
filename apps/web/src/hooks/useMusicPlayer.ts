import { useCallback, useEffect, useRef, useState } from 'react';
import type { MusicTrack } from '../data/musicPlaylist';

export interface UseMusicPlayer {
  currentIndex: number;
  currentTrack: MusicTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasError: boolean;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (ratio: number) => void;
  select: (index: number) => void;
}

export function useMusicPlayer(tracks: MusicTrack[]): UseMusicPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // isPlaying의 최신값을 effect/handler에서 동기적으로 읽기 위한 미러 ref
  const isPlayingRef = useRef(false);
  // tracks 최신값을 이벤트 콜백에서 읽기 위한 미러 ref (effect 재구독 방지)
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);

  // audio 엘리먼트 생성 + 이벤트 1회 연결. 언마운트 시에만 정리(StrictMode 누수 방지).
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setCurrentIndex((i) => (i + 1) % tracksRef.current.length);
    const onErr = () => {
      setHasError(true);
      setIsPlaying(false);
      isPlayingRef.current = false;
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onErr);
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onErr);
      audioRef.current = null;
    };
  }, []);

  // 트랙 변경 시 src 교체 + load(). 재생 중이었으면 이어서 play.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    audio.src = tracksRef.current[currentIndex].previewUrl;
    audio.load();
    if (isPlayingRef.current) {
      audio.play().catch((err: unknown) => {
        // 빠른 곡 전환 시 직전 play()가 중단되며 나는 AbortError는 무시
        if (!(err instanceof DOMException) || err.name !== 'AbortError') {
          setHasError(true);
        }
      });
    }
  }, [currentIndex]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlayingRef.current) {
      audio.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          isPlayingRef.current = true;
          setIsPlaying(true);
        })
        .catch((err: unknown) => {
          if (!(err instanceof DOMException) || err.name !== 'AbortError') {
            setHasError(true);
          }
        });
    }
  }, []);

  const next = useCallback(
    () => setCurrentIndex((i) => (i + 1) % tracksRef.current.length),
    [],
  );
  const prev = useCallback(
    () =>
      setCurrentIndex(
        (i) => (i - 1 + tracksRef.current.length) % tracksRef.current.length,
      ),
    [],
  );
  const select = useCallback((index: number) => setCurrentIndex(index), []);
  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
    setCurrentTime(audio.currentTime);
  }, []);

  return {
    currentIndex,
    currentTrack: tracks[currentIndex],
    isPlaying,
    currentTime,
    duration,
    hasError,
    toggle,
    next,
    prev,
    seek,
    select,
  };
}
