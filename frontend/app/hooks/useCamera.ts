"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HandData } from "./useHandGesture";

type CameraMode = "off" | "bridge" | "browser";

interface UseCameraReturn {
  handData: HandData[];
  cameraActive: boolean;
  cameraMode: CameraMode;
  toggleCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  handDataRef: React.RefObject<HandData[]>;
  bridgeFrameUrl: string | null;
  errorMsg: string | null;
  statusMsg: string;
}

interface BridgeSnapshot {
  hands?: HandData[];
  frameTimestamp?: number;
}

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_PYTHON_BRIDGE_URL ?? "http://127.0.0.1:8765";
const ACTIVE_POLL_MS = 75;

const PINCH_THRESHOLD = 0.07;

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

export function useCamera(): UseCameraReturn {
  const [cameraMode, setCameraMode] = useState<CameraMode>("off");
  const [handData, setHandData] = useState<HandData[]>([]);
  const [bridgeFrameUrl, setBridgeFrameUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("Camera OFF");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const handDataRef = useRef<HandData[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<unknown>(null);
  const modeRef = useRef<CameraMode>("off");
  const lastStateUpdateRef = useRef<number>(0);

  // Keep ref in sync
  useEffect(() => { modeRef.current = cameraMode; }, [cameraMode]);

  /* ========== Bridge polling ========== */
  useEffect(() => {
    if (cameraMode !== "bridge") return;
    let cancelled = false;

    async function pollBridge() {
      while (!cancelled) {
        try {
          const response = await fetch(`${BRIDGE_URL}/state`, { cache: "no-store" });
          if (!response.ok) throw new Error(`Bridge responded with ${response.status}`);
          const payload = (await response.json()) as BridgeSnapshot;
          const hands = Array.isArray(payload.hands) ? payload.hands : [];
          const frameTimestamp = typeof payload.frameTimestamp === "number" ? payload.frameTimestamp : Date.now();

          if (cancelled) return;
          handDataRef.current = hands;
          setHandData(hands);
          setBridgeFrameUrl(`${BRIDGE_URL}/frame.jpg?t=${frameTimestamp}`);
          setErrorMsg(null);
          setStatusMsg(`Python Bridge · ${hands.length} hand(s)`);
          await new Promise(r => setTimeout(r, ACTIVE_POLL_MS));
        } catch {
          if (cancelled) return;
          // Bridge not available — auto-fallback to browser camera
          setStatusMsg("Python bridge unavailable, switching to browser camera...");
          setCameraMode("browser");
          return;
        }
      }
    }

    void pollBridge();
    return () => { cancelled = true; };
  }, [cameraMode]);

  /* ========== Browser camera + MediaPipe ========== */
  useEffect(() => {
    if (cameraMode !== "browser") return;
    let cancelled = false;

    async function startBrowserCamera() {
      setErrorMsg(null);
      setBridgeFrameUrl(null);
      setStatusMsg("Starting browser camera...");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch {}
        }

        setStatusMsg("Camera active · Loading hand tracking...");

        // Dynamically load MediaPipe
        try {
          const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
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

          if (cancelled) return;
          landmarkerRef.current = lm;
          setStatusMsg("Browser Camera · Hand Tracking Active");
          setErrorMsg(null);

          // Detection loop
          function detectFrame() {
            if (cancelled || modeRef.current !== "browser") return;

            const video = videoRef.current;
            const canvas = overlayCanvasRef.current;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const landmarker = landmarkerRef.current as any;

            if (video && landmarker && video.readyState >= 2) {
              const result = landmarker.detectForVideo(video, performance.now());
              const parsed: HandData[] = [];

              if (result.landmarks && result.handedness) {
                result.landmarks.forEach((landmarks: {x:number;y:number;z:number}[], i: number) => {
                  const handedness = result.handedness[i];
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
                    landmarks: landmarks.map(l => ({ x: l.x, y: l.y, z: l.z })),
                  });
                });
              }

              handDataRef.current = parsed;
              const now = performance.now();
              if (now - lastStateUpdateRef.current > 100) {
                setHandData(parsed);
                lastStateUpdateRef.current = now;
              }

              // Draw skeleton overlay
              if (canvas && video.videoWidth > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  const W = canvas.width;
                  const H = canvas.height;

                  parsed.forEach(hand => {
                    const pts = hand.landmarks;
                    ctx.strokeStyle = hand.pinching ? "rgba(245,158,11,0.9)" : "rgba(20,184,166,0.7)";
                    ctx.lineWidth = 2;
                    HAND_CONNECTIONS.forEach(([a, b]) => {
                      ctx.beginPath();
                      ctx.moveTo((1 - pts[a].x) * W, pts[a].y * H);
                      ctx.lineTo((1 - pts[b].x) * W, pts[b].y * H);
                      ctx.stroke();
                    });

                    pts.forEach((pt, idx) => {
                      const isKey = [0, 4, 8].includes(idx);
                      ctx.beginPath();
                      ctx.arc((1 - pt.x) * W, pt.y * H, isKey ? 5 : 3, 0, Math.PI * 2);
                      ctx.fillStyle = idx === 4 || idx === 8
                        ? (hand.pinching ? "#f59e0b" : "#14b8a6")
                        : "rgba(255,255,255,0.7)";
                      ctx.fill();
                    });

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
          }

          rafRef.current = requestAnimationFrame(detectFrame);

        } catch (mpErr) {
          if (cancelled) return;
          console.warn("[useCamera] MediaPipe load failed, camera still works without hand tracking:", mpErr);
          setStatusMsg("Browser Camera · No hand tracking (MediaPipe unavailable)");
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setErrorMsg(`Camera access failed: ${message}`);
        setStatusMsg("Camera error");
        setCameraMode("off");
      }
    }

    void startBrowserCamera();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [cameraMode]);

  /* ========== Toggle ========== */
  const toggleCamera = useCallback(() => {
    setCameraMode(prev => {
      if (prev === "off") {
        // Try bridge first, it will auto-fallback to browser
        setStatusMsg("Connecting...");
        setErrorMsg(null);
        setBridgeFrameUrl(null);
        handDataRef.current = [];
        setHandData([]);
        return "bridge";
      } else {
        // Turn off
        setStatusMsg("Camera OFF");
        setErrorMsg(null);
        setBridgeFrameUrl(null);
        handDataRef.current = [];
        setHandData([]);
        return "off";
      }
    });
  }, []);

  return {
    handData,
    cameraActive: cameraMode !== "off",
    cameraMode,
    toggleCamera,
    videoRef,
    overlayCanvasRef,
    handDataRef,
    bridgeFrameUrl,
    errorMsg,
    statusMsg,
  };
}
