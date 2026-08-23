"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-web";
import { FilesetResolver, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";

type Point = { x: number; y: number; z: number; visibility?: number };
type Prediction = { predictedSign: string; confidence: number; topPredictions: { sign: string; confidence: number }[] };
type TranscriptChip = { id: string; text: string; kind: "sign" | "space" };
type ModelMeta = {
  frames: number;
  featuresPerFrame: number;
  inputName: string;
  outputName: string;
  useVelocity: boolean;
};

// ---------------------------------------------------------------------
// Fixed by the MediaPipe landmark topology, independent of which model
// is loaded: 33 pose points (x,y,z,visibility) + 21 left-hand + 21
// right-hand points (x,y,z). This is what gets cached to disk per frame
// before any model-specific reshaping (velocity, etc).
// ---------------------------------------------------------------------
const RAW_FEATURES = 258;
const POSE_LM = 33;
const HAND_LM = 21;

const MIN_CONFIDENCE = 0.55;
const STABLE_FRAMES = 5;
const SAMPLE_INTERVAL_MS = 100;

// A light set of hand-skeleton edges for the overlay drawing (thumb,
// index, middle, ring, pinky chains + palm).
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

// ---------------------------------------------------------------------
// NORMALIZATION -- must stay bit-for-bit identical to the training
// notebook: center on mid-hip, scale by shoulder width. See
// public/model/README.md for the canonical spec.
// ---------------------------------------------------------------------
function buildRawFrame(
  poseLandmarks: Point[] | undefined,
  handLandmarksList: Point[][] | undefined,
  handednessList: { categoryName: string }[][] | undefined
): Float32Array {
  const pose = new Float32Array(POSE_LM * 4);
  if (poseLandmarks) {
    for (let i = 0; i < POSE_LM; i++) {
      const p = poseLandmarks[i];
      if (!p) continue;
      pose[i * 4] = p.x;
      pose[i * 4 + 1] = p.y;
      pose[i * 4 + 2] = p.z;
      pose[i * 4 + 3] = p.visibility ?? 0;
    }
  }

  const left = new Float32Array(HAND_LM * 3);
  const right = new Float32Array(HAND_LM * 3);
  if (handLandmarksList && handednessList) {
    for (let h = 0; h < handLandmarksList.length; h++) {
      const label = handednessList[h]?.[0]?.categoryName;
      const target = label === "Left" ? left : label === "Right" ? right : null;
      if (!target) continue;
      const pts = handLandmarksList[h];
      for (let i = 0; i < HAND_LM; i++) {
        const p = pts[i];
        if (!p) continue;
        target[i * 3] = p.x;
        target[i * 3 + 1] = p.y;
        target[i * 3 + 2] = p.z;
      }
    }
  }

  // center = midpoint of hips (23, 24); scale = shoulder width (11, 12)
  const hipLx = pose[23 * 4], hipLy = pose[23 * 4 + 1], hipLz = pose[23 * 4 + 2];
  const hipRx = pose[24 * 4], hipRy = pose[24 * 4 + 1], hipRz = pose[24 * 4 + 2];
  const hipsPresent = (hipLx !== 0 || hipLy !== 0) && (hipRx !== 0 || hipRy !== 0);
  const cx = hipsPresent ? (hipLx + hipRx) / 2 : 0.5;
  const cy = hipsPresent ? (hipLy + hipRy) / 2 : 0.5;
  const cz = hipsPresent ? (hipLz + hipRz) / 2 : 0;

  const shLx = pose[11 * 4], shLy = pose[11 * 4 + 1], shLz = pose[11 * 4 + 2];
  const shRx = pose[12 * 4], shRy = pose[12 * 4 + 1], shRz = pose[12 * 4 + 2];
  const scale = Math.max(Math.hypot(shLx - shRx, shLy - shRy, shLz - shRz), 1e-4);

  const normalizeInPlace = (arr: Float32Array, stride: number) => {
    for (let i = 0; i < arr.length; i += stride) {
      arr[i] = (arr[i] - cx) / scale;
      arr[i + 1] = (arr[i + 1] - cy) / scale;
      arr[i + 2] = (arr[i + 2] - cz) / scale;
    }
  };
  normalizeInPlace(pose, 4);
  normalizeInPlace(left, 3);
  normalizeInPlace(right, 3);

  const out = new Float32Array(RAW_FEATURES);
  out.set(pose, 0);
  out.set(left, 132);
  out.set(right, 195);
  return out;
}

function buildModelInput(rawFrames: Float32Array[], meta: ModelMeta): Float32Array {
  if (!meta.useVelocity) {
    const flat = new Float32Array(meta.frames * RAW_FEATURES);
    rawFrames.forEach((f, i) => flat.set(f, i * RAW_FEATURES));
    return flat;
  }
  const flat = new Float32Array(meta.frames * RAW_FEATURES * 2);
  for (let i = 0; i < rawFrames.length; i++) {
    const cur = rawFrames[i];
    const prev = rawFrames[i - 1] ?? cur;
    const base = i * RAW_FEATURES * 2;
    flat.set(cur, base);
    for (let j = 0; j < RAW_FEATURES; j++) flat[base + RAW_FEATURES + j] = cur[j] - prev[j];
  }
  return flat;
}

export default function TranslatePage() {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const hand = useRef<HandLandmarker | null>(null);
  const pose = useRef<PoseLandmarker | null>(null);
  const session = useRef<ort.InferenceSession | null>(null);
  const labelsRef = useRef<Record<string, string>>({});
  const metaRef = useRef<ModelMeta>({ frames: 16, featuresPerFrame: 258, inputName: "landmarks", outputName: "logits", useVelocity: false });
  const rawFrames = useRef<Float32Array[]>([]);
  const busy = useRef(false);
  const active = useRef(false);
  const lastSampleAt = useRef<number | null>(null);
  const streak = useRef<{ sign: string; count: number }>({ sign: "", count: 0 });
  const chipCounter = useRef(0);

  const [state, setState] = useState("Loading hand & pose tracking…");
  const [modelReady, setModelReady] = useState(false);
  const [modelMissing, setModelMissing] = useState(false);
  const [trackingReady, setTrackingReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastPrediction, setLastPrediction] = useState<Prediction | null>(null);
  const [transcript, setTranscript] = useState<TranscriptChip[]>([]);
  const [bufferFill, setBufferFill] = useState(0);
  const [liveConfidence, setLiveConfidence] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");
        hand.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" },
          runningMode: "VIDEO", numHands: 2,
        });
        pose.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task", delegate: "GPU" },
          runningMode: "VIDEO",
        });
        if (cancelled) return;
        setTrackingReady(true);
        setState("Loading recognition model…");

        try {
          const metaRes = await fetch("/model/metadata.json");
          if (!metaRes.ok) throw new Error("no metadata.json yet");
          const meta = await metaRes.json();
          metaRef.current = {
            frames: meta.frames ?? 16,
            featuresPerFrame: meta.features_per_frame ?? 258,
            inputName: meta.input_name ?? "landmarks",
            outputName: meta.output_name ?? "logits",
            useVelocity: (meta.features_per_frame ?? 258) > RAW_FEATURES,
          };
           if (
             !Number.isInteger(metaRef.current.frames) ||
             metaRef.current.frames < 1 ||
             ![RAW_FEATURES, RAW_FEATURES * 2].includes(metaRef.current.featuresPerFrame)
           ) {
             throw new Error("Unsupported model metadata: expected 258 or 516 features per frame");
           }
          session.current = await ort.InferenceSession.create("/model/model.onnx");
           if (
             !session.current.inputNames.includes(metaRef.current.inputName) ||
             !session.current.outputNames.includes(metaRef.current.outputName)
           ) {
             throw new Error("Model tensor names do not match metadata.json");
           }
          labelsRef.current = await fetch("/model/labels.json").then(r => r.json());
          if (!cancelled) { setModelReady(true); setState("Ready — start the camera"); }
        } catch {
          if (!cancelled) { setModelMissing(true); setState("Camera tracking is ready — no trained model plugged in yet"); }
        }
      } catch (e) {
        if (!cancelled) setState(`Hand/pose tracking failed to load: ${e instanceof Error ? e.message : "unknown error"}`);
      }
    })();
     return () => {
       cancelled = true;
       active.current = false;
       stream.current?.getTracks().forEach(t => t.stop());
     };
  }, []);

  const pushChip = useCallback((text: string, kind: TranscriptChip["kind"]) => {
    chipCounter.current += 1;
    setTranscript(prev => [...prev, { id: `${Date.now()}-${chipCounter.current}`, text, kind }]);
  }, []);

  async function start() {
    if (!video.current) return;
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      video.current.srcObject = stream.current;
      await video.current.play();
      active.current = true;
      setRunning(true);
      setState(modelReady ? "Show a sign — collecting frames…" : "Tracking preview — no model plugged in yet");
      requestAnimationFrame(process);
    } catch {
      setState("Camera permission was denied or no camera is available.");
    }
  }

  function stop() {
    active.current = false;
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
    setRunning(false);
    setState(modelReady ? "Camera stopped" : "Camera stopped — no model plugged in yet");
    rawFrames.current = [];
    lastSampleAt.current = null;
    streak.current = { sign: "", count: 0 };
    setBufferFill(0);
    setLiveConfidence(0);
    const ctx = canvas.current?.getContext("2d");
    if (ctx && canvas.current) ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
  }

  function drawOverlay(poseLandmarks: Point[] | undefined, handLandmarksList: Point[][] | undefined, handednessList: { categoryName: string }[][] | undefined) {
    const cv = canvas.current, vid = video.current;
    if (!cv || !vid) return;
    if (cv.width !== vid.videoWidth || cv.height !== vid.videoHeight) {
      cv.width = vid.videoWidth || 640;
      cv.height = vid.videoHeight || 480;
    }
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);

    if (poseLandmarks) {
      ctx.fillStyle = "#dcece488";
      [11, 12, 23, 24].forEach(i => {
        const p = poseLandmarks[i];
        if (!p) return;
        ctx.beginPath();
        ctx.arc(p.x * cv.width, p.y * cv.height, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    (handLandmarksList ?? []).forEach((pts, h) => {
      const label = handednessList?.[h]?.[0]?.categoryName;
      const color = label === "Left" ? "#dcece4" : "#f3d887";
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      pts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
      const pad = 0.03;
      minX -= pad; maxX += pad; minY -= pad; maxY += pad;

      ctx.strokeStyle = "#e6634f";
      ctx.lineWidth = 2;
      HAND_CONNECTIONS.forEach(([a, b]) => {
        const pa = pts[a], pb = pts[b];
        if (!pa || !pb) return;
        ctx.beginPath();
        ctx.moveTo(pa.x * cv.width, pa.y * cv.height);
        ctx.lineTo(pb.x * cv.width, pb.y * cv.height);
        ctx.stroke();
      });
      ctx.fillStyle = color;
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * cv.width, p.y * cv.height, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // AR-style corner brackets around the hand bounding box
      const x0 = minX * cv.width, y0 = minY * cv.height, x1 = maxX * cv.width, y1 = maxY * cv.height;
      const bracket = Math.min(24, (x1 - x0) * 0.3);
      ctx.strokeStyle = "#e6634f";
      ctx.lineWidth = 3;
      const corners: [number, number, number, number][] = [
        [x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1],
      ];
      corners.forEach(([x, y, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + bracket * dy);
        ctx.lineTo(x, y);
        ctx.lineTo(x + bracket * dx, y);
        ctx.stroke();
      });
    });
  }

  async function process(now: number) {
    if (!active.current || !video.current || !hand.current || !pose.current) return;
    if (!busy.current && video.current.readyState >= 2) {
      busy.current = true;
      try {
        const h = hand.current.detectForVideo(video.current, now);
        const p = pose.current.detectForVideo(video.current, now);
        drawOverlay(p.landmarks[0], h.landmarks, h.handedness as unknown as { categoryName: string }[][]);

        if (session.current && modelReady &&
            (lastSampleAt.current === null || now - lastSampleAt.current >= SAMPLE_INTERVAL_MS)) {
          lastSampleAt.current = now;
          const raw = buildRawFrame(p.landmarks[0], h.landmarks, h.handedness as unknown as { categoryName: string }[][]);
          rawFrames.current.push(raw);
          const target = metaRef.current.frames;
          if (rawFrames.current.length > target) rawFrames.current.shift();
          setBufferFill(rawFrames.current.length / target);

          if (rawFrames.current.length === target) {
            const meta = metaRef.current;
            const flat = buildModelInput(rawFrames.current, meta);
            const input = new ort.Tensor("float32", flat, [1, meta.frames, meta.featuresPerFrame]);
            const output = await session.current.run({ [meta.inputName]: input });
            const values = Array.from(output[meta.outputName].data as Float32Array);
            const max = Math.max(...values);
            const ex = values.map(v => Math.exp(v - max));
            const total = ex.reduce((a, b) => a + b, 0);
            const ranked = ex
              .map((v, i) => ({ sign: labelsRef.current[String(i)] ?? `class_${i}`, confidence: v / total }))
              .sort((a, b) => b.confidence - a.confidence)
              .slice(0, 5);
            const top = ranked[0];

            if (top.confidence < MIN_CONFIDENCE) {
              streak.current = { sign: "", count: 0 };
              setLiveConfidence(0);
              setState("Unsure — hold the sign steady");
            } else if (streak.current.sign === top.sign) {
              streak.current.count += 1;
              setLiveConfidence(streak.current.count / STABLE_FRAMES);
              if (streak.current.count === STABLE_FRAMES) {
                setLastPrediction({ predictedSign: top.sign, confidence: top.confidence, topPredictions: ranked });
                pushChip(top.sign, "sign");
                setState("Added to sentence — keep signing");
                // Clear the window instead of sliding it: prevents the
                // next prediction from being contaminated by transition
                // frames between this sign and the next one, and gives a
                // natural debounce while the buffer refills from empty.
                rawFrames.current = [];
                setBufferFill(0);
                streak.current = { sign: "", count: 0 };
                setLiveConfidence(0);
              }
            } else {
              streak.current = { sign: top.sign, count: 1 };
              setLiveConfidence(1 / STABLE_FRAMES);
            }
          }
        }
      } catch (e) {
        setState(`Inference error: ${e instanceof Error ? e.message : "unknown error"}`);
      }
      busy.current = false;
    }
    requestAnimationFrame(process);
  }

  const sentence = transcript.map(c => c.text).join("");

  return (
    <main className="shell">
      <section className="card translate-card">
        <p className="eyebrow">REAL-TIME TRANSLATION</p>
        <h1>Sign → text</h1>
        <p className="muted">Camera frames stay in your browser. Hand and pose tracking run continuously; signs are added to the sentence below as they're confirmed.</p>

        {modelMissing && (
          <div className="model-missing-banner">
            <strong>No trained model plugged in yet.</strong>
            <span>Camera tracking works below in preview mode. Drop <code>model.onnx</code>, <code>labels.json</code> and <code>metadata.json</code> into <code>apps/web/public/model/</code> and reload to enable recognition.</span>
          </div>
        )}

        <div className="camera">
          <video ref={video} playsInline muted />
          <canvas ref={canvas} className="overlay" />
          <div className={`live-pill ${running ? "live-pill-on" : ""}`}>
            <span className="live-dot" />
            {state}
          </div>
          {running && modelReady && (
            <div className="buffer-ring">
              <svg viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="17" className="ring-track" />
                <circle
                  cx="20" cy="20" r="17" className="ring-fill"
                  style={{ strokeDashoffset: 107 - 107 * bufferFill }}
                />
              </svg>
            </div>
          )}
        </div>

        {running && modelReady && (
          <div className="confidence-bar-track">
            <div className="confidence-bar-fill" style={{ width: `${Math.min(100, liveConfidence * 100)}%` }} />
          </div>
        )}

        <div className="actions">
          {running ? (
            <button onClick={stop}>Stop camera</button>
          ) : (
            <button onClick={start} disabled={!trackingReady}>
              {trackingReady ? "Start camera" : "Loading…"}
            </button>
          )}
        </div>

        <div className="transcript-panel">
          <div className="transcript-header">
            <span className="eyebrow">SENTENCE</span>
            <div className="transcript-actions">
              <button className="btn-ghost-sm" onClick={() => pushChip(" ", "space")}>Add space</button>
              <button className="btn-ghost-sm" onClick={() => setTranscript(prev => prev.slice(0, -1))}>Backspace</button>
              <button className="btn-ghost-sm" onClick={() => setTranscript([])}>Clear</button>
              <button className="btn-ghost-sm" onClick={() => navigator.clipboard?.writeText(sentence)}>Copy</button>
            </div>
          </div>
          <div className="transcript-chips" dir="rtl">
            {transcript.length === 0 && <span className="transcript-empty">Signs will appear here as they're recognized…</span>}
            {transcript.map(chip => (
              <span key={chip.id} className={`chip chip-in ${chip.kind === "space" ? "chip-space" : ""}`}>
                {chip.kind === "space" ? "␣" : chip.text}
              </span>
            ))}
            {running && modelReady && <span className="cursor-blink" />}
          </div>
        </div>

        {lastPrediction && (
          <div className="result">
            <span className="arabic">{lastPrediction.predictedSign}</span>
            <strong>{(lastPrediction.confidence * 100).toFixed(1)}%</strong>
            <small>{lastPrediction.topPredictions.slice(1).map(p => `${p.sign} ${(p.confidence * 100).toFixed(1)}%`).join(" · ")}</small>
          </div>
        )}
      </section>
    </main>
  );
}
