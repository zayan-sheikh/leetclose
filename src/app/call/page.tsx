"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Avatar, { type AvatarHandle } from "@/components/Avatar";
import CallTimer from "@/components/CallTimer";
import Transcript, { TranscriptMessage } from "@/components/Transcript";
import { getPersonaById, PERSONAS } from "@/lib/personas";
import CallProblemPanel from "@/components/CallProblemPanel";
import PersonaFace from "@/components/PersonaFace";
import { TRAINING_MODES, getModeById, type TrainingModeId } from "@/lib/modes";
import { getInitialMessageForPersona } from "@/lib/prospect-prompt";
import {
  defaultProgress,
  loadProgress,
  personaAllowed,
} from "@/lib/gamification";

const UserCallCamera = dynamic(() => import("@/components/UserCallCamera"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[min(28dvh,180px)] w-full min-w-0 flex-col bg-[#070708] lg:min-h-0">
      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#0a0a0c]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/25 border-t-cyan-400" />
      </div>
      <div className="shrink-0 border-t border-white/[0.08] px-2.5 py-2 text-center text-[10px] font-medium text-zinc-500">
        Preparing your camera…
      </div>
    </div>
  ),
});

type CallState = "waiting" | "active" | "ended";

/** After this much quiet time with interim text, we treat your turn as done (send + auto-mute). */
const VOICE_END_SILENCE_MS = 1000;
const CALL_TIME_LIMIT_MS = 65_000;

/**
 * If HeyGen never resolves (SDK / room bug), we must still clear `isAiTalking` or the text field
 * stays disabled forever.
 */
const HEYGEN_SPEAK_GUARD_MS = 95_000;

