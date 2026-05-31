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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);

  if (audioRef.current === null && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setCurrentIndex((i) => (i + 1) % tracks.length);
    const onErr = () => {
      setHasError(true);
      setIsPlaying(false);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onErr);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onErr);
      audio.pause();
    };
  }, [tracks.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    audio.src = tracks[currentIndex].previewUrl;
    if (isPlaying) {
      audio.play().catch(() => setHasError(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, tracks]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
    }
  }, [isPlaying]);

  const next = useCallback(
    () => setCurrentIndex((i) => (i + 1) % tracks.length),
    [tracks.length],
  );
  const prev = useCallback(
    () => setCurrentIndex((i) => (i - 1 + tracks.length) % tracks.length),
    [tracks.length],
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
