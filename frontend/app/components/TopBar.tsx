"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface TopBarProps {
  paused: boolean;
  objectCount: number;
  onReset: () => void;
  onTogglePause: () => void;
  glasswareSkin: "classic" | "copper" | "cyber" | "gold";
  onChangeSkin: (skin: "classic" | "copper" | "cyber" | "gold") => void;
}

export default function TopBar({
  paused,
  objectCount,
  onReset,
  onTogglePause,
  glasswareSkin,
  onChangeSkin,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header className="top-bar">
      {/* Logo + Title */}
      <div className="top-bar-logo" style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
        <div className="icon">⚗️</div>
        <span className="top-bar-title">Virtual Chemistry Lab</span>
      </div>

      {/* Center status */}
      <div className="top-bar-center">
        <div className={`status-dot ${paused ? "paused" : ""}`} />
        <span className="status-text">
          {paused ? "Paused" : "Simulation Active"} &nbsp;·&nbsp; {objectCount} object{objectCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Action buttons */}
      <div className="top-bar-actions">
        <select
          id="glassware-skin-select"
          value={glasswareSkin}
          onChange={(e) => onChangeSkin(e.target.value as any)}
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(34, 211, 238, 0.3)",
            borderRadius: "6px",
            color: "#ffffff",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            outline: "none",
            marginRight: "12px"
          }}
          title="Select Glassware Skin"
        >
          <option value="classic">🧪 Classic Borosilicate</option>
          <option value="copper">🏺 Retro Copper</option>
          <option value="cyber">⚡ Cyber-Neon</option>
          <option value="gold">🌟 Rose-Gold</option>
        </select>
        <button
          className="btn btn-ghost"
          onClick={() => router.push("/dashboard")}
          title="Return to the student dashboard"
          style={{ marginRight: "4px" }}
        >
          🚪 Exit Lab
        </button>
        <button
          id="btn-reset"
          className="btn btn-danger"
          onClick={onReset}
          title="Clear all tools from the simulation"
        >
          ↺ Reset
        </button>
        <button
          id="btn-pause"
          className={`btn btn-pause ${paused ? "active" : ""}`}
          onClick={onTogglePause}
          title={paused ? "Resume simulation" : "Pause simulation"}
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>
    </header>
  );
}
