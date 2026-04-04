"use client";

import React from "react";

interface TopBarProps {
  paused: boolean;
  objectCount: number;
  onReset: () => void;
  onTogglePause: () => void;
}

export default function TopBar({
  paused,
  objectCount,
  onReset,
  onTogglePause,
}: TopBarProps) {
  return (
    <header className="top-bar">
      {/* Logo + Title */}
      <div className="top-bar-logo">
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
