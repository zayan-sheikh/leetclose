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
}

export default function Transcript({ messages, isVisible }: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-muted">Transcript</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-3">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-accent text-white"
                  : "bg-[#2a4a6a] text-white"
              }`}
            >
              {msg.role === "user" ? "Y" : "S"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-muted">
                  {msg.role === "user" ? "You" : "Sarah"}
                </span>
              </div>
              <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