export default function CallPage() {
  const [callState, setCallState] = useState<CallState>("waiting");
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [personaId, setPersonaId] = useState<string>("mason-vale");
  const [modeId, setModeId] = useState<TrainingModeId>("full_call");
  const [stripeSent, setStripeSent] = useState(false);
  const [sendingStripe, setSendingStripe] = useState(false);
  const [speechHint, setSpeechHint] = useState<string | null>(null);
  const [typedLine, setTypedLine] = useState("");
  const [showSessionLog, setShowSessionLog] = useState(false);
  const [showUpgradeOverlay, setShowUpgradeOverlay] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const callStateRef = useRef<CallState>("waiting");
  const awaitingAiRef = useRef(false);
  const silenceFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const avatarRef = useRef<AvatarHandle>(null);
  const messagesRef = useRef<TranscriptMessage[]>([]);
  const chatHistoryRef = useRef<{ role: string; content: string }[]>([]);
  const personaIdRef = useRef(personaId);
  const modeIdRef = useRef(modeId);
  const isMutedRef = useRef(isMuted);
  const currentTranscriptRef = useRef("");
  const timeLimitReachedRef = useRef(false);
  /** Breaks circular deps: `sendToAI` must resume the mic after the prospect speaks. */
  const startListeningRef = useRef<(() => void) | null>(null);

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
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const clearSilenceFlushTimer = useCallback(() => {
    if (silenceFlushTimerRef.current) {
      clearTimeout(silenceFlushTimerRef.current);
      silenceFlushTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const valid = new Set(PERSONAS.map((p) => p.id));
    const stored = localStorage.getItem("closearena_call_persona");
    if (stored && valid.has(stored)) setPersonaId(stored);
  }, []);

  const progress =
    typeof window !== "undefined" ? loadProgress() : defaultProgress();

  const getProfile = useCallback(() => {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem("closearena_profile");
    return stored ? JSON.parse(stored) : {};
  }, []);

  /** Avatar mounts only after `callState === "active"`; wait until the ref is attached. */
  const waitForAvatarHandle = useCallback(async (maxMs = 10_000) => {
    const start = Date.now();
    while (!avatarRef.current && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 32));
    }
  }, []);

  const speak = useCallback(
    async (text: string) => {
      setIsAiTalking(true);
      try {
        await waitForAvatarHandle();
        const heygen = avatarRef.current;
        if (heygen) {
          try {
            await Promise.race([
              heygen.speak(text),
              new Promise<never>((_, reject) => {
                setTimeout(
                  () => reject(new Error("HeyGen speak timed out")),
                  HEYGEN_SPEAK_GUARD_MS,
                );
              }),
            ]);
            return;
          } catch (e) {
            console.warn(
              "[call] HeyGen speak failed or timed out, using browser TTS",
              e,
            );
          }
        }

        await new Promise<void>((resolve) => {
          if (!("speechSynthesis" in window)) {
            resolve();
            return;
          }
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
              (v.lang.startsWith("en") &&
                v.name.toLowerCase().includes("female")),
          );
          if (femaleVoice) utterance.voice = femaleVoice;
          utterance.rate = 0.95;
          utterance.pitch = 1.05;
          const ttsTimeout = window.setTimeout(() => {
            console.warn("[call] Browser TTS safety timeout");
            resolve();
          }, 120_000);
          utterance.onend = () => {
            window.clearTimeout(ttsTimeout);
            resolve();
          };
          utterance.onerror = () => {
            window.clearTimeout(ttsTimeout);
            resolve();
          };
          window.speechSynthesis.speak(utterance);
        });
      } finally {
        setIsAiTalking(false);
      }
    },
    [waitForAvatarHandle],
  );

  const sendToAI = useCallback(
    async (userText: string) => {
      if (timeLimitReachedRef.current) return;
      const cleaned = userText.trim();
      if (!cleaned) return;

      chatHistoryRef.current.push({ role: "user", content: cleaned });
      const userMsg: TranscriptMessage = {
        role: "user",
        content: cleaned,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const chatAbort = new AbortController();
      const chatAbortTimer = window.setTimeout(() => chatAbort.abort(), 75_000);

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
          signal: chatAbort.signal,
        });

        const data = await response.json();
        const aiText =
          typeof data?.response === "string" ? data.response.trim() : "";

        if (aiText) {
          chatHistoryRef.current.push({ role: "assistant", content: aiText });
          const aiMsg: TranscriptMessage = {
            role: "prospect",
            content: aiText,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          await speak(aiText);
        }
      } catch (error) {
        console.error("Failed to get AI response:", error);
      } finally {
        window.clearTimeout(chatAbortTimer);
        if (callStateRef.current !== "active") return;
        if (timeLimitReachedRef.current) return;
        isMutedRef.current = false;
        setIsMuted(false);
        shouldListenRef.current = true;
        try {
          startListeningRef.current?.();
        } catch (e) {
          console.warn("[call] Could not resume mic after prospect spoke", e);
        }
      }
    },
    [getProfile, speak],
  );

  /**
   * Commit voice draft: mute + stop STT while the request runs; `sendToAI` auto-unmutes and
   * restarts listening after the prospect finishes speaking.
   */
  const finalizeVoiceTurn = useCallback(
    async (text: string) => {
      if (timeLimitReachedRef.current) return;
      const cleaned = text.trim();
      if (!cleaned || awaitingAiRef.current) return;

      awaitingAiRef.current = true;
      shouldListenRef.current = false;
      clearSilenceFlushTimer();
      setCurrentTranscript("");
      currentTranscriptRef.current = "";
      setIsListening(false);

      isMutedRef.current = true;
      setIsMuted(true);

      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;

      try {
        await sendToAI(cleaned);
      } finally {
        awaitingAiRef.current = false;
        shouldListenRef.current = false;
      }
    },
    [sendToAI, clearSilenceFlushTimer],
  );

  const startListening = useCallback(() => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert(
        "Speech recognition is not supported in this browser. Please use Chrome.",
      );
      return;
    }

    if (recognitionRef.current && isListening) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    shouldListenRef.current = true;

    let finalTranscript = "";
    let interimTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      interimTranscript = interim.trim();
      setCurrentTranscript(interimTranscript);
      currentTranscriptRef.current = interimTranscript;

      const textToSend = finalTranscript.trim();
      if (textToSend) {
        void finalizeVoiceTurn(textToSend);
        finalTranscript = "";
        interimTranscript = "";
        return;
      }

      if (interimTranscript) {
        clearSilenceFlushTimer();
        silenceFlushTimerRef.current = setTimeout(() => {
          void finalizeVoiceTurn(interimTranscript);
        }, VOICE_END_SILENCE_MS);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearSilenceFlushTimer();
      const code = event.error;
      if (code === "no-speech" || code === "aborted") {
        /* may still restart below */
      } else if (code === "network") {
        setSpeechHint(
          "Voice-to-text needs an internet connection (Chrome sends audio to Google). Use “Type reply” below, or check Wi‑Fi / VPN / firewall.",
        );
      } else if (code === "not-allowed" || code === "service-not-allowed") {
        setSpeechHint(
          "Microphone permission blocked. Allow mic for this site or use “Type reply” below.",
        );
      } else if (code === "audio-capture") {
        setSpeechHint(
          "No microphone detected or it’s in use elsewhere. Try “Type reply” or unplug other apps using the mic.",
        );
      } else if (process.env.NODE_ENV === "development") {
        console.warn("Speech recognition:", code);
      } else {
        console.error("Speech recognition error:", code);
      }
      if (
        shouldListenRef.current &&
        callStateRef.current === "active" &&
        !timeLimitReachedRef.current &&
        !awaitingAiRef.current &&
        !isMutedRef.current
      ) {
        setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch {
            /* ignore */
          }
        }, 250);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      clearSilenceFlushTimer();
      if (
        shouldListenRef.current &&
        callStateRef.current === "active" &&
        !timeLimitReachedRef.current &&
        !awaitingAiRef.current &&
        !isMutedRef.current
      ) {
        setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch {
            /* ignore */
          }
        }, 250);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, finalizeVoiceTurn, clearSilenceFlushTimer]);

  startListeningRef.current = startListening;

  const sendTypedReply = useCallback(() => {
    if (timeLimitReachedRef.current) return;
    const t = typedLine.trim();
    if (!t || isAiTalking) return;
    setTypedLine("");
    setSpeechHint(null);
    setCurrentTranscript("");
    currentTranscriptRef.current = "";
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    void sendToAI(t);
  }, [typedLine, isAiTalking, sendToAI]);

  const stopRealtimeCall = useCallback(() => {
    setCallState("ended");
    setIsListening(false);
    setIsAiTalking(false);
    shouldListenRef.current = false;
    awaitingAiRef.current = false;
    clearSilenceFlushTimer();
    setCurrentTranscript("");
    currentTranscriptRef.current = "";

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [clearSilenceFlushTimer]);

  const triggerTimeLimit = useCallback(() => {
    if (timeLimitReachedRef.current) return;
    timeLimitReachedRef.current = true;
    stopRealtimeCall();
    setShowUpgradeOverlay(true);
  }, [stopRealtimeCall]);

  useEffect(() => {
    if (callState !== "active" || !callStartTime || showUpgradeOverlay) return;

    const elapsed = Date.now() - callStartTime;
    const remaining = CALL_TIME_LIMIT_MS - elapsed;
    if (remaining <= 0) {
      triggerTimeLimit();
      return;
    }

    const id = window.setTimeout(() => {
      triggerTimeLimit();
    }, remaining);

    return () => window.clearTimeout(id);
  }, [callState, callStartTime, showUpgradeOverlay, triggerTimeLimit]);

  const startCall = useCallback(async () => {
    const p = loadProgress();
    const persona = getPersonaById(personaId);
    if (!personaAllowed(persona, p)) {
      alert(
        "This prospect unlocks as your best overall score and call count improve — check the dashboard for locked prospects.",
      );
      return;
    }

    localStorage.setItem("closearena_call_persona", personaId);
    localStorage.setItem("closearena_call_mode", modeId);
    timeLimitReachedRef.current = false;
    setShowUpgradeOverlay(false);

    setCallState("active");
    setCallStartTime(Date.now());
    setMessages([]);
    setStripeSent(false);
    setSpeechHint(null);
    setTypedLine("");
    setCurrentTranscript("");
    currentTranscriptRef.current = "";
    chatHistoryRef.current = [];

    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      await new Promise((r) => setTimeout(r, 500));
    }

    let greeting = getInitialMessageForPersona(personaId);
    try {
      const openingProbe =
        "Start the roleplay call naturally with one short opening line as the prospect.";
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: openingProbe }],
          profile: getProfile(),
          personaId,
          modeId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (typeof data?.response === "string" && data.response.trim()) {
          greeting = data.response.trim();
        }
      }
    } catch (e) {
      console.warn("[call] Initial Gemini greeting failed, using fallback", e);
    }

    chatHistoryRef.current.push({ role: "assistant", content: greeting });
    setMessages([
      { role: "prospect", content: greeting, timestamp: Date.now() },
    ]);
    await speak(greeting);
    startListening();
  }, [personaId, modeId, speak, startListening, getProfile]);

  const endCall = useCallback(() => {
    stopRealtimeCall();

    const callData = {
      messages: messagesRef.current,
      duration: callStartTime
        ? Math.floor((Date.now() - callStartTime) / 1000)
        : 0,
      timestamp: Date.now(),
      personaId,
      modeId,
      stripeLinkSent: stripeSent,
    };
    localStorage.setItem("closearena_last_call", JSON.stringify(callData));
    window.location.href = "/feedback";
  }, [callStartTime, personaId, modeId, stripeSent, stopRealtimeCall]);

  const sendStripeLink = useCallback(async () => {
    if (timeLimitReachedRef.current) return;
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
      recognitionRef.current = null;
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
        if (callStateRef.current !== "active") return;
        if (timeLimitReachedRef.current) return;
        isMutedRef.current = false;
        setIsMuted(false);
        shouldListenRef.current = true;
        try {
          startListeningRef.current?.();
        } catch {
          /* ignore */
        }
      }, 200);
    }
  }, [getProfile, speak, stripeSent, sendingStripe]);

  const toggleMute = useCallback(() => {
    if (timeLimitReachedRef.current) return;
    if (isMuted) {
      shouldListenRef.current = true;
      isMutedRef.current = false;
      setIsMuted(false);
      startListening();
      return;
    }

    shouldListenRef.current = false;
    clearSilenceFlushTimer();

    const draft = currentTranscriptRef.current.trim();
    if (draft && callStateRef.current === "active" && !awaitingAiRef.current) {
      void finalizeVoiceTurn(draft);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    isMutedRef.current = true;
    setIsMuted(true);
  }, [isMuted, startListening, clearSilenceFlushTimer, finalizeVoiceTurn]);

  const activePersona = getPersonaById(personaId);
  const activeMode = getModeById(modeId);

  if (callState === "waiting") {
    return (
      <div className="relative flex min-h-screen flex-col bg-background">
        <div className="page-mesh-bg opacity-50" aria-hidden />
        <header className="relative z-[1] flex items-center justify-between border-b border-border bg-card/90 px-4 py-2.5 backdrop-blur-xl">
          <Link
            href="/dashboard"
            className="font-hud text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:text-foreground"
          >
            ← Problem list
          </Link>
          <span className="font-display text-xs font-semibold tracking-wide text-foreground">
            LeetClose <span className="text-muted">·</span>{" "}
            <span style={{ color: "#ffa116" }} className="font-mono">
              practice
            </span>
          </span>
          <span className="w-20 text-right font-hud text-[10px] text-muted">
            Beta
          </span>
        </header>

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="flex max-h-[min(48vh,420px)] min-h-0 shrink-0 flex-col border-b border-border lg:max-h-none lg:w-[min(44vw,30rem)] lg:border-b-0 lg:border-r lg:border-border">
            <CallProblemPanel
              persona={activePersona}
              mode={activeMode}
              variant="setup"
            />
          </aside>

          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12) 0%, transparent 45%),
                  radial-gradient(circle at 80% 70%, rgba(56,189,248,0.14) 0%, transparent 40%)`,
              }}
              aria-hidden
            />
            <div className="relative mx-auto max-w-xl px-4 py-6 lg:px-8 lg:py-8">
              <p className="font-hud text-[10px] font-semibold uppercase tracking-widest text-sky-200/65">
                Code editor
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground">
                Pick your opponent
              </h1>
              <p className="mt-2 text-sm text-muted">
                Mic + speakers on · Chrome recommended for voice
              </p>

              <label className="mb-2 mt-8 block font-hud text-[10px] font-semibold uppercase tracking-wider text-muted">
                Language / Mode
              </label>
              <select
                value={modeId}
                onChange={(e) => setModeId(e.target.value as TrainingModeId)}
                className="w-full rounded-xl border border-border bg-card py-3 pl-3 pr-8 text-sm text-foreground shadow-inner backdrop-blur-md focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/40"
              >
                {TRAINING_MODES.map((m) => (
                  <option
                    key={m.id}
                    value={m.id}
                    className="bg-card text-foreground"
                  >
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted">
                {activeMode.description}
              </p>

              <h2 className="mb-3 mt-8 font-hud text-[10px] font-semibold uppercase tracking-wider text-muted">
                Opponents
              </h2>
              <div className="flex flex-col gap-2.5">
                {PERSONAS.map((p) => {
                  const allowed = personaAllowed(p, progress);
                  const selected = personaId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!allowed}
                      onClick={() => allowed && setPersonaId(p.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-sm transition-all ${
                        selected
                          ? "border-ring bg-card ring-2 ring-ring/40 backdrop-blur-md"
                          : "border-border bg-background/70 backdrop-blur-md hover:border-ring"
                      } ${!allowed ? "cursor-not-allowed opacity-45" : ""}`}
                    >
                      <PersonaFace
                        personaId={p.id}
                        displayName={p.displayName}
                        size={48}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-sm font-bold text-foreground">
                          {p.displayName}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {p.nicheGoal}
                        </div>
                      </div>
                      <div className="shrink-0 text-right font-hud text-[10px] uppercase tracking-wide text-muted">
                        {p.objectionDifficulty}
                        <br />
                        {!allowed ? (
                          <span title="Unlock via dashboard progress">
                            {p.unlockMinOverall != null
                              ? `${p.unlockMinOverall}+ · ${p.unlockMinCalls ?? 0} calls`
                              : "Locked"}
                          </span>
                        ) : (
                          "Ready"
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4 backdrop-blur-md">
                <PersonaFace
                  personaId={activePersona.id}
                  displayName={activePersona.displayName}
                  size={44}
                />
                <div className="min-w-0">
                  <p className="font-hud text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Selected
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {activePersona.displayName}
                  </p>
                  <p className="text-xs text-muted">
                    {activePersona.personalityType}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startCall}
                className="btn-primary-glow mt-8 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.99] sm:py-4 sm:text-base"
              >
                Submit — Join call
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const modeLabel = activeMode.label;

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card/95 px-3 py-2 backdrop-blur-xl sm:px-4">
        <Link
          href="/dashboard"
          className="shrink-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:border-ring"
        >
          ← Leave
        </Link>
        <div className="hidden min-w-0 flex-1 items-center gap-2 px-2 text-xs sm:flex">
          <span className="text-zinc-600">/</span>
          <span className="truncate font-mono text-[11px] text-sky-200/75">
            problems / {activeMode.id}
          </span>
        </div>
        <span className="font-display shrink-0 text-[11px] font-semibold text-zinc-400 sm:hidden">
          Live
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex max-h-[min(40vh,320px)] min-h-0 shrink-0 border-b border-white/10 lg:max-h-none lg:w-[min(42vw,30rem)] lg:shrink-0 lg:border-b-0 lg:border-r lg:border-white/10">
          <CallProblemPanel
            persona={activePersona}
            mode={activeMode}
            variant="active"
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0f0815]">
          {/* Toolbar */}
          <div className="flex shrink-0 flex-col gap-1.5 border-b border-white/10 bg-[#111c2e] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="shrink-0 rounded bg-[#2a2418] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-accent">
                Live
              </span>
              <span className="hidden font-mono text-[11px] text-zinc-500 sm:inline">
                {modeLabel}
              </span>
              <p className="w-full text-[10px] leading-snug text-zinc-500 sm:w-auto sm:max-w-[20rem]">
                <span className="text-sky-300/85">Objections:</span> happen in
                the live call (voice + transcript). Likely lines are under{" "}
                <span className="text-zinc-400">Problem → Constraints</span>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CallTimer
                isActive={callState === "active"}
                startTime={callStartTime}
              />
              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  showTranscript
                    ? "border-ring bg-card text-foreground"
                    : "border-border bg-background text-muted hover:border-ring"
                }`}
              >
                Transcript
              </button>
              <button
                type="button"
                onClick={() => setShowSessionLog((v) => !v)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  showSessionLog
                    ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
                    : "border-border bg-background text-muted hover:border-ring"
                }`}
              >
                Session log
              </button>
            </div>
          </div>
          {/* Center column + right transcript */}
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {/* Call stage */}
              <div className="relative min-h-0 flex-1 p-1 sm:p-2">
                <div className="relative flex h-full min-h-[160px] flex-col overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-[#132238] via-[#0f172a] to-[#0a0f18] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:min-h-0 lg:flex-row sm:rounded-xl">
                  <div
                    className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-sky-500/15 sm:rounded-xl"
                    aria-hidden
                  />
                  <div className="relative z-0 flex min-h-[min(42dvh,240px)] min-w-0 flex-1 flex-col lg:h-full lg:min-h-0">
                    <Avatar
                      ref={avatarRef}
                      isTalking={isAiTalking}
                      isListening={isListening}
                      displayName={activePersona.displayName}
                      avatarTone={activePersona.avatarTone}
                    />
                    {currentTranscript && (
                      <div className="absolute bottom-3 left-2 right-2 z-[1] max-w-[min(100%,28rem)] sm:bottom-4 sm:left-3 sm:right-3 md:max-w-[min(100%,26rem)]">
                        <div className="rounded-lg border border-sky-400/35 bg-black/75 px-3 py-2 shadow-lg backdrop-blur-md">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-300/90">
                            You (draft)
                          </p>
                          <p className="mt-0.5 text-sm leading-snug text-zinc-100">
                            {currentTranscript}
                            <span className="text-sky-300/80">…</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative z-[2] flex min-h-[min(30dvh,200px)] w-full shrink-0 flex-col border-t border-white/10 lg:h-full lg:min-h-0 lg:w-[min(44%,22rem)] lg:border-l lg:border-t-0 xl:w-[min(40%,26rem)]">
                    <UserCallCamera
                      layout="docked"
                      enabled={callState === "active"}
                      isListening={isListening}
                      isMuted={isMuted}
                    />
                  </div>
                </div>
              </div>

              {/* Optional bottom: mic / voice diagnostics (LeetCode “test result” style) */}
              {showSessionLog && (
                <div className="flex max-h-[200px] min-h-[120px] shrink-0 flex-col border-t border-white/10 bg-[#0f172a]">
                  <div className="shrink-0 border-b border-white/10 px-3 py-1.5 font-hud text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Session log
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3 text-left">
                    {speechHint ? (
                      <p className="text-sm leading-relaxed text-amber-200/95">
                        {speechHint}
                      </p>
                    ) : (
                      <p className="font-mono text-xs text-zinc-500">
                        No voice warnings. If the mic or network fails, details
                        show here.
                      </p>
                    )}
                    <div className="mt-3 space-y-1 border-t border-white/10 pt-2 font-mono text-[11px] text-zinc-500">
                      <p>
                        <span className="text-sky-400/85">$</span> mic_status:{" "}
                        {isMuted ? "muted" : isListening ? "listening" : "idle"}
                      </p>
                      <p>
                        <span className="text-sky-400/85">$</span> prospect:{" "}
                        {activePersona.firstName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Input dock */}
              <div className="shrink-0 border-t border-white/10 bg-[#111c2e]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:px-5">
                {speechHint && (
                  <div className="mb-3 rounded-xl border border-amber-500/25 bg-amber-950/25 px-3 py-2">
                    <p className="text-center text-[11px] leading-relaxed text-amber-100/90">
                      {speechHint}
                    </p>
                  </div>
                )}

                <div className="mb-3 flex flex-wrap items-stretch gap-2 sm:items-center">
                  <input
                    type="text"
                    value={typedLine}
                    onChange={(e) => setTypedLine(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendTypedReply();
                      }
                    }}
                    placeholder="Type a reply…"
                    disabled={isAiTalking}
                    className="min-h-[42px] min-w-0 flex-1 rounded-xl border border-white/10 bg-[#121214] px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/25 disabled:opacity-45"
                  />
                  <button
                    type="button"
                    onClick={sendTypedReply}
                    disabled={!typedLine.trim() || isAiTalking}
                    className="btn-primary-glow min-h-[42px] shrink-0 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>

                <p className="mb-2 text-center text-[10px] leading-snug text-zinc-500">
                  Voice: pause ~1s after you finish (or tap mute) to send. Mic
                  turns back on after the prospect speaks — tap mute anytime to
                  stay silent.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all ${
                      isMuted
                        ? "bg-danger text-white shadow-[0_0_28px_-6px_var(--glow-danger)] ring-2 ring-danger/35"
                        : "bg-[#1c1c21] text-white ring-1 ring-white/12 hover:bg-[#25252c] hover:ring-sky-400/30"
                    }`}
                    title={
                      isMuted
                        ? "Unmute to speak (also turns on automatically after the prospect talks)"
                        : "Mute — or pause ~1s after speaking to send; mic mutes until their reply finishes"
                    }
                  >
                    {isMuted ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
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
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
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
                    className={`min-h-12 shrink-0 rounded-full px-4 text-sm font-semibold transition-all sm:px-5 ${
                      stripeSent
                        ? "border border-success/35 bg-success/15 text-zinc-50"
                        : "btn-primary-glow text-white"
                    } disabled:opacity-50`}
                  >
                    {stripeSent
                      ? "Stripe sent"
                      : sendingStripe
                        ? "Sending…"
                        : "Send Stripe link"}
                  </button>

                  <button
                    type="button"
                    onClick={endCall}
                    title="End call — save results & feedback"
                    className="min-h-12 shrink-0 rounded-lg border border-danger/40 bg-gradient-to-r from-danger to-orange-700 px-3 py-2 text-xs font-semibold text-white shadow-[0_0_18px_-6px_var(--glow-danger)] transition-all hover:brightness-110 sm:px-4 sm:text-sm"
                  >
                    End call
                  </button>
                </div>
              </div>
            </div>

            {showTranscript && (
              <aside className="flex h-[min(36vh,16rem)] min-h-0 w-full shrink-0 flex-col border-t border-white/10 bg-[#0c1524] lg:h-auto lg:w-[min(100%,17rem)] lg:max-w-[17rem] lg:border-l lg:border-t-0 xl:w-72 xl:max-w-[18rem]">
                <Transcript
                  messages={messages}
                  isVisible={showTranscript}
                  prospectShortLabel={activePersona.firstName}
                />
              </aside>
            )}
          </div>
        </div>
      </div>

      {showUpgradeOverlay && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-7">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
              Upgrade plan to tier 2 or 3 for more time with {activePersona.firstName}!
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <section className="flex flex-col rounded-xl border border-border bg-background/70 p-4 text-sm text-muted">
                <p className="font-semibold text-foreground">Starter Rep, Tier 1 (Free):</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
                  <li>Limited practice sessions</li>
                  <li>Basic sales scenarios</li>
                  <li>1 user</li>
                </ul>
                <button
                  type="button"
                  disabled
                  className="mt-auto w-full rounded-lg border border-border bg-card-hover px-3 py-2 text-sm font-semibold text-muted opacity-70"
                >
                  Current plan
                </button>
              </section>

              <section className="flex flex-col rounded-xl border border-accent/55 bg-accent/12 p-4 text-sm text-muted shadow-[0_0_0_1px_rgba(67,89,226,0.22)]">
                <p className="font-semibold text-foreground">Pro Seller, Tier 2 ($29/mo)</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
                  <li>Unlimited practice sessions</li>
                  <li>Multiple call types</li>
                  <li>Instant AI feedback</li>
                  <li>Objection handling + closing drills</li>
                  <li>1 user</li>
                </ul>
                <button
                  type="button"
                  className="btn-primary-glow mt-auto w-full rounded-lg px-3 py-2 text-sm font-semibold"
                >
                  Upgrade now
                </button>
              </section>

              <section className="flex flex-col rounded-xl border border-accent/70 bg-[#1a2147] p-4 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(52,66,156,0.35)]">
                <p className="font-semibold text-foreground">Tier 3, Sales Team ($49/mo)</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
                  <li>Everything in Tier 2</li>
                  <li>Multiple team members</li>
                  <li>Team performance tracking</li>
                  <li>Shared scenario library</li>
                  <li>Manager dashboard</li>
                </ul>
                <button
                  type="button"
                  className="mt-auto w-full rounded-lg border border-accent/70 bg-accent px-3 py-2 text-sm font-semibold text-white"
                >
                  Upgrade now
                </button>
              </section>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={endCall}
                className="cursor-pointer text-sm font-medium text-muted underline underline-offset-2 transition-colors hover:text-foreground"
              >
                {'-> '}No thanks, show me my results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
