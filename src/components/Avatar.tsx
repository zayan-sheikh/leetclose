"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  AgentEventsEnum,
  LiveAvatarSession,
  SessionEvent,
} from "@heygen/liveavatar-web-sdk";
import {
  isLiveAvatarRoomConnected,
  liveSpeakText,
  liveSpeakResponse,
} from "@/lib/liveavatar-speak";
import type { Persona } from "@/lib/personas";

export type AvatarHandle = {
  /** Speaks via Live Avatar (HeyGen). Waits until the session is ready, then until speech ends. */
  speak: (text: string) => Promise<void>;
  /** Immediately silences any active media and stops the underlying HeyGen session. */
  hardSilence: () => void;
};

interface AvatarProps {
  isTalking: boolean;
  isListening: boolean;
  displayName: string;
  avatarTone?: Persona["avatarTone"];
}

const toneRing = {
  warm: "ring-accent/40 shadow-accent/10",
  neutral: "ring-white/20 shadow-white/5",
  cool: "ring-sky-400/30 shadow-sky-500/10",
  deep: "ring-amber-900/40 shadow-amber-950/20",
} as const;

const SESSION_WAIT_MS = 30_000;
const ROOM_WAIT_MS = 10_000;
const SPEAK_START_TIMEOUT_MS = 12_000;
const SPEAK_END_TIMEOUT_MS = 90_000;

