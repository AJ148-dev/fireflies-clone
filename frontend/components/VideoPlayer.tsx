"use client";

import { useEffect, useImperativeHandle, useRef, type RefObject } from "react";

import type { PlayerHandle } from "@/components/Player";

const VIDEO_ID = "JH2lZdxS59c";

type YTPlayer = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  getCurrentTime: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          width?: string;
          height?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
}

export function VideoPlayer({
  playerRef,
  onTime,
  startAt,
}: {
  playerRef: RefObject<PlayerHandle | null>;
  onTime: (seconds: number) => void;
  startAt: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const poll = useRef<number | null>(null);
  const startAtRef = useRef(startAt);

  useEffect(() => {
    startAtRef.current = startAt;
  }, [startAt]);

  useImperativeHandle(playerRef, () => ({
    seek(seconds: number) {
      const current = player.current;
      if (!current) return;
      current.seekTo(seconds, true);
      current.playVideo();
      onTime(seconds);
    },
  }));

  useEffect(() => {
    let cancelled = false;

    function stopPoll() {
      if (poll.current !== null) window.clearInterval(poll.current);
      poll.current = null;
    }

    function publish(target: YTPlayer) {
      onTime(target.getCurrentTime());
    }

    loadYouTube().then(() => {
      const host = hostRef.current;
      if (cancelled || !host || !window.YT) return;
      player.current = new window.YT.Player(host, {
        videoId: VIDEO_ID,
        width: "100%",
        height: "100%",
        playerVars: {
          start: Math.floor(startAtRef.current),
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            if (startAtRef.current > 0) event.target.seekTo(startAtRef.current, true);
          },
          onStateChange: (event) => {
            publish(event.target);
            stopPoll();
            if (event.data === window.YT?.PlayerState.PLAYING) {
              poll.current = window.setInterval(() => publish(event.target), 250);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      stopPoll();
      player.current?.destroy();
      player.current = null;
    };
  }, [onTime]);

  return (
    <div className="border-b border-white/5 bg-black px-3 py-2">
      <div className="mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-lg bg-black [&_iframe]:h-full [&_iframe]:w-full">
        <div ref={hostRef} className="h-full w-full" />
      </div>
    </div>
  );
}
