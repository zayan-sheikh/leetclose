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
          ? "border-danger/40 bg-danger/15 text-zinc-100"
          : "border-white/10 bg-white/[0.04] text-zinc-500"
      }`}
    >
      <span className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            isActive
              ? "bg-danger shadow-[0_0_10px_var(--glow-danger)] animate-pulse"
              : "bg-zinc-600"
          }`}
          aria-hidden
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-danger/90">
          Live
        </span>
      </span>
      <span className="text-zinc-300">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