const Avatar = forwardRef<AvatarHandle, AvatarProps>(function Avatar(
  { isTalking, isListening, displayName, avatarTone = "warm" },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const statusRef = useRef<"loading" | "ready" | "error">("loading");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ring = toneRing[avatarTone];

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useImperativeHandle(ref, () => ({
    speak: async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const deadline = Date.now() + SESSION_WAIT_MS;
      while (Date.now() < deadline) {
        if (sessionRef.current && statusRef.current === "ready") break;
        await new Promise((r) => setTimeout(r, 100));
      }

      const session = sessionRef.current;
      if (!session || statusRef.current !== "ready") {
        throw new Error("Live Avatar session is not ready");
      }

      const roomDeadline = Date.now() + ROOM_WAIT_MS;
      while (Date.now() < roomDeadline && !isLiveAvatarRoomConnected(session)) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!isLiveAvatarRoomConnected(session)) {
        throw new Error("Live Avatar room is not connected yet");
      }

      await new Promise<void>((resolve, reject) => {
        let finished = false;
        let started = false;

        const finish = () => {
          if (finished) return;
          finished = true;
          cleanup();
          resolve();
        };

        const onStart = () => {
          started = true;
          clearTimeout(startTimeoutId);
        };

        const onEnd = () => finish();

        const cleanup = () => {
          session.off(AgentEventsEnum.AVATAR_SPEAK_STARTED, onStart);
          session.off(AgentEventsEnum.AVATAR_SPEAK_ENDED, onEnd);
          clearTimeout(retryDispatchId);
          clearTimeout(startTimeoutId);
          clearTimeout(timeoutId);
        };

        const retryDispatchId = setTimeout(() => {
          if (started || finished) return;
          try {
            // Some sandbox sessions only react to response-style command events.
            liveSpeakResponse(session, trimmed);
          } catch {
            /* keep waiting for start timeout */
          }
        }, 1200);

        const startTimeoutId = setTimeout(() => {
          // Some sandbox sessions do not emit AVATAR_SPEAK_STARTED reliably.
          // Keep waiting for AVATAR_SPEAK_ENDED instead of failing fast.
          console.warn(
            "Live Avatar did not emit speak_started in time (possible FULL/LITE mode mismatch)",
          );
        }, SPEAK_START_TIMEOUT_MS);

        const timeoutId = setTimeout(() => {
          // Do not hard-fail the call flow if end events are missing in sandbox mode.
          finish();
        }, SPEAK_END_TIMEOUT_MS);

        session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, onStart);
        session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, onEnd);
        try {
          // Use direct text-speak command on data channel; avoid SDK WS dispatch.
          liveSpeakText(session, trimmed);
        } catch (e) {
          try {
            liveSpeakResponse(session, trimmed);
          } catch {
            cleanup();
            reject(e);
          }
        }
      });
    },
    hardSilence: () => {
      const video = videoRef.current;
      if (video) {
        video.muted = true;
        video.volume = 0;
        const stream = video.srcObject as MediaStream | null;
        if (stream) {
          stream.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
        }
      }

      const session = sessionRef.current;
      if (session) {
        void session.stop().catch(() => {
          /* ignore stop errors during forced teardown */
        });
      }
    },
  }));

  useEffect(() => {
    let cancelled = false;

    async function startSession() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const res = await fetch("/api/token", { method: "POST" });
        const payload = await res.json();

        if (!res.ok) {
          const base =
            typeof payload.error === "string"
              ? payload.error
              : "Could not get Live Avatar token";
          const detailRaw =
            payload && typeof payload === "object" && "detail" in payload
              ? String((payload as { detail?: unknown }).detail ?? "")
              : "";
          const detail = detailRaw.trim();
          throw new Error(detail ? `${base}: ${detail}` : base);
        }

        const token = payload.token as string | undefined;
        if (!token) {
          throw new Error("Missing token in response");
        }

        if (cancelled) return;

        /* voiceChat: false — we use the browser SpeechRecognition for the user; HeyGen speaks via session.message() */
        const session = new LiveAvatarSession(token, { voiceChat: false });
        sessionRef.current = session;

        const onStreamReady = () => {
          if (cancelled || !videoRef.current) return;
          session.attach(videoRef.current);
          setStatus("ready");
        };

        session.on(SessionEvent.SESSION_STREAM_READY, onStreamReady);
        await session.start();
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            e instanceof Error ? e.message : "Live Avatar failed to start",
          );
        }
      }
    }

    startSession();

    return () => {
      cancelled = true;
      const s = sessionRef.current;
      sessionRef.current = null;
      void s?.stop();
    };
  }, []);

  return (
    <div className="relative flex h-full w-full min-h-0 flex-col [container-type:size]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a15] rounded-xl" />

      <div className="relative z-0 flex min-h-0 flex-1 flex-col items-start justify-center gap-1.5 px-1 pb-1 sm:gap-2 sm:px-2 sm:pb-2">
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-start">
          <div className="relative h-[min(100cqh,100cqw)] w-[min(100cqh,100cqw)] max-h-full max-w-full min-h-0 min-w-0">
            {isTalking && (
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[min(72cqh,72cqw)] w-[min(72cqh,72cqw)] max-h-[78%] max-w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl animate-pulse"
                aria-hidden
              />
            )}
            {isTalking && (
              <div className="pointer-events-none absolute -inset-1 z-10 rounded-2xl border-2 border-accent/30 animate-pulse-ring" />
            )}

            <div
              className={`relative h-full w-full overflow-hidden rounded-xl bg-black/80 shadow-lg ring-2 sm:rounded-2xl ${ring}`}
            >
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                autoPlay
              />

              {isListening && status === "ready" && (
                <span
                  className="absolute right-3 top-3 z-20 h-2.5 w-2.5 animate-pulse rounded-full bg-success shadow-lg shadow-success/40"
                  title="Listening"
                />
              )}

              {status === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white/90">
                  Connecting to Live Avatar…
                </div>
              )}

              {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 px-4 text-center text-sm text-white/90">
                  <p>Could not load the avatar.</p>
                  {errorMessage && (
                    <p className="text-xs text-white/60">{errorMessage}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center justify-start gap-2 px-1 pb-0.5 sm:px-2">
          <span className="text-white text-sm font-medium">{displayName}</span>
          {isTalking && (
            <div className="flex gap-0.5 items-center">
              <div
                className="w-1 h-3 bg-success rounded-full animate-talk"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1 h-4 bg-success rounded-full animate-talk"
                style={{ animationDelay: "50ms" }}
              />
              <div
                className="w-1 h-2 bg-success rounded-full animate-talk"
                style={{ animationDelay: "100ms" }}
              />
              <div
                className="w-1 h-5 bg-success rounded-full animate-talk"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1 h-3 bg-success rounded-full animate-talk"
                style={{ animationDelay: "200ms" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Avatar;
