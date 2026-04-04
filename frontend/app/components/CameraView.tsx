"use client";

import React from "react";
import type { HandData } from "../hooks/useHandGesture";

interface CameraViewProps {
  cameraActive: boolean;
  toggleCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  handData: HandData[];
}

export default function CameraView({
  cameraActive,
  toggleCamera,
  videoRef,
  overlayCanvasRef,
  handData,
}: CameraViewProps) {
  return (
    <div className="camera-wrapper">
      {/* Toggle button */}
      <button
        className={`camera-toggle-btn ${cameraActive ? "active" : ""}`}
        onClick={toggleCamera}
        title={cameraActive ? "Disable hand gestures" : "Enable hand gestures (camera)"}
      >
        <span className="cam-icon">{cameraActive ? "📷" : "📷"}</span>
        <span className="cam-label">{cameraActive ? "Gestures ON" : "Gestures OFF"}</span>
        {cameraActive && handData.length > 0 && (
          <span className="cam-badge">{handData.length} ✋</span>
        )}
      </button>

      {/* Camera feed + skeleton overlay (Always mounted to attach ref, hidden when off) */}
      <div className="camera-feed-box" style={{ display: cameraActive ? "block" : "none" }}>
        <div className="camera-feed-header">
          <span>🖐 Hand Tracking</span>
          {handData.map((h) => (
            <span
              key={h.label}
              className={`hand-tag ${h.pinching ? "pinching" : ""}`}
            >
              {h.label} {h.pinching ? "✊" : "🖐"}
            </span>
          ))}
        </div>
        <div className="camera-feed-inner">
          {/* Video feed (mirrored) */}
          <video
            ref={videoRef}
            className="camera-video"
            autoPlay
            playsInline
            muted
            style={{ transform: "scaleX(-1)" }}
          />
          {/* Landmark overlay */}
          <canvas
            ref={overlayCanvasRef}
            className="camera-canvas"
          />
        </div>
        <div className="camera-hint">
          Pinch 🤌 to grab · Two-hand pinch for dropper/burner
        </div>
      </div>
    </div>
  );
}
