"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import CallTimer from "@/components/CallTimer";
import Transcript, { TranscriptMessage } from "@/components/Transcript";
import {
  getAvailablePersonas,
  getPersonaById,
  type Persona,
} from "@/lib/personas";
import { TRAINING_MODES, type TrainingModeId } from "@/lib/modes";
import { getInitialMessageForPersona } from "@/lib/prospect-prompt";
import { loadProgress, personaAllowed } from "@/lib/gamification";

type CallState = "waiting" | "active" | "ended";

export default function CallPage() {
  const [callState, setCallState] = useState<CallState>("waiting");
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [personaId, setPersonaId] = useState<string>("sarah-busy-mom");
  const [modeId, setModeId] = useState<TrainingModeId>("full_call");
  const [stripeSent, setStripeSent] = useState(false);
  const [sendingStripe, setSendingStripe] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesRef = useRef<TranscriptMessage[]>([]);
  const chatHistoryRef = useRef<{ role: string; content: string }[]>([]);
  const personaIdRef = useRef(personaId);
  const modeIdRef = useRef(modeId);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    personaIdRef.current = personaId;
  }, [personaId]);
  useEffect(() => {
    modeIdRef.current = modeId;
  }, [modeId]);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const progress = typeof window !== "undefined" ? loadProgress() : null;
  const unlockedList = progress?.unlockedPersonaIds ?? [];
  const roster: Persona[] = getAvailablePersonas(unlockedList);

  const getProfile = useCallback(() => {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem("closearena_profile");
    return stored ? JSON.parse(stored) : {};
  }, []);

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(
          (v) =>
            v.name.includes("Female") ||
            v.name.includes("Samantha") ||
            v.name.includes("Karen") ||
            v.name.includes("Zira") ||
            v.name.includes("Google UK English Female") ||
            (v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
        );
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.onstart = () => setIsAiTalking(true);
        utterance.onend = () => {
          setIsAiTalking(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsAiTalking(false);
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }, []);

  const sendToAI = useCallback(
    async (userText: string) => {
      chatHistoryRef.current.push({ role: "user", content: userText });
      const userMsg: TranscriptMessage = {
        role: "user",
        content: userText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: chatHistoryRef.current,
            profile: getProfile(),
            personaId: personaIdRef.current,
            modeId: modeIdRef.current,
          }),
        });

        const data = await response.json();
        const aiText = data.response;

        chatHistoryRef.current.push({ role: "assistant", content: aiText });
        const aiMsg: TranscriptMessage = {
          role: "prospect",
          content: aiText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        await speak(aiText);
      } catch (error) {
        console.error("Failed to get AI response:", error);
      }
    },
    [getProfile, speak]
  );

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          const textToSend = finalTranscript.trim();
          if (textToSend) {
            recognition.stop();
            setIsListening(false);
            setCurrentTranscript("");
            finalTranscript = "";
            sendToAI(textToSend).then(() => {
              try {
                recognition.start();
                setIsListening(true);
              } catch {
                /* ignore */
              }
            });
          }
        } else {
          interim += transcript;
        }
      }
      setCurrentTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [sendToAI]);

  const startCall = useCallback(async () => {
    const p = loadProgress();
    const persona = getPersonaById(personaId);
    if (!personaAllowed(persona, p)) {
      alert("Unlock this prospect by scoring 72+ overall on a few calls.");
      return;
    }

    localStorage.setItem("closearena_call_persona", personaId);
    localStorage.setItem("closearena_call_mode", modeId);

    setCallState("active");
    setCallStartTime(Date.now());
    setMessages([]);
    setStripeSent(false);
    chatHistoryRef.current = [];

    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      await new Promise((r) => setTimeout(r, 500));
    }

    const greeting = getInitialMessageForPersona(personaId);
    chatHistoryRef.current.push({ role: "assistant", content: greeting });
    setMessages([{ role: "prospect", content: greeting, timestamp: Date.now() }]);
    await speak(greeting);
    startListening();
  }, [personaId, modeId, speak, startListening]);

  const endCall = useCallback(() => {
    setCallState("ended");
    setIsListening(false);
    setIsAiTalking(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const callData = {
      messages: messagesRef.current,
      duration: callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0,
      timestamp: Date.now(),
      personaId,
      modeId,
      stripeLinkSent: stripeSent,
    };
    localStorage.setItem("closearena_last_call", JSON.stringify(callData));
    window.location.href = "/feedback";
  }, [callStartTime, personaId, modeId, stripeSent]);

  const sendStripeLink = useCallback(async () => {
    if (stripeSent || sendingStripe) return;
    setSendingStripe(true);
    const line =
      "I'm sending you the secure Stripe payment link right now — you should see it in a moment. Let me know once it comes through.";
    chatHistoryRef.current.push({ role: "user", content: line });
    setMessages((prev) => [
      ...prev,
      { role: "user", content: line, timestamp: Date.now() },
    ]);
    setStripeSent(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      setIsListening(false);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistoryRef.current,
          profile: getProfile(),
          personaId: personaIdRef.current,
          modeId: modeIdRef.current,
        }),
      });
      const data = await response.json();
      const aiText = data.response;
      chatHistoryRef.current.push({ role: "assistant", content: aiText });
      setMessages((prev) => [
        ...prev,
        { role: "prospect", content: aiText, timestamp: Date.now() },
      ]);
      await speak(aiText);
    } catch (e) {
      console.error(e);
    } finally {
      setSendingStripe(false);
      setTimeout(() => {
        if (!isMutedRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch {
            /* ignore */
          }
        }
      }, 200);
    }
  }, [getProfile, speak, stripeSent, sendingStripe]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      startListening();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    }
    setIsMuted(!isMuted);
  }, [isMuted, startListening]);

  const activePersona = getPersonaById(personaId);
  const prog = typeof window !== "undefined" ? loadProgress() : null;

  if (callState === "waiting") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
            ← Dashboard
          </Link>
          <span className="text-xs text-muted">CloserArena AI</span>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-2">Practice call setup</h1>
          <p className="text-muted text-sm mb-8">
            Pick a prospect and training mode. Mic + speakers on — Chrome recommended.
          </p>

          <label className="block text-sm font-medium mb-2">Training mode</label>
          <select
            value={modeId}
            onChange={(e) => setModeId(e.target.value as TrainingModeId)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 mb-8 text-sm"
          >
            {TRAINING_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted -mt-6 mb-8">
            {TRAINING_MODES.find((m) => m.id === modeId)?.description}
          </p>

          <h2 className="text-sm font-semibold mb-3">Prospect</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {roster.map((p) => {
              const allowed = prog ? personaAllowed(p, prog) : p.unlockedByDefault;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!allowed}
                  onClick={() => allowed && setPersonaId(p.id)}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    personaId === p.id
                      ? "border-accent bg-accent/10"
                      : "border-border bg-card hover:bg-card-hover"
                  } ${!allowed ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <div className="font-medium">{p.displayName}</div>
                  <div className="text-xs text-muted mt-1">{p.nicheGoal}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted mt-2">
                    {p.objectionDifficulty} · {!allowed ? "Locked" : "Ready"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted mb-8">
            <strong className="text-foreground">Selected:</strong>{" "}
            {activePersona.displayName} — {activePersona.personalityType}
          </div>

          <button
            type="button"
            onClick={startCall}
            className="w-full py-4 bg-success hover:bg-success/90 text-white rounded-xl font-semibold text-lg"
          >
            Join call
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111]">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xs text-muted hover:text-foreground">
            Exit
          </Link>
          <span className="text-sm font-medium">CloserArena</span>
          <span className="text-xs text-muted">|</span>
          <span className="text-xs text-muted truncate max-w-[120px]">
            {activePersona.firstName}
          </span>
        </div>
        <CallTimer isActive={callState === "active"} startTime={callStartTime} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className={`p-2 rounded-lg text-sm transition-colors ${
              showTranscript
                ? "bg-accent/20 text-accent"
                : "text-muted hover:text-foreground"
            }`}
            title="Toggle transcript"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative">
            <Avatar
              isTalking={isAiTalking}
              isListening={isListening}
              displayName={activePersona.displayName}
              avatarTone={activePersona.avatarTone}
            />

            <div className="absolute bottom-4 right-4 w-40 h-28 bg-[#1a1a1a] rounded-lg border border-border overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-accent mx-auto flex items-center justify-center text-white font-bold text-sm">
                  You
                </div>
                <p className="text-xs text-muted mt-1">
                  {isListening ? "Listening..." : isMuted ? "Muted" : ""}
                </p>
              </div>
            </div>

            {currentTranscript && (
              <div className="absolute bottom-4 left-4 right-48 bg-black/70 rounded-lg px-4 py-2">
                <p className="text-sm text-white/90">{currentTranscript}...</p>
              </div>
            )}
          </div>

          <div className="bg-[#111] px-4 py-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isMuted
                  ? "bg-danger text-white"
                  : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={sendStripeLink}
              disabled={stripeSent || sendingStripe}
              className={`px-4 py-3 rounded-full text-sm font-semibold transition-colors ${
                stripeSent
                  ? "bg-success/30 text-success border border-success/40"
                  : "bg-[#635bff] hover:bg-[#5349e8] text-white"
              } disabled:opacity-50`}
            >
              {stripeSent ? "Link sent" : sendingStripe ? "Sending…" : "Send Stripe link"}
            </button>

            <button
              type="button"
              onClick={endCall}
              className="px-6 py-3 bg-danger hover:bg-danger/90 text-white rounded-full font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                />
              </svg>
              End call
            </button>
          </div>
        </div>

        {showTranscript && (
          <div className="w-80 border-l border-border bg-[#111] flex-shrink-0">
            <Transcript
              messages={messages}
              isVisible={showTranscript}
              prospectShortLabel={activePersona.firstName}
            />
          </div>
        )}
      </div>
    </div>
  );
}
