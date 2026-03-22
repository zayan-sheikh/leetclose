"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FaceLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import { FACE_MESH_TESSELATION, POSE_CONNECTIONS } from "@/lib/mediapipe-topology";

const MP_VERSION = "0.10.33";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

/** MediaPipe / TFLite logs this as console.error — Next.js treats it as an app error. */
function isMediaPipeTfNoise(args: unknown[]): boolean {
  const text = args
    .map((a) => (typeof a === "string" ? a : a != null ? String(a) : ""))
    .join(" ");
  return (
    /INFO:\s*Created TensorFlow Lite/i.test(text) ||
    /TensorFlow Lite.*XNNPACK|XNNPACK delegate for CPU/i.test(text) ||
    /InferenceFeedbackManager/i.test(text)
  );
}

/** LiveKit (HeyGen Live Avatar) sometimes logs benign DataChannel noise as console.error. */
function isLiveKitDataChannelNoise(args: unknown[]): boolean {
  const text = args
    .map((a) => (typeof a === "string" ? a : a != null ? String(a) : ""))
    .join(" ");
  return /Unknown DataChannel error on (lossy|reliable)/i.test(text);
}

type NormLandmark = { x: number; y: number; visibility?: number };

/** Face mesh + optional pose skeleton + points. Normalized 0–1 → pixels; same mirror as video via CSS. */
function drawVisionOverlay(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  faceLandmarks: NormLandmark[] | undefined,
  poseLandmarks: NormLandmark[] | undefined
) {
  if (!canvas) return;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw <= 0 || vh <= 0) return;

  if (canvas.width !== vw || canvas.height !== vh) {
    canvas.width = vw;
    canvas.height = vh;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, vw, vh);

  const hasFace = !!faceLandmarks?.length;
  const hasPose = !!poseLandmarks?.length;
  if (!hasFace && !hasPose) return;

  const poseVisible = (lm: NormLandmark) =>
    lm.visibility === undefined || lm.visibility >= 0.25;

  if (hasPose && poseLandmarks) {
    const pl = poseLandmarks;
    ctx.strokeStyle = "rgba(168, 85, 247, 0.55)";
    ctx.lineWidth = Math.max(1.1, Math.min(vw, vh) * 0.004);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (const [a, b] of POSE_CONNECTIONS) {
      const pa = pl[a];
      const pb = pl[b];
      if (!pa || !pb || !poseVisible(pa) || !poseVisible(pb)) continue;
      ctx.moveTo(pa.x * vw, pa.y * vh);
      ctx.lineTo(pb.x * vw, pb.y * vh);
    }
    ctx.stroke();
  }

  if (hasFace && faceLandmarks) {
    const fl = faceLandmarks;
    const n = fl.length;
    ctx.strokeStyle = "rgba(34, 211, 238, 0.22)";
    ctx.lineWidth = Math.max(0.55, Math.min(vw, vh) * 0.00135);
    ctx.beginPath();
    for (const [a, b] of FACE_MESH_TESSELATION) {
      if (a >= n || b >= n) continue;
      const la = fl[a];
      const lb = fl[b];
      ctx.moveTo(la.x * vw, la.y * vh);
      ctx.lineTo(lb.x * vw, lb.y * vh);
    }
    ctx.stroke();

    const rMain = Math.max(0.95, Math.min(vw, vh) * 0.00218);
    const rFirst = rMain * 1.35;
    for (let i = 0; i < n; i++) {
      const lm = fl[i];
      const px = lm.x * vw;
      const py = lm.y * vh;
      const r = i === 0 ? rFirst : rMain;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.88)";
      ctx.lineWidth = Math.max(0.65, r * 0.28);
      ctx.stroke();
      ctx.fillStyle = i === 0 ? "#fbbf24" : "#22d3ee";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, r * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.fill();
    }
  }

  const faceCount = faceLandmarks?.length ?? 0;
  const label = hasFace ? `${faceCount} pts` : hasPose ? "Pose" : "";
  if (!label) return;
  ctx.font = "bold 9px ui-monospace, monospace";
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(3, 2, tw + 8, 13);
  ctx.fillStyle = "#e0f2fe";
  ctx.fillText(label, 7, 11);
}

