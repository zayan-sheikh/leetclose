"use client";

import type { Persona } from "@/lib/personas";

interface AvatarProps {
  isTalking: boolean;
  isListening: boolean;
  displayName: string;
  avatarTone?: Persona["avatarTone"];
}

const toneFace = {
  warm: "from-[#e8c4a0] to-[#d4a574]",
  neutral: "from-[#d4b896] to-[#c4a574]",
  cool: "from-[#c8b8a8] to-[#a89888]",
  deep: "from-[#b89a78] to-[#8a7058]",
} as const;

const toneHair = {
  warm: "from-[#3a2a1a] to-[#4a3a2a]",
  neutral: "from-[#2a2520] to-[#3a3530]",
  cool: "from-[#1a1a1a] to-[#2a2a2a]",
  deep: "from-[#2a1810] to-[#3a2418]",
} as const;

export default function Avatar({
  isTalking,
  isListening,
  displayName,
  avatarTone = "warm",
}: AvatarProps) {
  const face = toneFace[avatarTone];
  const hair = toneHair[avatarTone];

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a15] rounded-xl" />

      {isTalking && (
        <div className="absolute w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      )}

      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          {isTalking && (
            <div className="absolute -inset-4 rounded-full border-2 border-accent/30 animate-pulse-ring" />
          )}

          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-b ${face} flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
              isTalking ? "shadow-lg shadow-accent/20" : ""
            }`}
          >
            <div
              className={`absolute top-0 left-0 right-0 h-14 bg-gradient-to-b ${hair} rounded-t-full`}
            />
            <div className={`absolute top-3 -left-1 w-8 h-16 bg-gradient-to-b ${hair} rounded-l-full opacity-90`} />
            <div className={`absolute top-3 -right-1 w-8 h-16 bg-gradient-to-b ${hair} rounded-r-full opacity-90`} />

            <div className="relative top-2 flex flex-col items-center gap-2">
              <div className="flex gap-6">
                <div className="relative">
                  <div className="w-3.5 h-4 bg-white rounded-full flex items-center justify-center">
                    <div
                      className={`w-2 h-2 bg-[#4a6741] rounded-full transition-all duration-200 ${
                        isListening ? "translate-x-0.5" : ""
                      }`}
                    />
                  </div>
                </div>
                <div className="relative">
                  <div className="w-3.5 h-4 bg-white rounded-full flex items-center justify-center">
                    <div
                      className={`w-2 h-2 bg-[#4a6741] rounded-full transition-all duration-200 ${
                        isListening ? "translate-x-0.5" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="w-1.5 h-1 bg-[#d4a070] rounded-full" />

              <div className="relative">
                {isTalking ? (
                  <div className="w-6 h-3 bg-[#c47070] rounded-full animate-talk overflow-hidden">
                    <div className="w-full h-0.5 bg-[#b06060] absolute top-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  <div className="w-5 h-0.5 bg-[#c47070] rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">{displayName}</span>
          {isTalking && (
            <div className="flex gap-0.5 items-center">
              <div className="w-1 h-3 bg-success rounded-full animate-talk" style={{ animationDelay: "0ms" }} />
              <div className="w-1 h-4 bg-success rounded-full animate-talk" style={{ animationDelay: "50ms" }} />
              <div className="w-1 h-2 bg-success rounded-full animate-talk" style={{ animationDelay: "100ms" }} />
              <div className="w-1 h-5 bg-success rounded-full animate-talk" style={{ animationDelay: "150ms" }} />
              <div className="w-1 h-3 bg-success rounded-full animate-talk" style={{ animationDelay: "200ms" }} />
            </div>
          )}
        </div>

        <div className="w-44 h-16 bg-gradient-to-b from-[#2a4a6a] to-[#1a3a5a] rounded-t-3xl -mt-2" />
      </div>
    </div>
  );
}
