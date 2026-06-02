"use client";

import React, { useState, useCallback, useRef, useMemo, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TopBar from "../components/TopBar";
import LeftPanel from "../components/LeftPanel";
import { CHEMICALS, type Chemical } from "../data/chemicals";
import RightPanel from "../components/RightPanel";
import BottomToolbar, { type Tool } from "../components/BottomToolbar";
import LabSimulation, {
  type LabSimulationHandle,
  type WorldObject,
} from "../components/LabSimulation";
import ToastContainer, { type Toast } from "../components/Toast";
import { useCamera } from "../hooks/useCamera";
import type { ActiveReport, CompletedReport } from "../engine/reactionEngine";

let toastCounter = 0;

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

function LabSimulationPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const experiment = searchParams.get("experiment");

  const [paused, setPaused] = useState(false);
  const [objects, setObjects] = useState<WorldObject[]>([]);
  const labRef = useRef<LabSimulationHandle>(null);
  const [glasswareSkin, setGlasswareSkin] = useState<"classic" | "copper" | "cyber" | "gold">("classic");
  
  // Checklist State
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const checklistRef = useRef<ChecklistItem[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [expCompleted, setExpCompleted] = useState(false);

  // Keep ref in sync with state (no re-render cost)
  useEffect(() => {
    checklistRef.current = checklist;
  }, [checklist]);

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
  const [reaction, setReaction] = useState<ActiveReport>({
    equation:    "No active reaction",
    type:        "generic",
    status:      "idle",
    progress:    0,
    temperature: 25,
    startTemp:   25,
    peakTemp:    25,
    durationMs:  0,
    products:    [],
    reactantIds: [],
    objectCount: 0,
    slotIndex:   -1,
  });
  const [lastCompleted, setLastCompleted] = useState<CompletedReport | null>(null);

  /* ---- Toasts ---- */
  const addToast = useCallback((icon: string, text: string) => {
    const id = `toast_${++toastCounter}`;
    setToasts((prev) => [...prev.slice(-3), { id, icon, text }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ---- Preset Experiment Loader ---- */
  React.useEffect(() => {
    if (!labRef.current) return;
    
    const timer = setTimeout(() => {
      // Clear any starting objects
      labRef.current?.resetObjects();
      setExpCompleted(false);

      if (experiment === "neutralization") {
        addToast("🧪", "Acid-Base Neutralization Lab Loaded!");
        labRef.current?.spawnObject("flask", "🧪", "Flask");
        
        const hclChem = { id: "hcl", name: "HCl", fullName: "Hydrochloric Acid", colorName: "Pale Yellow", color: "#fde68a", state: "Liquid" as const, temp: "25°C", formula: "HCl", category: "Acid", emoji: "💛" };
        const naohChem = { id: "naoh", name: "NaOH", fullName: "Sodium Hydroxide (Caustic Soda)", colorName: "White", color: "#e2e8f0", state: "Solid" as const, temp: "20°C", formula: "NaOH", category: "Base", emoji: "🤍" };
        
        labRef.current?.spawnObject("dropper", "💛", "HCl", hclChem);
        labRef.current?.spawnObject("dropper", "🤍", "NaOH", naohChem);

        setChecklist([
          { id: "spawn_flask", text: "Spawn a Flask to hold chemicals", done: false },
          { id: "add_chemicals", text: "Combine HCl and NaOH inside a slot", done: false },
          { id: "react", text: "Observe neutralization reaction (pH 7)", done: false }
        ]);
        setShowChecklist(true);

      } else if (experiment === "water") {
        addToast("💨", "Water Synthesis Lab Loaded!");
        labRef.current?.spawnObject("burner", "🔥", "Bunsen Burner");
        labRef.current?.spawnObject("flask", "🧪", "Flask");
        
        const h2Chem = { id: "h2", name: "H₂", fullName: "Hydrogen Gas", colorName: "Colorless", color: "#e0f2fe", state: "Gas" as const, temp: "25°C", formula: "H₂", category: "Gas", emoji: "💨" };
        const o2Chem = { id: "o2", name: "O₂", fullName: "Oxygen Gas", colorName: "Colorless", color: "#bfdbfe", state: "Gas" as const, temp: "25°C", formula: "O₂", category: "Gas", emoji: "💨" };
        
        labRef.current?.spawnObject("dropper", "💨", "Hydrogen", h2Chem);
        labRef.current?.spawnObject("dropper", "💨", "Oxygen", o2Chem);

        setChecklist([
          { id: "spawn_flask", text: "Spawn a reaction Flask", done: false },
          { id: "add_gases", text: "Add H₂ and O₂ droppers to the slot", done: false },
          { id: "light_burner", text: "Double-click burner to light the flame", done: false },
          { id: "heat_slot", text: "Heat the slot with lit burner (> 50°C)", done: false },
          { id: "react", text: "Heat to complete synthesis of H₂O", done: false }
        ]);
        setShowChecklist(true);

      } else if (experiment === "precipitation") {
        addToast("⚖️", "Precipitation Reaction Lab Loaded!");
        labRef.current?.spawnObject("flask", "🧪", "Flask");
        
        const agno3 = { id: "agno3", name: "AgNO₃", fullName: "Silver Nitrate", colorName: "Colorless", color: "#e2e8f0", state: "Solid" as const, temp: "22°C", formula: "AgNO₃", category: "Salt", emoji: "🩶" };
        const nacl = { id: "nacl", name: "NaCl", fullName: "Sodium Chloride (Table Salt)", colorName: "White Crystal", color: "#f1f5f9", state: "Solid" as const, temp: "25°C", formula: "NaCl", category: "Salt", emoji: "🧂" };
        
        labRef.current?.spawnObject("dropper", "🩶", "Silver Nitrate", agno3);
        labRef.current?.spawnObject("dropper", "🧂", "Sodium Chloride", nacl);

        setChecklist([
          { id: "spawn_flask", text: "Spawn a Flask to observe reaction", done: false },
          { id: "add_chemicals", text: "Add AgNO₃ and NaCl to the slot", done: false },
          { id: "react", text: "Observe white AgCl precipitate forming", done: false }
        ]);
        setShowChecklist(true);

      } else {
        addToast("👋", "Welcome to Sandbox Chemistry Lab!");
        setChecklist([]);
        setShowChecklist(false);

        const spawnParam = searchParams.get("spawn");
        if (spawnParam) {
          const found = CHEMICALS.find(
            (c) => c.id === spawnParam || c.name.toLowerCase() === spawnParam.toLowerCase()
          );
          if (found) {
            setTimeout(() => {
              labRef.current?.spawnObject("flask", "🧪", "Flask");
              labRef.current?.spawnObject("dropper", found.emoji, found.name, found);
            }, 300);
          }
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [experiment, addToast]);

  /* ---- Interactive Checklist Validation ---- */
  // IMPORTANT: Do NOT add `checklist` to the dependency array — it causes an infinite
  // update loop (checklist changes → effect runs → setChecklist → checklist changes → …).
  // We read the latest checklist via `checklistRef` instead.
  useEffect(() => {
    if (!experiment || checklistRef.current.length === 0) return;

    let changed = false;
    const nextChecklist = checklistRef.current.map((item) => {
      let isDone = item.done;

      // Shared item checks
      if (item.id === "spawn_flask") {
        isDone = objects.some((o) => o.type === "flask");
      }

      // Experiment-specific checks
      if (experiment === "neutralization") {
        if (item.id === "add_chemicals") {
          isDone = reaction.status === "reacting" || reaction.status === "complete";
        }
        if (item.id === "react") {
          isDone = reaction.status === "complete" && reaction.equation.includes("NaCl");
        }
      }

      if (experiment === "water") {
        if (item.id === "add_gases") {
          isDone = reaction.status === "reacting" || reaction.status === "complete" ||
                   (objects.some(o => o.label === "Hydrogen") && objects.some(o => o.label === "Oxygen"));
        }
        if (item.id === "light_burner") {
          isDone = objects.some((o) => o.type === "burner" && o.flameOn);
        }
        if (item.id === "heat_slot") {
          isDone = reaction.temperature > 50;
        }
        if (item.id === "react") {
          isDone = reaction.status === "complete" && reaction.equation.includes("H₂O");
        }
      }

      if (experiment === "precipitation") {
        if (item.id === "add_chemicals") {
          isDone = reaction.status === "reacting" || reaction.status === "complete";
        }
        if (item.id === "react") {
          isDone = reaction.status === "complete" && reaction.equation.includes("AgCl");
        }
      }

      if (isDone !== item.done) {
        changed = true;
      }
      return { ...item, done: isDone };
    });

    if (changed) {
      setChecklist(nextChecklist);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects, reaction, experiment]);

  /* ---- Award Achievements & EXP ---- */
  const allTasksDone = useMemo(() => {
    if (!experiment || checklist.length === 0) return false;
    return checklist.every((item) => item.done);
  }, [checklist, experiment]);

  React.useEffect(() => {
    if (allTasksDone && !expCompleted) {
      setExpCompleted(true);
      addToast("🎉", "All steps completed! Experience gained!");

      // Update user localStorage profile
      const storedUser = localStorage.getItem("lab_user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          
          let achKey = "";
          let badgeName = "";
          if (experiment === "neutralization") { achKey = "neutralization"; badgeName = "Neutralization Sage ⚖️"; }
          else if (experiment === "water") { achKey = "water"; badgeName = "Water Architect 💧"; }
          else if (experiment === "precipitation") { achKey = "precipitation"; badgeName = "Precipitation Guru ⚪"; }

          // Get existing achievements
          let unlocked: string[] = [];
          const storedAch = localStorage.getItem("lab_achievements");
          if (storedAch) {
            unlocked = JSON.parse(storedAch);
          }

          if (achKey && !unlocked.includes(achKey)) {
            unlocked.push(achKey);
            localStorage.setItem("lab_achievements", JSON.stringify(unlocked));
            
            // Gain EXP
            user.exp = Math.min(500, user.exp + 100);
            localStorage.setItem("lab_user", JSON.stringify(user));
            addToast("🏆", `Unlocked Badge: ${badgeName}!`);
            addToast("⭐", `Awarded +100 EXP!`);
          }
        } catch {
          // Ignore
        }
      }
    }
  }, [allTasksDone, expCompleted, experiment, addToast]);

  /* ---- Handlers ---- */
  const handleReset = useCallback(() => {
    labRef.current?.resetObjects();
    setObjects([]);
    setReaction({
      equation:    "No active reaction",
      type:        "generic",
      status:      "idle",
      progress:    0,
      temperature: 25,
      startTemp:   25,
      peakTemp:    25,
      durationMs:  0,
      products:    [],
      reactantIds: [],
      objectCount: 0,
      slotIndex:   -1,
    });
    addToast("🔄", "Lab reset — all objects cleared");
    setExpCompleted(false);

    // Re-initialize checklist items done state to false
    if (checklist.length > 0) {
      setChecklist((prev) => prev.map((item) => ({ ...item, done: false })));
    }
  }, [addToast, checklist.length]);

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

  /* ---- Tool counts for badges ---- */
  const toolCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const obj of objects) {
      counts[obj.type] = (counts[obj.type] || 0) + 1;
    }
    return counts;
  }, [objects]);

  const handleRemoveTool = useCallback((toolId: string) => {
    labRef.current?.removeObjectByType(toolId);
    addToast("🗑️", `Removed a ${toolId} from lab`);
  }, [addToast]);

  const handleReactionUpdate = useCallback(
    (report: ActiveReport) => {
      setReaction((prev) => {
        if (report.status === "reacting" && prev.status !== "reacting") {
          addToast("⚗️", "Reaction started!");
        }
        if (report.status === "complete" && prev.status !== "complete") {
          const productNames = report.products.map((p) => p.formula).join(" + ");
          addToast("✅", `Complete! ${productNames} formed`);
        }
        return report;
      });
    },
    [addToast]
  );

  const handleReactionComplete = useCallback(
    (report: CompletedReport) => {
      setLastCompleted(report);
    },
    []
  );

  const handleCancelReaction = useCallback(() => {
    labRef.current?.cancelReaction();
    addToast("🛑", "Reaction cancelled");
    setReaction((prev) => ({
      ...prev,
      status:   "idle",
      progress: 0,
      equation: "No active reaction",
      products: [],
    }));
  }, [addToast]);

  return (
    <div className="lab-shell">
      <TopBar
        paused={paused}
        objectCount={objects.length}
        onReset={handleReset}
        onTogglePause={handleTogglePause}
        glasswareSkin={glasswareSkin}
        onChangeSkin={setGlasswareSkin}
      />

      <LeftPanel onAddChemical={handleAddChemical} />

      <div style={{ gridArea: "sim", position: "relative", overflow: "hidden", background: cameraActive ? "transparent" : "var(--bg-deep)" }}>
        <LabSimulation
          ref={labRef}
          paused={paused}
          objects={objects}
          onObjectsChange={handleObjectsChange}
          onReactionUpdate={handleReactionUpdate}
          onReactionComplete={handleReactionComplete}
          handDataRef={handDataRef}
          handData={handData}
          cameraActive={cameraActive}
          videoRef={videoRef}
          overlayCanvasRef={overlayCanvasRef}
          bridgeFrameUrl={bridgeFrameUrl}
          glasswareSkin={glasswareSkin}
          addToast={addToast}
        />

        {/* Floating Checklist Overlay */}
        {showChecklist && experiment && (
          <div style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            zIndex: 99,
            background: "rgba(13, 18, 32, 0.95)",
            border: "1px solid var(--border-amber)",
            borderRadius: "10px",
            padding: "16px",
            width: "290px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6), 0 0 12px var(--amber-glow)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                📋 Experiment Checklist
              </span>
              <button 
                onClick={() => setShowChecklist(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}
              >
                ✕ Hide
              </button>
            </div>
            <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
              {experiment === "neutralization" ? "Acid-Base Neutralization" : experiment === "water" ? "Water Synthesis" : "Precipitation Reactions"}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              {checklist.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", opacity: item.done ? 0.6 : 1 }}>
                  <span style={{ 
                    color: item.done ? "var(--teal)" : "var(--text-muted)", 
                    fontSize: "14px",
                    fontWeight: "bold"
                  }}>
                    {item.done ? "✓" : "○"}
                  </span>
                  <span style={{ 
                    textDecoration: item.done ? "line-through" : "none", 
                    color: item.done ? "var(--text-secondary)" : "var(--text-primary)",
                    lineHeight: 1.4
                  }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {expCompleted && (
              <div style={{ 
                marginTop: "12px", 
                background: "rgba(20, 184, 166, 0.1)", 
                border: "1px solid var(--teal)", 
                borderRadius: "6px", 
                padding: "10px", 
                textAlign: "center",
                animation: "reactionPulse 1s infinite alternate" 
              }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--teal)", display: "block" }}>
                  🎉 Experiment Complete!
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
                  Earned +100 EXP & Badge unlocked.
                </span>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="btn btn-amber"
                  style={{ width: "100%", padding: "8px", fontSize: "12px", marginTop: "10px", fontWeight: 700 }}
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* Minimized Checklist Trigger */}
        {!showChecklist && experiment && (
          <button
            onClick={() => setShowChecklist(true)}
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              zIndex: 99,
              background: "rgba(13, 18, 32, 0.9)",
              border: "1px solid var(--border-amber)",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--amber)",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)"
            }}
          >
            📋 Show Checklist {expCompleted && "✨"}
          </button>
        )}

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

      <RightPanel reaction={reaction} onCancel={handleCancelReaction} lastCompleted={lastCompleted} />

      <BottomToolbar onSpawnTool={handleSpawnTool} toolCounts={toolCounts} onRemoveTool={handleRemoveTool} />

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

export default function LabPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "#050810", color: "#f59e0b" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px", letterSpacing: "0.1em" }}>⚗️ INITIALIZING VIRTUAL LAB...</h2>
        <div className="status-dot" style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 15px #f59e0b" }}></div>
      </div>
    }>
      <LabSimulationPageInner />
    </Suspense>
  );
}