export interface PresenceReading {
  expression: string;
  posture: string;
  detail: string;
}

interface UserCallCameraProps {
  enabled: boolean;
  isListening: boolean;
  isMuted: boolean;
  /**
   * `floating` — small PiP (default). `docked` — fills a side column on the call stage.
   */
  layout?: "floating" | "docked";
  /** Optional: parent can log or use for future coaching */
  onReading?: (r: PresenceReading | null) => void;
}

function scoreBlendshapes(
  categories: { categoryName: string; score: number }[]
): Record<string, number> {
  const m: Record<string, number> = {};
  for (const c of categories) {
    m[c.categoryName] = c.score;
  }
  return m;
}

function inferExpression(b: Record<string, number>): { label: string; detail: string } {
  const smile =
    (b.mouthSmileLeft ?? 0) + (b.mouthSmileRight ?? 0) + (b.mouthSmile ?? 0);
  const frown =
    (b.mouthFrownLeft ?? 0) +
    (b.mouthFrownRight ?? 0) +
    (b.mouthFrown ?? 0) +
    (b.mouthPressLeft ?? 0) +
    (b.mouthPressRight ?? 0);
  const browWorry = (b.browInnerUp ?? 0) + (b.browOuterUpLeft ?? 0) + (b.browOuterUpRight ?? 0);
  const tension = (b.browDownLeft ?? 0) + (b.browDownRight ?? 0);
  const jawOpen = b.jawOpen ?? 0;
  const squint = (b.eyeSquintLeft ?? 0) + (b.eyeSquintRight ?? 0);

  if (smile > 0.45) {
    return { label: "Warm / engaged", detail: "Smile cues — rapport reads well on camera." };
  }
  if (frown > 0.35 || tension > 0.4) {
    return { label: "Tense / serious", detail: "Brows or mouth show strain — slow down and breathe." };
  }
  if (browWorry > 0.42) {
    return { label: "Concerned / uncertain", detail: "Forehead tension — try grounded eye contact." };
  }
  if (jawOpen > 0.35) {
    return { label: "Speaking (active mouth)", detail: "Jaw open — normal while talking." };
  }
  if (squint > 0.4) {
    return { label: "Focused / intense", detail: "Squinting — can read as sharp; soften if needed." };
  }
  return { label: "Neutral", detail: "Balanced face — add warmth with slight smile if appropriate." };
}

function inferPosture(landmarks: { x: number; y: number; visibility?: number }[] | undefined): {
  label: string;
  detail: string;
} {
  if (!landmarks?.length) {
    return { label: "No pose", detail: "Step back so shoulders are in frame." };
  }
  const lm = landmarks;
  const nose = lm[0];
  const ls = lm[11];
  const rs = lm[12];
  if (!nose || !ls || !rs) {
    return { label: "Upper body unclear", detail: "Center yourself — chest and shoulders visible." };
  }
  if ((ls.visibility ?? 1) < 0.5 || (rs.visibility ?? 1) < 0.5) {
    return { label: "Shoulders off-frame", detail: "Widen the shot to include shoulders." };
  }

  const shoulderMidY = (ls.y + rs.y) / 2;
  const shoulderDiff = Math.abs(ls.y - rs.y);
  const open = shoulderMidY - nose.y;

  if (shoulderDiff > 0.07) {
    return { label: "Uneven shoulders", detail: "One shoulder higher — square up to the camera." };
  }
  if (open > 0.14) {
    return { label: "Upright / open", detail: "Head over shoulders — confident frame." };
  }
  if (open < 0.06) {
    return { label: "Closed / slouched", detail: "Sit tall — lift chest slightly without forcing." };
  }
  return { label: "Neutral posture", detail: "Reasonable alignment for a sales call." };
}

