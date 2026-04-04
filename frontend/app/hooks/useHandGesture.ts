"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

export interface HandData {
  label: "Left" | "Right";
  wrist: { x: number; y: number };       // normalized 0-1
  indexTip: { x: number; y: number };
  thumbTip: { x: number; y: number };
  pinching: boolean;
  landmarks: { x: number; y: number; z: number }[];
}

interface UseHandGestureReturn {
  handData: HandData[];
  cameraActive: boolean;
  toggleCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  handDataRef: React.RefObject<HandData[]>;
  errorMsg: string | null;
}

const PINCH_THRESHOLD = 0.07; // normalized distance

export function useHandGesture(): UseHandGestureReturn {
  const [cameraActive, setCameraActive] = useState(false);
  const [handData, setHandData] = useState<HandData[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const handDataRef = useRef<HandData[]>([]);
  const lastStateUpdateRef = useRef<number>(0);

  /* ---------- Load MediaPipe WASM once ---------- */
  useEffect(() => {
    let cancelled = false;
    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const lm = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) landmarkerRef.current = lm;
      } catch (err: unknown) {
        console.error("[HandGesture] Failed to load MediaPipe:", err);
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setErrorMsg(`MediaPipe Load Error: ${message}`);
        }
      }
    }
    loadModel();
    return () => { cancelled = true; };
  }, []);

  /* ---------- Detection loop ---------- */
  const detect = useCallback(function detectFrame() {
    if (!activeRef.current) return;

    const video = videoRef.current;
    const lm = landmarkerRef.current;
    const canvas = overlayCanvasRef.current;

    if (video && lm && video.readyState >= 2) {
      const result: HandLandmarkerResult = lm.detectForVideo(video, performance.now());
      
      const parsed: HandData[] = [];

      const handednessList = result.handedness;
      if (result.landmarks && handednessList) {
        result.landmarks.forEach((landmarks, i: number) => {
          const handedness = handednessList[i];
          const rawLabel = handedness?.[0]?.categoryName ?? "Right";
          const label: HandData["label"] = rawLabel === "Left" ? "Right" : "Left";

          const wrist = landmarks[0];
          const indexTip = landmarks[8];
          const thumbTip = landmarks[4];

          const dx = indexTip.x - thumbTip.x;
          const dy = indexTip.y - thumbTip.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          parsed.push({
            label,
            wrist: { x: wrist.x, y: wrist.y },
            indexTip: { x: indexTip.x, y: indexTip.y },
            thumbTip: { x: thumbTip.x, y: thumbTip.y },
            pinching: dist < PINCH_THRESHOLD,
            landmarks: landmarks.map((landmark) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z,
            })),
          });
        });
      }

      handDataRef.current = parsed;

      // Throttle React state update to avoid lag (UI only needs ~10fps)
      const now = performance.now();
      if (now - lastStateUpdateRef.current > 100) {
        setHandData(parsed);
        lastStateUpdateRef.current = now;
      }

      /* Draw skeleton on overlay canvas */
      if (canvas && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const W = canvas.width;
          const H = canvas.height;

          const CONNECTIONS = [
            [0,1],[1,2],[2,3],[3,4],
            [0,5],[5,6],[6,7],[7,8],
            [0,9],[9,10],[10,11],[11,12],
            [0,13],[13,14],[14,15],[15,16],
            [0,17],[17,18],[18,19],[19,20],
            [5,9],[9,13],[13,17],
          ];

          parsed.forEach(hand => {
            const pts = hand.landmarks;

            // Draw connections
            ctx.strokeStyle = hand.pinching ? "rgba(245,158,11,0.9)" : "rgba(20,184,166,0.7)";
            ctx.lineWidth = 2;
            CONNECTIONS.forEach(([a, b]) => {
              ctx.beginPath();
              ctx.moveTo((1 - pts[a].x) * W, pts[a].y * H);
              ctx.lineTo((1 - pts[b].x) * W, pts[b].y * H);
              ctx.stroke();
            });

            // Draw key points
            pts.forEach((pt, idx) => {
              const isKey = [0, 4, 8].includes(idx);
              ctx.beginPath();
              ctx.arc((1 - pt.x) * W, pt.y * H, isKey ? 5 : 3, 0, Math.PI * 2);
              ctx.fillStyle = idx === 4 || idx === 8
                ? (hand.pinching ? "#f59e0b" : "#14b8a6")
                : "rgba(255,255,255,0.7)";
              ctx.fill();
            });

            // Pinch indicator line
            if (hand.pinching) {
              ctx.beginPath();
              ctx.moveTo((1 - hand.indexTip.x) * W, hand.indexTip.y * H);
              ctx.lineTo((1 - hand.thumbTip.x) * W, hand.thumbTip.y * H);
              ctx.strokeStyle = "#f59e0b";
              ctx.lineWidth = 3;
              ctx.stroke();
            }
          });
        }
      }
    }

    rafRef.current = requestAnimationFrame(detectFrame);
  }, []);

  /* ---------- Start / stop camera ---------- */
  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
           const playPromise = videoRef.current?.play();
           if (playPromise !== undefined) {
             playPromise.catch((err: unknown) => {
               const message = err instanceof Error ? err.message : String(err);
               const name = err instanceof Error ? err.name : "UnknownError";
               if (name !== "AbortError") {
                 console.error("Video play error:", err);
                 setErrorMsg(`Video play error: ${message}`);
               }
             });
           }
        };
      }
      activeRef.current = true;
      rafRef.current = requestAnimationFrame(detect);
      setCameraActive(true);
    } catch (err: unknown) {
      console.error("[HandGesture] Camera access denied or failed:", err);
      const message = err instanceof Error ? err.message || err.name : String(err);
      setErrorMsg(`Camera access failed: ${message}`);
    }
  }, [detect]);

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setHandData([]);
    setCameraActive(false);
  }, []);

  const toggleCamera = useCallback(() => {
    if (cameraActive) stopCamera();
    else startCamera();
  }, [cameraActive, startCamera, stopCamera]);

  /* ---------- Cleanup on unmount ---------- */
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { handData, cameraActive, toggleCamera, videoRef, overlayCanvasRef, handDataRef, errorMsg };
}
