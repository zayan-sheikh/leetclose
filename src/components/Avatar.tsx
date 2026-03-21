"use client";

interface AvatarProps {
  isTalking: boolean;
  isListening: boolean;
}

export default function Avatar({ isTalking, isListening }: AvatarProps) {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a15] rounded-xl" />

      {/* Ambient glow when talking */}
      {isTalking && (
        <div className="absolute w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      )}

      {/* Avatar container */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Head/face */}
        <div className="relative">
          {/* Pulse ring when talking */}
          {isTalking && (
            <div className="absolute -inset-4 rounded-full border-2 border-accent/30 animate-pulse-ring" />
          )}

          {/* Face circle */}
          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-b from-[#e8c4a0] to-[#d4a574] flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
              isTalking ? "shadow-lg shadow-accent/20" : ""
            }`}
          >
            {/* Hair */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-[#3a2a1a] to-[#4a3a2a] rounded-t-full" />
            <div className="absolute top-3 -left-1 w-8 h-16 bg-[#3a2a1a] rounded-l-full" />
            <div className="absolute top-3 -right-1 w-8 h-16 bg-[#3a2a1a] rounded-r-full" />

            {/* Face features */}
            <div className="relative top-2 flex flex-col items-center gap-2">
              {/* Eyes */}
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

              {/* Nose */}
              <div className="w-1.5 h-1 bg-[#d4a070] rounded-full" />

              {/* Mouth */}
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

        {/* Name tag */}
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">Sarah Mitchell</span>
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

        {/* Shoulders/body hint */}
        <div className="w-44 h-16 bg-gradient-to-b from-[#2a4a6a] to-[#1a3a5a] rounded-t-3xl -mt-2" />
      </div>
    </div>
  );
}
