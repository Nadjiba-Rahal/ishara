"use client";

import { useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-web";
import { FilesetResolver, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";

type Point = { x: number; y: number; z: number; visibility?: number };
type Prediction = { predictedSign: string; confidence: number; topPredictions: { sign: string; confidence: number }[] };

const API = process.env.NEXT_PUBLIC_ISHARA_API_URL ?? "http://localhost:5090";
const FEATURE_COUNT = 258;
const FRAME_COUNT = 16;

function normalize(points: Point[]): number[] {
  const origin = points[0] ?? { x: 0, y: 0, z: 0 };
  const centered = points.map(p => [p.x - origin.x, p.y - origin.y, p.z - origin.z]);
  const scale = Math.max(1, ...centered.map(p => Math.hypot(p[0], p[1], p[2])));
  return centered.flatMap(p => p.map(v => v / scale));
}

function makeFeatures(pose: Point[] | undefined, left: Point[] | undefined, right: Point[] | undefined): number[] {
  // Matches the supplied model's 33 pose landmarks (x,y,z,visibility) followed by
  // 21 left-hand and 21 right-hand landmarks (x,y,z).
  const poseValues = Array.from({ length: 33 }, (_, i) => {
    const p = pose?.[i];
    return p ? [p.x, p.y, p.z, p.visibility ?? 0] : [0, 0, 0, 0];
  }).flat();
  const handValues = [...(left ?? []), ...(right ?? [])];
  const hands = normalize(Array.from({ length: 42 }, (_, i) => handValues[i] ?? { x: 0, y: 0, z: 0 })).slice(0, 126);
  return [...poseValues, ...hands].slice(0, FEATURE_COUNT).concat(Array(Math.max(0, FEATURE_COUNT - poseValues.length - hands.length)).fill(0));
}

export default function TranslatePage() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const hand = useRef<HandLandmarker | null>(null);
  const pose = useRef<PoseLandmarker | null>(null);
  const session = useRef<ort.InferenceSession | null>(null);
  const labels = useRef<Record<string, string>>({});
  const frames = useRef<number[][]>([]);
  const busy = useRef(false);
  const active = useRef(false);
  const streak = useRef<{ sign: string; count: number }>({ sign: "", count: 0 });
  const [state, setState] = useState("Loading recognition model…");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");
        hand.current = await HandLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" }, runningMode: "VIDEO", numHands: 2 });
        pose.current = await PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task", delegate: "GPU" }, runningMode: "VIDEO" });
        session.current = await ort.InferenceSession.create("/model/model.onnx");
        labels.current = await fetch("/model/labels.json").then(r => r.json());
        if (!cancelled) setState("Ready — start the camera");
      } catch (e) { console.error(e); if (!cancelled) setState(`Model or landmark runtime failed: ${e instanceof Error ? e.message : JSON.stringify(e)}`); }
    })();
    return () => { cancelled = true; stream.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  async function start() {
    if (!video.current) return;
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      video.current.srcObject = stream.current; await video.current.play(); active.current = true; setRunning(true); setState("Show a sign — collecting frames…"); requestAnimationFrame(process);
    } catch { setState("Camera permission was denied or no camera is available."); }
  }
  function stop() { active.current = false; stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setRunning(false); setState("Camera stopped"); }
  async function process(now: number) {
    if (!active.current || !video.current || !hand.current || !pose.current) return;
    if (!busy.current && video.current.readyState >= 2) {
      busy.current = true;
      try {
        const h = hand.current.detectForVideo(video.current, now);
        const p = pose.current.detectForVideo(video.current, now);
        frames.current.push(makeFeatures(p.landmarks[0], h.landmarks[0], h.landmarks[1]));
        if (frames.current.length > FRAME_COUNT) frames.current.shift();
                if (frames.current.length === FRAME_COUNT && session.current) {
          const input = new ort.Tensor("float32", Float32Array.from(frames.current.flat()), [1, FRAME_COUNT, FEATURE_COUNT]);
          const output = await session.current.run({ landmarks: input });
          const values = Array.from(output.logits.data as Float32Array);
          const max = Math.max(...values), ex = values.map(v => Math.exp(v - max)), total = ex.reduce((a, b) => a + b, 0);
          const ranked = ex.map((v, i) => ({ sign: labels.current[String(i)] ?? `class_${i}`, confidence: v / total })).sort((a, b) => b.confidence - a.confidence).slice(0, 5);
          const top = ranked[0];
          const MIN_CONFIDENCE = 0.55;
          const STABLE_FRAMES = 5;
          if (top.confidence < MIN_CONFIDENCE) {
            streak.current = { sign: "", count: 0 };
            setState("Unsure — hold the sign steady");
          } else if (streak.current.sign === top.sign) {
            streak.current.count += 1;
            if (streak.current.count === STABLE_FRAMES) {
              setPrediction({ predictedSign: top.sign, confidence: top.confidence, topPredictions: ranked });
              setState("Prediction available — live local inference");
            }
          } else {
            streak.current = { sign: top.sign, count: 1 };
          }
        }
      } catch (e) { setState(`Inference error: ${e instanceof Error ? e.message : "unknown error"}`); }
      busy.current = false;
    }
    requestAnimationFrame(process);
  }
  return <main className="shell"><section className="card"><p className="eyebrow">REAL-TIME TRANSLATION</p><h1>Sign → text</h1><p className="muted">Camera frames stay in your browser. Recognition uses the bundled ONNX model after 16 landmark frames are collected.</p><div className="camera"><video ref={video} playsInline muted /><div className="camera-status">{state}</div></div><div className="actions">{running ? <button onClick={stop}>Stop camera</button> : <button onClick={start} disabled={!session.current}>Start camera</button>}</div>{prediction && <div className="result"><span className="arabic">{prediction.predictedSign}</span><strong>{(prediction.confidence * 100).toFixed(1)}%</strong><small>{prediction.topPredictions.slice(1).map(p => `${p.sign} ${(p.confidence * 100).toFixed(1)}%`).join(" · ")}</small></div>}</section></main>;
}