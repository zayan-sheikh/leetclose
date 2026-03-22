"use client";

import { useEffect, useRef } from "react";

export interface TranscriptMessage {
  role: "user" | "prospect";
  content: string;
  timestamp: number;
}

interface TranscriptProps {
  messages: TranscriptMessage[];
  isVisible: boolean;
  prospectShortLabel?: string;
}

export default function Transcript({
  messages,
  isVisible,
  prospectShortLabel = "Prospect",
}: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isVisible) return null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#09090b]/98">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-3 py-2 sm:px-4 sm:py-2.5">
        <div>
          <h3 className="font-display text-xs font-semibold text-zinc-100 sm:text-sm">
            Transcript
          </h3>
          <p className="text-[10px] text-zinc-500 sm:text-[11px]">Updates as you go</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success/95">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Live
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 sm:space-y-3 sm:p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-500">
            Lines appear here after you and the prospect speak.
          </p>
        )}
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={`${msg.timestamp}-${i}`}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[min(100%,100%)] rounded-xl px-3 py-2 sm:max-w-[min(100%,18rem)] sm:rounded-2xl sm:px-3.5 sm:py-2.5 ${
                  isUser
                    ? "rounded-br-md bg-gradient-to-br from-cyan-600/35 to-indigo-600/25 text-zinc-100 ring-1 ring-cyan-400/20"
                    : "rounded-bl-md border border-white/[0.08] bg-white/[0.04] text-zinc-200"
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      isUser ? "text-cyan-200/80" : "text-zinc-500"
                    }`}
                  >
                    {isUser ? "You" : prospectShortLabel}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-zinc-100/95">
                  {msg.content}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-1 shrink-0" />
      </div>
    </div>
  );
}
