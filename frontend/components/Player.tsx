"use client";

import { useEffect, useImperativeHandle, useRef, useState, type RefObject } from "react";

import { formatClock } from "@/lib/formatTime";

export type PlayerHandle = {
  seek: (seconds: number) => void;
};

export function Player({
  src,
  playerRef,
  onTime,
}: {
  src: string;
  playerRef: RefObject<PlayerHandle | null>;
  onTime: (seconds: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useImperativeHandle(playerRef, () => ({
    seek(seconds: number) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = seconds;
      setTime(seconds);
      onTime(seconds);
      audio.play().catch(() => setPlaying(false));
    },
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onUpdate = () => {
      setTime(audio.currentTime);
      onTime(audio.currentTime);
    };
    const onMeta = () => setDuration(audio.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("timeupdate", onUpdate);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onUpdate);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
    };
  }, [onTime, src]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }

  return (
    <div className="flex items-center gap-3 border-b border-white/5 bg-[#17171a] px-3 py-2">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className="grid h-10 w-10 place-items-center rounded-full bg-[#6c4dff] text-white"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <span className="w-10 text-xs tabular-nums text-[#6b7080]">{formatClock(time)}</span>
      <div className="relative flex h-8 flex-1 items-center">
        <div className="pointer-events-none absolute inset-x-0 flex h-6 items-center justify-between overflow-hidden" aria-hidden="true">
          {Array.from({ length: 80 }, (_, index) => (
            <span
              key={index}
              className="w-1 rounded-full bg-[#d9d4ff]"
              style={{ height: `${8 + ((index * 17) % 18)}px`, opacity: duration && (index / 80) * duration <= time ? 1 : 0.45 }}
            />
          ))}
        </div>
        <input
          aria-label="Seek"
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(time, duration || 0)}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (audioRef.current) audioRef.current.currentTime = next;
            setTime(next);
            onTime(next);
          }}
          className="relative z-10 h-8 w-full cursor-pointer appearance-none bg-transparent accent-[#6c4dff]"
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-[#6b7080]">{formatClock(duration)}</span>
    </div>
  );
}
