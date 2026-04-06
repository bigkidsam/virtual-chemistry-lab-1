"use client";

import React, { useState, useCallback, useRef } from "react";
import TopBar from "./components/TopBar";
import LeftPanel from "./components/LeftPanel";
import type { Chemical } from "./data/chemicals";
import RightPanel, { type ReactionState } from "./components/RightPanel";
import BottomToolbar, { type Tool } from "./components/BottomToolbar";
import LabSimulation, {
  type LabSimulationHandle,
  type WorldObject,
} from "./components/LabSimulation";
import ToastContainer, { type Toast } from "./components/Toast";
import { useCamera } from "./hooks/useCamera";

let toastCounter = 0;

export default function Home() {
  const [paused, setPaused] = useState(false);
  const [objects, setObjects] = useState<WorldObject[]>([]);
  const labRef = useRef<LabSimulationHandle>(null);
  const {
    handData,
    cameraActive,
    cameraMode,
    toggleCamera,
    videoRef,
    overlayCanvasRef,
    handDataRef,
    bridgeFrameUrl,
    errorMsg,
    statusMsg,
  } = useCamera();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [reaction, setReaction] = useState<ReactionState>({
    equation: "No active reaction",
    status: "idle",
    progress: 0,
    temperature: 25,
    objectCount: 0,
  });

  /* ---- Toasts ---- */
  const addToast = useCallback((icon: string, text: string) => {
    const id = `toast_${++toastCounter}`;
    setToasts((prev) => [...prev.slice(-3), { id, icon, text }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ---- Handlers ---- */
  const handleReset = useCallback(() => {
    labRef.current?.resetObjects();
    setObjects([]);
    setReaction({
      equation: "No active reaction",
      status: "idle",
      progress: 0,
      temperature: 25,
      objectCount: 0,
    });
    addToast("🔄", "Lab reset — all objects cleared");
  }, [addToast]);

  const handleTogglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      addToast(next ? "⏸️" : "▶️", next ? "Simulation paused" : "Simulation resumed");
      return next;
    });
  }, [addToast]);

  const handleSpawnTool = useCallback((tool: Tool) => {
    labRef.current?.spawnObject(tool.id, tool.emoji, tool.name);

    addToast(tool.emoji, `${tool.name} added to lab`);
  }, [addToast]);

  const handleAddChemical = useCallback((chem: Chemical) => {
    const emoji = chem.emoji ?? "💧";
    labRef.current?.spawnObject("dropper", emoji, chem.name, chem);

    addToast(emoji, `${chem.fullName} dropper added`);
  }, [addToast]);

  const handleObjectsChange = useCallback((objs: WorldObject[]) => {
    setObjects(objs);
    setReaction((prev) => ({ ...prev, objectCount: objs.length }));
  }, []);

  const handleReactionUpdate = useCallback(
    (progress: number, temp: number, equation: string, status: "idle" | "reacting" | "complete") => {
      setReaction((prev) => {
        // Only fire toast on status transitions
        if (status === "reacting" && prev.status !== "reacting" && progress < 0.05) {
          addToast("⚗️", "Reaction started!");
        }
        if (status === "complete" && prev.status !== "complete") {
          addToast("✅", "Reaction complete!");
        }
        return {
          ...prev,
          equation,
          status,
          progress,
          temperature: temp,
        };
      });
    },
    [addToast]
  );

  return (
    <div className="lab-shell">
      <TopBar
        paused={paused}
        objectCount={objects.length}
        onReset={handleReset}
        onTogglePause={handleTogglePause}
      />

      <LeftPanel onAddChemical={handleAddChemical} />

      <div style={{ gridArea: "sim", position: "relative", overflow: "hidden", background: cameraActive ? "transparent" : "var(--bg-deep)" }}>
        <LabSimulation
          ref={labRef}
          paused={paused}
          objects={objects}
          onObjectsChange={handleObjectsChange}
          onReactionUpdate={handleReactionUpdate}
          handDataRef={handDataRef}
          handData={handData}
          cameraActive={cameraActive}
          videoRef={videoRef}
          overlayCanvasRef={overlayCanvasRef}
          bridgeFrameUrl={bridgeFrameUrl}
        />

        {/* Camera Error Display */}
        {errorMsg && (
          <div style={{ position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)", zIndex:999, textAlign:"center", padding:"16px", background:"rgba(244,63,94,0.95)", border:"2px solid #fff", borderRadius:"8px", color:"white", maxWidth:"80%", boxShadow:"0 4px 20px rgba(244,63,94,0.5)" }}>
            <strong style={{ fontSize: "16px", display: "block", marginBottom: "8px" }}>⚠️ Camera Error</strong>
            <span style={{ fontSize: "14px", fontFamily: "monospace", wordBreak: "break-all" }}>{errorMsg}</span>
          </div>
        )}

        {/* Empty state hint */}
        {objects.length === 0 && !paused && (
          <div style={{ position:"absolute", bottom:"160px", left:"50%", transform:"translateX(-50%)", zIndex:60, pointerEvents:"none", textAlign:"center" }}>
            <div style={{ background:"rgba(13,18,32,0.92)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:"12px", padding:"14px 22px", maxWidth:"320px" }}>
              <div style={{ fontSize:"28px", marginBottom:"6px" }}>⚗️</div>
              <div style={{ fontSize:"13px", fontWeight:700, color:"var(--text-primary)", marginBottom:"4px" }}>Lab is Ready</div>
              <div style={{ fontSize:"11px", color:"var(--text-muted)", lineHeight:1.7 }}>
                Click tools in the <strong style={{ color:"var(--amber)" }}>bottom toolbar</strong> to spawn equipment<br/>
                or click <strong style={{ color:"var(--amber)" }}>+ Add</strong> in the left panel to pour chemicals<br/>
                <span style={{ color:"var(--teal)" }}>Drag objects</span> to slots · <span style={{ color:"var(--rose)" }}>Double-click burner</span> to light it
              </div>
            </div>
          </div>
        )}

        {/* Paused overlay */}
        {paused && (
          <div className="paused-overlay">
            <div className="paused-card">
              <div className="paused-icon">⏸</div>
              <div className="paused-title">Simulation Paused</div>
              <div className="paused-sub">Press Resume to continue</div>
              <button
                className="btn btn-amber"
                style={{ marginTop: "16px" }}
                onClick={handleTogglePause}
              >
                ▶ Resume
              </button>
            </div>
          </div>
        )}
      </div>

      <RightPanel reaction={reaction} />

      <BottomToolbar onSpawnTool={handleSpawnTool} />

      {/* Floating Global Camera Toggle */}
      <button
        className={`camera-toggle-btn ${cameraActive ? "active" : ""}`}
        onClick={toggleCamera}
        title={cameraActive ? "Turn off camera & gestures" : "Turn on camera & gestures"}
        style={{ position: "absolute", bottom: "124px", left: "280px", zIndex: 9999 }}
      >
        <span className="cam-icon">{cameraActive ? "📷" : "📷"}</span>
        <span className="cam-label">{cameraActive ? statusMsg : "Camera OFF"}</span>
        {cameraActive && handData.length > 0 && (
          <span className="cam-badge">{handData.length} ✋</span>
        )}
        {cameraActive && (
          <span className="cam-mode-badge">{cameraMode === "bridge" ? "PYTHON" : "BROWSER"}</span>
        )}
      </button>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
