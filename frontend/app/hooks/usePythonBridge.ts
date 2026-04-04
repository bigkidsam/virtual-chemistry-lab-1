"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HandData } from "./useHandGesture";

interface UsePythonBridgeReturn {
  handData: HandData[];
  cameraActive: boolean;
  toggleCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  handDataRef: React.RefObject<HandData[]>;
  bridgeFrameUrl: string | null;
  errorMsg: string | null;
}

interface BridgeSnapshot {
  hands?: HandData[];
  frameTimestamp?: number;
}

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_PYTHON_BRIDGE_URL ?? "http://127.0.0.1:8765";
const ACTIVE_POLL_MS = 75;
const RETRY_POLL_MS = 1000;

const delay = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export function usePythonBridge(): UsePythonBridgeReturn {
  const [bridgeEnabled, setBridgeEnabled] = useState(true);
  const [handData, setHandData] = useState<HandData[]>([]);
  const [bridgeFrameUrl, setBridgeFrameUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const handDataRef = useRef<HandData[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!bridgeEnabled) {
      handDataRef.current = [];
      setHandData([]);
      setBridgeFrameUrl(null);
      setErrorMsg(null);
      return;
    }

    async function pollBridge() {
      while (!cancelled) {
        try {
          const response = await fetch(`${BRIDGE_URL}/state`, {
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(`Bridge responded with ${response.status}`);
          }

          const payload = (await response.json()) as BridgeSnapshot;
          const hands = Array.isArray(payload.hands) ? payload.hands : [];
          const frameTimestamp =
            typeof payload.frameTimestamp === "number" ? payload.frameTimestamp : Date.now();

          if (cancelled) {
            return;
          }

          handDataRef.current = hands;
          setHandData(hands);
          setBridgeFrameUrl(`${BRIDGE_URL}/frame.jpg?t=${frameTimestamp}`);
          setErrorMsg(null);
          await delay(ACTIVE_POLL_MS);
        } catch (err: unknown) {
          if (cancelled) {
            return;
          }

          handDataRef.current = [];
          setHandData([]);
          setBridgeFrameUrl(null);
          const message =
            err instanceof Error ? err.message : "Unknown bridge error";
          setErrorMsg(
            `Python gesture bridge unavailable. Start main.py and keep it running. (${message})`,
          );
          await delay(RETRY_POLL_MS);
        }
      }
    }

    void pollBridge();

    return () => {
      cancelled = true;
    };
  }, [bridgeEnabled]);

  const toggleCamera = useCallback(() => {
    setBridgeEnabled((prev) => !prev);
  }, []);

  return {
    handData,
    cameraActive: bridgeEnabled,
    toggleCamera,
    videoRef,
    overlayCanvasRef,
    handDataRef,
    bridgeFrameUrl,
    errorMsg,
  };
}
