"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Avatar, { type AvatarHandle } from "@/components/Avatar";
import CallTimer from "@/components/CallTimer";
import Transcript, { TranscriptMessage } from "@/components/Transcript";
import { getPersonaById, PERSONAS, type Persona } from "@/lib/personas";
import CallProblemPanel from "@/components/CallProblemPanel";
import PersonaFace from "@/components/PersonaFace";
import { TRAINING_MODES, getModeById, type TrainingModeId } from "@/lib/modes";
import { getInitialMessageForPersona } from "@/lib/prospect-prompt";
import { defaultProgress, loadProgress, personaAllowed } from "@/lib/gamification";

const UserCallCamera = dynamic(() => import("@/components/UserCallCamera"), {
  ssr: false,
  loading: () => (
    <div className="absolute right-2 top-2 z-[2] flex w-[min(calc(100%-1rem),11.25rem)] flex-col overflow-hidden rounded-xl border border-white/[0.12] bg-[#070708] shadow-xl sm:right-3 sm:top-3 sm:w-[12rem]">
      <div className="relative flex aspect-video items-center justify-center bg-[#0a0a0c]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/25 border-t-cyan-400" />
      </div>
      <div className="border-t border-white/[0.08] px-2.5 py-2 text-center text-[10px] font-medium text-zinc-500">
        Preparing your camera…
      </div>
    </div>
  ),
});

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
  const [personaId, setPersonaId] = useState<string>("mason-vale");
  const [modeId, setModeId] = useState<TrainingModeId>("full_call");
  const [stripeSent, setStripeSent] = useState(false);
  const [sendingStripe, setSendingStripe] = useState(false);
  const [speechHint, setSpeechHint] = useState<string | null>(null);
  const [typedLine, setTypedLine] = useState("");
  const [showSessionLog, setShowSessionLog] = useState(false);

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
      await waitForAvatarHandle();
      const heygen = avatarRef.current;
      if (heygen) {
        try {
          setIsAiTalking(true);
          await heygen.speak(text);
          setIsAiTalking(false);
          return;
        } catch (e) {
          console.warn("[call] HeyGen speak failed, using browser TTS", e);
          setIsAiTalking(false);
        }
      }

      await new Promise<void>((resolve) => {
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
              (v.lang.startsWith("en") &&
                v.name.toLowerCase().includes("female")),
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
    },
    [waitForAvatarHandle],
  );

  const sendToAI = useCallback(
    async (userText: string) => {
      const cleaned = userText.trim();
      if (!cleaned) return;

      chatHistoryRef.current.push({ role: "user", content: cleaned });
      const userMsg: TranscriptMessage = {
        role: "user",
        content: cleaned,
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
    [getProfile, speak],
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

    if (recognitionRef.current && (isListening || shouldListenRef.current)) {
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

    const clearSilenceFlushTimer = () => {
      if (silenceFlushTimerRef.current) {
        clearTimeout(silenceFlushTimerRef.current);
        silenceFlushTimerRef.current = null;
      }
    };

    const submitTranscript = async (text: string) => {
      const cleaned = text.trim();
      if (!cleaned || awaitingAiRef.current) return;

      awaitingAiRef.current = true;
      shouldListenRef.current = false;
      clearSilenceFlushTimer();
      setCurrentTranscript("");
      setIsListening(false);

      try {
        recognition.stop();
      } catch {
        /* ignore */
      }

      finalTranscript = "";
      interimTranscript = "";

      try {
        await sendToAI(cleaned);
      } finally {
        awaitingAiRef.current = false;
        shouldListenRef.current =
          callStateRef.current === "active" && !isMutedRef.current;
        if (shouldListenRef.current) {
          try {
            recognition.start();
            setIsListening(true);
          } catch {
            /* ignore */
          }
        }
      }
    };

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

      const textToSend = finalTranscript.trim();
      if (textToSend) {
        void submitTranscript(textToSend);
        return;
      }

      if (interimTranscript) {
        clearSilenceFlushTimer();
        silenceFlushTimerRef.current = setTimeout(() => {
          void submitTranscript(interimTranscript);
        }, 1600);
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
  }, [isListening, sendToAI]);

  const sendTypedReply = useCallback(() => {
    const t = typedLine.trim();
    if (!t || isAiTalking) return;
    setTypedLine("");
    setSpeechHint(null);
    setCurrentTranscript("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    sendToAI(t).then(() => {
      if (!isMutedRef.current) {
        startListening();
      }
    });
  }, [typedLine, isAiTalking, sendToAI, startListening]);

  const startCall = useCallback(async () => {
    const p = loadProgress();
    const persona = getPersonaById(personaId);
    if (!personaAllowed(persona, p)) {
      alert(
        "This prospect unlocks as your best overall score and call count improve — check the dashboard for locked prospects."
      );
      return;
    }

    localStorage.setItem("closearena_call_persona", personaId);
    localStorage.setItem("closearena_call_mode", modeId);

    setCallState("active");
    setCallStartTime(Date.now());
    setMessages([]);
    setStripeSent(false);
    setSpeechHint(null);
    setTypedLine("");
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
  }, [personaId, modeId, speak, startListening]);

  const endCall = useCallback(() => {
    setCallState("ended");
    setIsListening(false);
    setIsAiTalking(false);
    shouldListenRef.current = false;
    awaitingAiRef.current = false;
    if (silenceFlushTimerRef.current) {
      clearTimeout(silenceFlushTimerRef.current);
      silenceFlushTimerRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

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
      shouldListenRef.current = true;
      startListening();
    } else {
      shouldListenRef.current = false;
      if (silenceFlushTimerRef.current) {
        clearTimeout(silenceFlushTimerRef.current);
        silenceFlushTimerRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    }
    setIsMuted(!isMuted);
  }, [isMuted, startListening]);

  const activePersona = getPersonaById(personaId);
  const activeMode = getModeById(modeId);

  if (callState === "waiting") {
    return (
      <div className="relative flex min-h-screen flex-col bg-background">
        <div className="page-mesh-bg opacity-50" aria-hidden />
        <header className="relative z-[1] flex items-center justify-between border-b border-sky-500/20 bg-[#0f172a]/90 px-4 py-2.5 backdrop-blur-xl">
          <Link
            href="/dashboard"
            className="font-hud text-xs font-medium uppercase tracking-wide text-sky-200/75 transition-colors hover:text-sky-100"
          >
            ← Problem list
          </Link>
          <span className="font-display text-xs font-semibold tracking-wide text-zinc-100">
            CloserArena <span className="text-sky-400/55">·</span>{" "}
            <span style={{ color: "#ffa116" }} className="font-mono">
              practice
            </span>
          </span>
          <span className="w-20 text-right font-hud text-[10px] text-sky-300/50">Beta</span>
        </header>

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="flex max-h-[min(48vh,420px)] min-h-0 shrink-0 flex-col border-b border-white/10 lg:max-h-none lg:w-[min(44vw,30rem)] lg:border-b-0 lg:border-r lg:border-white/10">
            <CallProblemPanel persona={activePersona} mode={activeMode} variant="setup" />
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
              <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-white">
                Pick your opponent
              </h1>
              <p className="mt-2 text-sm text-sky-100/60">
                Mic + speakers on · Chrome recommended for voice
              </p>

              <label className="mb-2 mt-8 block font-hud text-[10px] font-semibold uppercase tracking-wider text-sky-200/55">
                Language / Mode
              </label>
              <select
                value={modeId}
                onChange={(e) => setModeId(e.target.value as TrainingModeId)}
                className="w-full rounded-xl border border-white/15 bg-black/25 py-3 pl-3 pr-8 text-sm text-white shadow-inner backdrop-blur-md focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
              >
                {TRAINING_MODES.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#111c2e]">
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-sky-100/50">{activeMode.description}</p>

              <h2 className="mb-3 mt-8 font-hud text-[10px] font-semibold uppercase tracking-wider text-sky-200/55">
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
                          ? "border-sky-400/50 bg-white/15 ring-2 ring-sky-400/35 backdrop-blur-md"
                          : "border-white/10 bg-black/20 backdrop-blur-md hover:border-sky-400/30 hover:bg-white/10"
                      } ${!allowed ? "cursor-not-allowed opacity-45" : ""}`}
                    >
                      <PersonaFace personaId={p.id} displayName={p.displayName} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-sm font-bold text-white">{p.displayName}</div>
                        <div className="truncate text-xs text-sky-100/55">{p.nicheGoal}</div>
                      </div>
                      <div className="shrink-0 text-right font-hud text-[10px] uppercase tracking-wide text-sky-200/60">
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

              <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/12 bg-black/25 p-4 backdrop-blur-md">
                <PersonaFace personaId={activePersona.id} displayName={activePersona.displayName} size={44} />
                <div className="min-w-0">
                  <p className="font-hud text-[10px] font-semibold uppercase tracking-wider text-sky-200/50">
                    Selected
                  </p>
                  <p className="text-sm font-semibold text-white">{activePersona.displayName}</p>
                  <p className="text-xs text-sky-100/55">{activePersona.personalityType}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={startCall}
                className="mt-8 w-full rounded-xl bg-[#2cbb5d] py-3.5 text-sm font-bold text-white shadow-[0_0_32px_-6px_rgba(44,187,93,0.55)] transition-all hover:brightness-110 active:scale-[0.99] sm:py-4 sm:text-base"
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
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-sky-500/20 bg-[#0f172a]/95 px-3 py-2 backdrop-blur-xl sm:px-4">
        <Link
          href="/dashboard"
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-sky-100/85 transition-colors hover:border-sky-400/35 hover:text-white"
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
          <CallProblemPanel persona={activePersona} mode={activeMode} variant="active" />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0f0815]">
          {/* Toolbar */}
          <div className="flex shrink-0 flex-col gap-1.5 border-b border-white/10 bg-[#111c2e] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="shrink-0 rounded bg-sky-600/40 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-sky-50">
                Live
              </span>
              <span className="hidden font-mono text-[11px] text-zinc-500 sm:inline">{modeLabel}</span>
              <p className="w-full text-[10px] leading-snug text-zinc-500 sm:w-auto sm:max-w-[20rem]">
                <span className="text-sky-300/85">Objections:</span> happen in the live call (voice +
                transcript). Likely lines are under{" "}
                <span className="text-zinc-400">Problem → Constraints</span>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CallTimer isActive={callState === "active"} startTime={callStartTime} />
              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  showTranscript
                    ? "border-sky-400/45 bg-sky-500/15 text-sky-100"
                    : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20"
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
                    : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20"
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
              <div className="relative min-h-0 flex-1 p-2 sm:p-3">
                <div className="relative h-full min-h-[160px] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-[#132238] via-[#0f172a] to-[#0a0f18] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div
                    className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-sky-500/15"
                    aria-hidden
                  />
                  <Avatar
                    ref={avatarRef}
                    isTalking={isAiTalking}
                    isListening={isListening}
                    displayName={activePersona.displayName}
                    avatarTone={activePersona.avatarTone}
                  />

                  <UserCallCamera
                    enabled={callState === "active"}
                    isListening={isListening}
                    isMuted={isMuted}
                  />

                  {currentTranscript && (
                    <div className="absolute bottom-4 left-3 right-3 z-[1] max-w-[min(100%,28rem)] sm:bottom-5 sm:left-4">
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
              </div>

              {/* Optional bottom: mic / voice diagnostics (LeetCode “test result” style) */}
              {showSessionLog && (
                <div className="flex max-h-[200px] min-h-[120px] shrink-0 flex-col border-t border-white/10 bg-[#0f172a]">
                  <div className="shrink-0 border-b border-white/10 px-3 py-1.5 font-hud text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Session log
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3 text-left">
                    {speechHint ? (
                      <p className="text-sm leading-relaxed text-amber-200/95">{speechHint}</p>
                    ) : (
                      <p className="font-mono text-xs text-zinc-500">
                        No voice warnings. If the mic or network fails, details show here.
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

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all ${
                      isMuted
                        ? "bg-rose-600 text-white shadow-[0_0_28px_-6px_rgba(225,29,72,0.55)] ring-2 ring-rose-400/30"
                        : "bg-[#1c1c21] text-white ring-1 ring-white/12 hover:bg-[#25252c] hover:ring-sky-400/30"
                    }`}
                    title={isMuted ? "Unmute microphone" : "Mute microphone"}
                  >
                    {isMuted ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        ? "border border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                        : "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_28px_-8px_rgba(14,165,233,0.45)] hover:brightness-110"
                    } disabled:opacity-50`}
                  >
                    {stripeSent ? "Stripe sent" : sendingStripe ? "Sending…" : "Send Stripe link"}
                  </button>

                  <button
                    type="button"
                    onClick={endCall}
                    title="End call — save results & feedback"
                    className="min-h-12 shrink-0 rounded-lg border border-rose-500/35 bg-gradient-to-r from-rose-600 to-red-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_0_18px_-6px_rgba(248,113,113,0.4)] transition-all hover:brightness-110 sm:px-4 sm:text-sm"
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
    </div>
  );
}
