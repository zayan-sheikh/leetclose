"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  analyzeCallFull,
  type CallData,
  type ExtendedFeedback,
  type FullScores,
} from "@/lib/call-analysis";
import { getPersonaById } from "@/lib/personas";

type DeepDiveMessage = {
  role: "assistant" | "user";
  content: string;
  timestamp: number;
};

export default function DeepDiveFeedbackPage() {
  const router = useRouter();
  const [callData, setCallData] = useState<CallData | null>(null);
  const [feedback, setFeedback] = useState<ExtendedFeedback | null>(null);
  const [scores, setScores] = useState<FullScores | null>(null);
  const [prospectLabel, setProspectLabel] = useState("Prospect");
  const [messages, setMessages] = useState<DeepDiveMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("closearena_last_call");
    if (!raw) {
      router.replace("/feedback");
      return;
    }

    const parsed = JSON.parse(raw) as CallData;
    const result = analyzeCallFull(parsed);
    const intro = buildIntroMessage(result.feedback, result.scores);

    setCallData(parsed);
    setFeedback(result.feedback);
    setScores(result.scores);
    setProspectLabel(getPersonaById(parsed.personaId).firstName);
    setMessages([{ role: "assistant", content: intro, timestamp: Date.now() }]);
  }, [router]);

  const context = useMemo(() => {
    if (!callData || !feedback || !scores) return null;
    return {
      prospect: prospectLabel,
      durationSec: callData.duration,
      userTurnCount: callData.messages.filter((m) => m.role === "user").length,
      scores,
      feedback,
      transcriptTail: callData.messages.slice(-14).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };
  }, [callData, feedback, scores, prospectLabel]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const el = messageListRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
    return () => window.cancelAnimationFrame(id);
  }, [messages, isSending]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending || !context) return;

    const userMessage: DeepDiveMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const assistantTs = Date.now() + 1;
    const nextMessages = [
      ...messages,
      userMessage,
      { role: "assistant" as const, content: "", timestamp: assistantTs },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/feedback-deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          stream: true,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`deep_dive_status_${response.status}`);
      }

      if (!response.body) {
        const data = await response.json();
        const aiText =
          typeof data?.response === "string" && data.response.trim()
            ? data.response.trim()
            : "I can help break this down. Ask me about discovery, objections, or closing and I will give line-by-line guidance.";

        setMessages((prev) =>
          prev.map((m) =>
            m.timestamp === assistantTs ? { ...m, content: aiText } : m,
          ),
        );
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let combined = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          combined += decoder.decode(value, { stream: true });
          const snapshot = combined;
          setMessages((prev) =>
            prev.map((m) =>
              m.timestamp === assistantTs ? { ...m, content: snapshot } : m,
            ),
          );
        }

        const finalText = combined.trim();
        if (!finalText) {
          const fallbackText =
            "I can help break this down. Ask me about discovery, objections, or closing and I will give line-by-line guidance.";
          setMessages((prev) =>
            prev.map((m) =>
              m.timestamp === assistantTs ? { ...m, content: fallbackText } : m,
            ),
          );
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.timestamp === assistantTs
            ? {
                ...m,
                content:
                  "I could not reach AI coaching right now. Try again in a moment and I will keep helping with your call breakdown.",
              }
            : m,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }

  if (!feedback || !scores || !callData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted">Loading deep dive...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 py-3 flex justify-between items-center">
        <Link
          href="/feedback"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Back to Feedback
        </Link>
        <span className="text-xs text-muted">AI Deep Dive</span>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AI Deep Dive Coaching</h1>
          <p className="text-sm text-muted mt-1">
            Chat with your coach AI about this exact call vs {prospectLabel}.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-success mb-2">
              What you did well
            </h2>
            <ul className="space-y-1.5 text-sm text-foreground/80">
              {feedback.didWell.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </section>
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-warning mb-2">What to improve</h2>
            <ul className="space-y-1.5 text-sm text-foreground/80">
              {feedback.missed.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 mb-4 text-sm text-muted">
          Score {scores.overall} overall · Close probability{" "}
          {scores.closeProbability}% ·{" "}
          {callData.messages.filter((m) => m.role === "user").length} coach
          turns
        </div>

        <section className="bg-card border border-border rounded-2xl overflow-hidden">
          <div
            ref={messageListRef}
            className="h-[52vh] overflow-y-auto p-4 space-y-3"
          >
            {messages.map((m, i) =>
              m.role === "assistant" && !m.content.trim() ? null : (
                <div
                  key={`${m.timestamp}-${i}`}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-accent text-white"
                        : "bg-background border border-border text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="max-w-none text-foreground">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-base font-bold mt-2 mb-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-sm font-bold mt-2 mb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold mt-2 mb-1">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="my-2 leading-relaxed">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 my-2 space-y-1">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 my-2 space-y-1">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => (
                              <strong className="font-extrabold text-foreground">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic">{children}</em>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-border pl-3 my-2 text-muted">
                                {children}
                              </blockquote>
                            ),
                            code: ({ children }) => (
                              <code className="px-1 py-0.5 rounded bg-black/10 text-[13px] font-mono">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="my-2 p-3 rounded-lg bg-black/70 text-white overflow-x-auto text-[13px]">
                                {children}
                              </pre>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                className="underline text-accent"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ),
            )}
            {isSending && (
              <div className="text-xs text-muted">AI coach is thinking...</div>
            )}
          </div>

          <form
            onSubmit={onSend}
            className="border-t border-border p-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for specific help, e.g. Give me 3 better lines for the money objection"
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function buildIntroMessage(
  feedback: ExtendedFeedback,
  scores: FullScores,
): string {
  const didWellLines = feedback.didWell.length
    ? feedback.didWell.map((x) => `- ${x}`).join("\n")
    : "- No strong positives were detected yet. We can change that quickly.";

  const improveLines = feedback.missed.length
    ? feedback.missed.map((x) => `- ${x}`).join("\n")
    : "- No major misses flagged. We can work on advanced polish.";

  return [
    "Deep dive loaded.",
    `Overall: ${scores.overall} | Close probability: ${scores.closeProbability}%`,
    "",
    "What you did well:",
    didWellLines,
    "",
    "What to improve:",
    improveLines,
    "",
    "Ask me anything and I will give tactical, script-level coaching for your next rep.",
  ].join("\n");
}
