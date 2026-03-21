"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Avatar from "@/components/Avatar";
import CallTimer from "@/components/CallTimer";
import Transcript, { TranscriptMessage } from "@/components/Transcript";
import { INITIAL_PROSPECT_MESSAGE } from "@/lib/prospect-prompt";

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

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesRef = useRef<TranscriptMessage[]>([]);
  const chatHistoryRef = useRef<{ role: string; content: string }[]>([]);

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const getProfile = useCallback(() => {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem("closearena_profile");
    return stored ? JSON.parse(stored) : {};
  }, []);

  const speak = useCallback(
    (text: string) => {
      return new Promise<void>((resolve) => {
        if ("speechSynthesis" in window) {
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(text);
          synthRef.current = utterance;

          // Try to find a female voice
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
    },
    []
  );

  const sendToAI = useCallback(
    async (userText: string) => {
      // Add user message to chat history
      chatHistoryRef.current.push({ role: "user", content: userText });

      // Add to transcript
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
          }),
        });

        const data = await response.json();
        const aiText = data.response;

        // Add AI response to chat history
        chatHistoryRef.current.push({ role: "assistant", content: aiText });

        // Add to transcript
        const aiMsg: TranscriptMessage = {
          role: "prospect",
          content: aiText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Speak the response
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
          // When we get a final result, send it to the AI
          const textToSend = finalTranscript.trim();
          if (textToSend) {
            // Pause recognition while AI responds
            recognition.stop();
            setIsListening(false);
            setCurrentTranscript("");
            finalTranscript = "";
            sendToAI(textToSend).then(() => {
              // Resume listening after AI finishes
              try {
                recognition.start();
                setIsListening(true);
              } catch {
                // Ignore if already started
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

    recognition.onend = () => {
      // Auto-restart if call is still active and not muted
      // The sendToAI handler manages restart after AI response
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [sendToAI]);

  const startCall = useCallback(async () => {
    setCallState("active");
    setCallStartTime(Date.now());
    setMessages([]);
    chatHistoryRef.current = [];

    // Load voices first
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      // Small delay to ensure voices are loaded
      await new Promise((r) => setTimeout(r, 500));
    }

    // AI says hello first
    const greeting = INITIAL_PROSPECT_MESSAGE;
    chatHistoryRef.current.push({ role: "assistant", content: greeting });
    setMessages([
      { role: "prospect", content: greeting, timestamp: Date.now() },
    ]);
    await speak(greeting);

    // Start listening
    startListening();
  }, [speak, startListening]);

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

    // Save call data for feedback
    const callData = {
      messages: messagesRef.current,
      duration: callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0,
      timestamp: Date.now(),
    };
    localStorage.setItem("closearena_last_call", JSON.stringify(callData));

    // Navigate to feedback
    window.location.href = "/feedback";
  }, [callStartTime]);

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

  // Waiting screen
  if (callState === "waiting") {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-card border border-border mx-auto flex items-center justify-center">
            <svg
              className="w-8 h-8 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ready to practice?</h1>
            <p className="text-muted mt-2">
              You&apos;re about to join a sales call with Sarah Mitchell.
              <br />
              She&apos;s interested in fitness coaching but hasn&apos;t committed yet.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 max-w-sm mx-auto text-left space-y-2">
            <p className="text-sm text-muted">Tips:</p>
            <ul className="text-sm space-y-1 text-foreground/80">
              <li>• Build rapport first</li>
              <li>• Ask discovery questions</li>
              <li>• Listen for pain points</li>
              <li>• Handle objections with empathy</li>
              <li>• Close with confidence</li>
            </ul>
          </div>
          <button
            onClick={startCall}
            className="px-8 py-3 bg-success hover:bg-success/90 text-white rounded-lg font-medium transition-colors text-lg"
          >
            Join Call
          </button>
        </div>
      </div>
    );
  }

  // Active call UI — Zoom/Meet inspired
  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">CloseArena</span>
          <span className="text-xs text-muted">|</span>
          <span className="text-xs text-muted">Practice Call</span>
        </div>
        <CallTimer isActive={callState === "active"} startTime={callStartTime} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`p-2 rounded-lg text-sm transition-colors ${
              showTranscript
                ? "bg-accent/20 text-accent"
                : "text-muted hover:text-foreground"
            }`}
            title="Toggle transcript"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Video area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Avatar area */}
          <div className="flex-1 relative">
            <Avatar isTalking={isAiTalking} isListening={isListening} />

            {/* User's "camera" thumbnail */}
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

            {/* Live transcription overlay */}
            {currentTranscript && (
              <div className="absolute bottom-4 left-4 right-48 bg-black/70 rounded-lg px-4 py-2">
                <p className="text-sm text-white/90">{currentTranscript}...</p>
              </div>
            )}
          </div>

          {/* Bottom control bar */}
          <div className="bg-[#111] px-4 py-3 flex items-center justify-center gap-3">
            {/* Mute button */}
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isMuted
                  ? "bg-danger text-white"
                  : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg
                  className="w-5 h-5"
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
                  className="w-5 h-5"
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

            {/* End call button */}
            <button
              onClick={endCall}
              className="px-6 py-3 bg-danger hover:bg-danger/90 text-white rounded-full font-medium transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                />
              </svg>
              End Call
            </button>
          </div>
        </div>

        {/* Transcript panel */}
        {showTranscript && (
          <div className="w-80 border-l border-border bg-[#111] flex-shrink-0">
            <Transcript messages={messages} isVisible={showTranscript} />
          </div>
        )}
      </div>
    </div>
  );
}
