"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FaceLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";

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

/** Draw MediaPipe face landmarks (normalized 0–1 → video pixels). Same mirror as video via CSS. */
function drawFaceLandmarks(
  canvas: HTMLCanvasElement | null,
  landmarks: { x: number; y: number }[] | undefined,
  video: HTMLVideoElement
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

  if (!landmarks?.length) return;

  const rMain = Math.max(1.35, Math.min(vw, vh) * 0.00335);
  const rFirst = rMain * 1.55;

  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    const px = lm.x * vw;
    const py = lm.y * vh;
    const r = i === 0 ? rFirst : rMain;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
    ctx.lineWidth = Math.max(1.2, r * 0.4);
    ctx.stroke();
    ctx.fillStyle = i === 0 ? "#fbbf24" : "#22d3ee";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fill();
  }

  const label = `${landmarks.length} pts`;
  ctx.font = "bold 11px ui-monospace, monospace";
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(4, 2, tw + 10, 16);
  ctx.fillStyle = "#e0f2fe";
  ctx.fillText(label, 9, 13);
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
  onReading,
}: UserCallCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);
  const lastPoseRef = useRef({ label: "…", detail: "" });
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
      if (isMediaPipeTfNoise(args)) return;
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
              drawFaceLandmarks(canvasRef.current, lm0, video);
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
            drawFaceLandmarks(canvasRef.current, undefined, video);
          }

          let poseLabel = lastPoseRef.current.label;
          let poseDetail = lastPoseRef.current.detail;
          if (poseLandmarker && frameRef.current % 2 === 0) {
            try {
              const poseRes = poseLandmarker.detectForVideo(video, now);
              const p = inferPosture(poseRes.landmarks[0]);
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

  return (
    <div className="absolute bottom-4 right-4 w-[min(100%,13.5rem)] sm:w-56 rounded-lg border border-border bg-black overflow-hidden shadow-xl">
      <div className="relative aspect-video bg-[#0d0d0d]">
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
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-[10px] text-muted px-2 text-center">
            Starting camera &amp; MediaPipe…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-[10px] text-warning px-2 text-center">
            {error}
          </div>
        )}
      </div>
      <div className="px-2 py-1.5 bg-[#141414] space-y-1 border-t border-border">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-semibold text-foreground">You</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLandmarks((v) => !v)}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                showLandmarks
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-muted hover:text-foreground"
              }`}
              title="Toggle MediaPipe face landmark dots (normalized mesh projected to pixels)"
            >
              Mesh
            </button>
            <span className="text-[9px] text-muted">
              {isMuted ? "Mic off" : isListening ? "Listening" : "Mic on"}
            </span>
          </div>
        </div>
        {reading && !error && (
          <>
            <p className="text-[9px] leading-tight text-accent font-medium truncate" title={reading.expression}>
              Face: {reading.expression}
            </p>
            <p className="text-[9px] leading-tight text-foreground/80 line-clamp-2" title={reading.posture}>
              Body: {reading.posture}
            </p>
          </>
        )}
        <p className="text-[8px] text-muted/80 leading-tight pt-0.5">
          Expression = blendshape scores from MediaPipe Face Landmarker (not a separate emotion model).
          Cyan dots = landmark (x,y) in video pixels. On-device only — not uploaded.
        </p>
      </div>
    </div>
  );
}
