"use client";

import type { Persona } from "@/lib/personas";

interface AvatarProps {
  isTalking: boolean;
  isListening: boolean;
  displayName: string;
  avatarTone?: Persona["avatarTone"];
}

const toneRing = {
  warm: "from-amber-400/90 via-orange-300/80 to-rose-400/85",
  neutral: "from-zinc-300/90 via-slate-300/80 to-zinc-400/85",
  cool: "from-sky-400/85 via-cyan-300/75 to-indigo-400/80",
  deep: "from-sky-500/85 via-cyan-400/75 to-blue-700/80",
} as const;

const toneGlow = {
  warm: "shadow-[0_0_80px_-20px_rgba(251,191,36,0.35)]",
  neutral: "shadow-[0_0_80px_-20px_rgba(161,161,170,0.25)]",
  cool: "shadow-[0_0_80px_-20px_rgba(34,211,238,0.3)]",
  deep: "shadow-[0_0_80px_-20px_rgba(167,139,250,0.35)]",
} as const;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function Avatar({
  isTalking,
  isListening,
  displayName,
  avatarTone = "warm",
}: AvatarProps) {
  const ring = toneRing[avatarTone];
  const glow = toneGlow[avatarTone];
  const initials = initialsFromName(displayName);

  return (
    <div className="relative flex h-full min-h-[280px] w-full flex-col items-center justify-center px-6 py-10">
      {/* Stage vignette */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_38%,rgba(34,211,238,0.07),transparent_62%),radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(99,102,241,0.06),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col items-center gap-8">
        <div className="relative">
          {isTalking && (
            <div
              className="absolute -inset-3 rounded-full border border-cyan-400/25 bg-cyan-400/5 animate-pulse"
              aria-hidden
            />
          )}
          <div
            className={`relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br p-[3px] ${ring} ${isTalking ? glow : "shadow-2xl shadow-black/50"}`}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0a0c] ring-1 ring-white/10">
              <span className="font-display text-4xl font-semibold tracking-tight text-white/95">
                {initials}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-white md:text-xl">
              {displayName}
            </p>
            <p className="mt-1 text-xs text-zinc-500">AI prospect · simulated session</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {isTalking && (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200/95">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Speaking
              </span>
            )}
            {!isTalking && isListening && (
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200/95">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
                Listening for you
              </span>
            )}
            {!isTalking && !isListening && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-400">
                Ready
              </span>
            )}
          </div>

          {isTalking && (
            <div
              className="flex h-9 items-end justify-center gap-1 pt-1"
              aria-hidden
            >
              {[0.35, 0.65, 0.45, 0.85, 0.5, 0.7, 0.4].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-cyan-600/50 to-cyan-300 animate-shimmer-bar"
                  style={{
                    height: `${h * 100}%`,
                    animationDelay: `${i * 70}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
