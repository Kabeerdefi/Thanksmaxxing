"use client";

import { useEffect, useRef, useState } from "react";

const preferenceKey = "thanksmaxxing-music-muted";

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let savedPreference: string | null = null;
    try {
      savedPreference = window.localStorage.getItem(preferenceKey);
    } catch {
      // Audio still works when browser storage is unavailable.
    }
    const muted = savedPreference === "true";
    audio.muted = muted;
    audio.volume = 0.3;
    setIsMuted(muted);

    const events = ["pointerdown", "touchstart", "keydown", "click"] as const;
    const detachUnlock = () => {
      events.forEach((evt) => window.removeEventListener(evt, unlockOnFirstGesture, true));
    };

    const tryPlay = () =>
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          detachUnlock();
        })
        .catch(() => {
          setIsPlaying(false);
        });

    function unlockOnFirstGesture() {
      if (!audio || audio.muted) return;
      void tryPlay();
    }

    if (!muted) {
      void audio.play().then(
        () => setIsPlaying(true),
        () => {
          setIsPlaying(false);
          events.forEach((evt) => window.addEventListener(evt, unlockOnFirstGesture, true));
        },
      );
    }

    return detachUnlock;
  }, []);

  async function toggleSound() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.muted = false;
      setIsMuted(false);
      try { window.localStorage.setItem(preferenceKey, "false"); } catch { /* Ignore unavailable storage. */ }
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    const muted = !audio.muted;
    audio.muted = muted;
    setIsMuted(muted);
    try { window.localStorage.setItem(preferenceKey, String(muted)); } catch { /* Ignore unavailable storage. */ }
  }

  const label = isPlaying ? (isMuted ? "Unmute music" : "Mute music") : "Play music";

  return (
    <>
      <audio className="background-music" ref={audioRef} src="/thanksmaxxing-theme.mp3" autoPlay loop preload="auto" />
      <button
        className={"music-toggle" + (isPlaying && !isMuted ? " music-toggle-on" : "")}
        type="button"
        onClick={toggleSound}
        aria-label={label}
        title={label}
      >
        <span className="music-toggle-icon" aria-hidden="true">{isPlaying && !isMuted ? "♫" : "♪"}</span>
        <span>{isPlaying ? (isMuted ? "Sound off" : "Sound on") : "Play music"}</span>
        {isPlaying && !isMuted ? <span className="music-equalizer" aria-hidden="true"><i /><i /><i /></span> : null}
      </button>
    </>
  );
}
