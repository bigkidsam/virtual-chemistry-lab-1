"use client";

import React from "react";

export interface ReactionState {
  equation: string;
  status: "idle" | "reacting" | "complete";
  progress: number; // 0–1
  temperature: number; // °C
  objectCount: number;
}

interface RightPanelProps {
  reaction: ReactionState;
}

const REACTION_LIST = [
  {
    id: "acid_base",
    text: "HCl + NaOH → NaCl + H₂O",
    type: "Neutralization",
    color: "#f59e0b",
  },
  {
    id: "heating",
    text: "Heat + Liquid → Evaporation",
    type: "Phase Change",
    color: "#3b82f6",
  },
  {
    id: "combustion",
    text: "Fuel + O₂ → CO₂ + H₂O + Heat",
    type: "Combustion",
    color: "#f43f5e",
  },
  {
    id: "copper",
    text: "CuSO₄ + 2NaOH → Cu(OH)₂ + Na₂SO₄",
    type: "Precipitation",
    color: "#8b5cf6",
  },
];

const statusColors: Record<string, string> = {
  idle: "#475569",
  reacting: "#f43f5e",
  complete: "#10b981",
};

export default function RightPanel({ reaction }: RightPanelProps) {
  const progressPct = Math.round(reaction.progress * 100);

  return (
    <aside className="right-panel">
      <p className="panel-title">◈ Reaction Monitor</p>

      {/* Active reaction badge */}
      <div className="reaction-badge">
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              marginBottom: "4px",
            }}
          >
            Active Reaction
          </div>
          <div className="reaction-equation">{reaction.equation}</div>
          <div className="reaction-status">
            <span
              className={`status-badge ${reaction.status}`}
              style={{ borderColor: statusColors[reaction.status] + "50" }}
            >
              {reaction.status.charAt(0).toUpperCase() + reaction.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-section">
        <div className="progress-label">
          <span>Reaction Progress</span>
          <span style={{ color: "var(--amber)", fontFamily: "Space Mono, monospace" }}>
            {progressPct}%
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Temperature */}
      <div className="temp-display">
        <div>
          <div className="temp-label">Temperature</div>
          <div className="temp-value">{reaction.temperature}°C</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="temp-label">Objects</div>
          <div
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--teal)",
              textShadow: "0 0 10px rgba(20,184,166,0.4)",
            }}
          >
            {reaction.objectCount}
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--blue)", fontSize: "13px" }}>
            CuSO₄ + NaOH
          </div>
          <div className="stat-label">Last Reaction</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--emerald)", fontSize: "13px" }}>
            3.5s
          </div>
          <div className="stat-label">Duration</div>
        </div>
      </div>

      <div className="divider" />

      {/* Section header */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="section-header">
          <p className="panel-title" style={{ margin: 0 }}>◉ Reaction Library</p>
          <div className="section-line" />
        </div>

        <div className="reaction-list" style={{ overflowY: 'auto', flex: 1 }}>
          {REACTION_LIST.map((r) => (
            <div key={r.id} className="reaction-item" id={`reaction-${r.id}`}>
              <div
                className="reaction-item-dot"
                style={{
                  background: r.color,
                  boxShadow: `0 0 5px ${r.color}60`,
                }}
              />
              <div style={{ flex: 1 }}>
                <div className="reaction-item-text">{r.text}</div>
                <div
                  style={{
                    fontSize: "9px",
                    color: r.color,
                    marginTop: "2px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {r.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