export default function UserCallCamera({
  enabled,
  isListening,
  isMuted,
  layout = "floating",
  onReading,
}: UserCallCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);
  const lastPoseRef = useRef({ label: "…", detail: "" });
  const lastPoseLandmarksRef = useRef<NormLandmark[] | null>(null);
  const lastEmitKey = useRef("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState<PresenceReading | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const showLandmarksRef = useRef(true);
  showLandmarksRef.current = showLandmarks;

  const notify = useCallback(
    (r: PresenceReading | null) => {
      setReading(r);
      onReading?.(r);
    },
    [onReading]
  );

  useEffect(() => {
    if (!enabled) {
      notify(null);
      return;
    }

    let stream: MediaStream | null = null;
    let faceLandmarker: FaceLandmarker | null = null;
    let poseLandmarker: PoseLandmarker | null = null;
    let cancelled = false;

    const origConsoleInfo = console.info.bind(console);
    const origConsoleError = console.error.bind(console);
    const origConsoleWarn = console.warn.bind(console);
    let consoleFiltered = false;

    const filterTfLiteInfo = (...args: unknown[]) => {
      if (isMediaPipeTfNoise(args)) return;
      const msg = String(args[0] ?? "");
      if (/TensorFlow Lite|XNNPACK|tflite|Created TensorFlow|InferenceFeedbackManager/i.test(msg)) {
        return;
      }
      origConsoleInfo(...args);
    };

    const filterTfLiteError = (...args: unknown[]) => {
      if (isMediaPipeTfNoise(args) || isLiveKitDataChannelNoise(args)) return;
      origConsoleError(...args);
    };

    const filterTfLiteWarn = (...args: unknown[]) => {
      if (isMediaPipeTfNoise(args)) return;
      origConsoleWarn(...args);
    };

    const stop = () => {
      if (consoleFiltered) {
        console.info = origConsoleInfo;
        console.error = origConsoleError;
        console.warn = origConsoleWarn;
        consoleFiltered = false;
      }
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      faceLandmarker?.close();
      poseLandmarker?.close();
      faceLandmarker = null;
      poseLandmarker = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    (async () => {
      setLoading(true);
      setError(null);
      lastPoseRef.current = { label: "…", detail: "" };
      lastPoseLandmarksRef.current = null;
      lastEmitKey.current = "";
      try {
        console.info = filterTfLiteInfo;
        console.error = filterTfLiteError;
        console.warn = filterTfLiteWarn;
        consoleFiltered = true;

        const { FaceLandmarker, FilesetResolver, PoseLandmarker } = await import(
          "@mediapipe/tasks-vision"
        );

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (cancelled) {
          stop();
          return;
        }

        const v = videoRef.current;
        if (!v) {
          stop();
          return;
        }
        v.srcObject = stream;
        await v.play();

        const wasm = await FilesetResolver.forVisionTasks(WASM_URL);

        const tryFace = async (delegate: "GPU" | "CPU") => {
          return FaceLandmarker.createFromOptions(wasm, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: true,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        };

        const tryPose = async (delegate: "GPU" | "CPU") => {
          return PoseLandmarker.createFromOptions(wasm, {
            baseOptions: { modelAssetPath: POSE_MODEL, delegate },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        };

        try {
          faceLandmarker = await tryFace("GPU");
        } catch {
          faceLandmarker = await tryFace("CPU");
        }

        try {
          poseLandmarker = await tryPose("GPU");
        } catch {
          poseLandmarker = await tryPose("CPU");
        }

        if (cancelled) {
          stop();
          return;
        }

        const tick = () => {
          if (cancelled || !videoRef.current || !faceLandmarker) {
            return;
          }
          const video = videoRef.current;
          if (video.readyState < 2) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          const now = performance.now();
          frameRef.current += 1;

          let expr = { label: "…", detail: "Analyzing face…" };
          try {
            const faceRes = faceLandmarker.detectForVideo(video, now);
            const lm0 = faceRes.faceLandmarks?.[0];

            if (showLandmarksRef.current) {
              drawVisionOverlay(
                canvasRef.current,
                video,
                lm0,
                lastPoseLandmarksRef.current ?? undefined
              );
            } else if (canvasRef.current) {
              const c = canvasRef.current.getContext("2d");
              if (c && video.videoWidth > 0) {
                if (
                  canvasRef.current.width !== video.videoWidth ||
                  canvasRef.current.height !== video.videoHeight
                ) {
                  canvasRef.current.width = video.videoWidth;
                  canvasRef.current.height = video.videoHeight;
                }
                c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              }
            }

            const shapes = faceRes.faceBlendshapes?.[0];
            if (shapes?.categories?.length) {
              const b = scoreBlendshapes(shapes.categories);
              expr = inferExpression(b);
            } else {
              expr = { label: "Face not visible", detail: "Light your face evenly for reads." };
            }
          } catch {
            expr = { label: "Face scan paused", detail: "" };
            if (showLandmarksRef.current) {
              drawVisionOverlay(
                canvasRef.current,
                video,
                undefined,
                lastPoseLandmarksRef.current ?? undefined
              );
            }
          }

          let poseLabel = lastPoseRef.current.label;
          let poseDetail = lastPoseRef.current.detail;
          if (poseLandmarker && frameRef.current % 2 === 0) {
            try {
              const poseRes = poseLandmarker.detectForVideo(video, now);
              const plm = poseRes.landmarks?.[0];
              if (plm?.length) lastPoseLandmarksRef.current = plm;
              const p = inferPosture(plm);
              poseLabel = p.label;
              poseDetail = p.detail;
              lastPoseRef.current = { label: poseLabel, detail: poseDetail };
            } catch {
              poseLabel = "Posture scan paused";
              poseDetail = "";
            }
          }

          const combined: PresenceReading = {
            expression: expr.label,
            posture: poseDetail ? `${poseLabel} — ${poseDetail}` : poseLabel,
            detail: [expr.detail, poseDetail].filter(Boolean).join(" · "),
          };
          const key = `${combined.expression}|${combined.posture}`;
          if (key !== lastEmitKey.current || frameRef.current % 15 === 0) {
            lastEmitKey.current = key;
            notify(combined);
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        stop();
        const msg = e instanceof Error ? e.message : "Camera or MediaPipe failed";
        setError(msg);
        notify(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      stop();
      notify(null);
    };
  }, [enabled, notify]);

  const rootClass =
    layout === "docked"
      ? "relative z-[2] flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[#070708]"
      : "absolute right-2 top-2 z-[2] w-[min(calc(100%-1rem),11.25rem)] overflow-hidden rounded-xl border border-white/[0.12] bg-[#070708] shadow-[0_16px_36px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.06] sm:right-3 sm:top-3 sm:w-[12rem]";

  const videoShellClass =
    layout === "docked"
      ? "relative min-h-0 flex-1 bg-[#0a0a0c]"
      : "relative aspect-video bg-[#0a0a0c]";

  return (
    <div className={rootClass}>
      <div className={videoShellClass}>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/[0.04]"
          aria-hidden
        />
        <video
          ref={videoRef}
          className="h-full w-full object-cover scale-x-[-1]"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover scale-x-[-1]"
          aria-hidden
        />
        <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
          You
        </div>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 px-3 text-center backdrop-blur-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
            <span className="text-[10px] font-medium text-zinc-300">
              Camera &amp; vision…
            </span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 px-2 text-center text-[10px] leading-snug text-amber-200/95">
            {error}
          </div>
        )}
      </div>
      <div
        className={`space-y-1.5 border-white/[0.08] bg-[#0c0c0e]/95 px-2.5 py-2 backdrop-blur-md ${
          layout === "docked" ? "shrink-0 border-t" : "border-t"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-medium ${
              isMuted ? "text-danger/90" : isListening ? "text-cyan-300/90" : "text-zinc-400"
            }`}
          >
            {isMuted ? "Mic muted" : isListening ? "Listening" : "Mic on"}
          </span>
          <button
            type="button"
            onClick={() => setShowLandmarks((v) => !v)}
            className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors ${
              showLandmarks
                ? "border-cyan-400/45 bg-cyan-400/15 text-cyan-200"
                : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
            }`}
            title="Face mesh + pose skeleton (on-device)"
          >
            Mesh
          </button>
        </div>
        {reading && !error && (
          <>
            <p
              className="truncate text-[10px] font-medium leading-tight text-cyan-200/90"
              title={reading.expression}
            >
              {reading.expression}
            </p>
            <p
              className="line-clamp-2 text-[9px] leading-snug text-zinc-400"
              title={reading.posture}
            >
              {reading.posture}
            </p>
          </>
        )}
        <p
          className="border-t border-white/[0.06] pt-1.5 text-[8px] leading-tight text-zinc-600"
          title="Blendshapes on-device; not uploaded."
        >
          On-device MediaPipe · not uploaded
        </p>
      </div>
    </div>
  );
}
