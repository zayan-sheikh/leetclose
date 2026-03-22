"use client";

import { useState, useEffect } from "react";

interface CallTimerProps {
  isActive: boolean;
  startTime: number | null;
}

export default function CallTimer({ isActive, startTime }: CallTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive || !startTime) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs tabular-nums tracking-tight ${
        isActive
          ? "border-red-500/35 bg-red-950/40 text-red-100/95"
          : "border-white/10 bg-white/[0.04] text-zinc-500"
      }`}
    >
      <span className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            isActive ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse" : "bg-zinc-600"
          }`}
          aria-hidden
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-red-200/90">
          Live
        </span>
      </span>
      <span className="text-zinc-300">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
