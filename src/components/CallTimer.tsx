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
    <div className="flex items-center gap-2 text-sm text-muted">
      <div
        className={`w-2 h-2 rounded-full ${
          isActive ? "bg-danger animate-pulse" : "bg-muted"
        }`}
      />
      <span className="font-mono">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
