"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ActiveReport, CompletedReport } from "../engine/reactionEngine";
import { ALL_REACTIONS } from "../data/reactions";

/* ================================================================
   TYPE ALIAS — keeps backwards compatibility with lab/page.tsx
   ================================================================ */
export type ReactionState = ActiveReport;

/* ================================================================
   PROPS
   ================================================================ */
interface RightPanelProps {
  reaction: ActiveReport;
  onCancel?: () => void;
  lastCompleted?: CompletedReport | null;
}

/* ================================================================
   HELPERS
   ================================================================ */
const STATUS_COLORS: Record<string, string> = {
  idle:           "#475569",
  "heat-required":"#f59e0b",
  reacting:       "#f43f5e",
  complete:       "#10b981",
};

const TYPE_COLORS: Record<string, string> = {
  neutralization: "#14b8a6",
  precipitation:  "#8b5cf6",
  synthesis:      "#f59e0b",
  decomposition:  "#f43f5e",
  displacement:   "#3b82f6",
  combustion:     "#ef4444",
  generic:        "#64748b",
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function TempBar({ current, start, peak }: { current: number; start: number; peak: number }) {
  const max = Math.max(peak + 10, 200);
  const pctCurrent = Math.min(100, (current / max) * 100);
  const pctStart   = Math.min(100, (start   / max) * 100);

  const barColor =
    current < 50  ? "#3b82f6" :
    current < 100 ? "#f59e0b" :
    current < 150 ? "#f97316" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{
        position: "relative",
        height: "8px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "4px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* Start temp marker */}
        <div style={{
          position: "absolute",
          left: `${pctStart}%`,
          top: 0, bottom: 0,
          width: "2px",
          background: "rgba(255,255,255,0.3)",
          borderRadius: "1px",
        }} />
        {/* Live temperature bar */}
        <div style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: `${pctCurrent}%`,
          background: `linear-gradient(90deg, #3b82f6, ${barColor})`,
          borderRadius: "4px",
          transition: "width 0.15s ease, background 0.3s ease",
          boxShadow: current > 80 ? `0 0 6px ${barColor}60` : "none",
        }} />
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "9px",
        color: "var(--text-muted)",
        fontFamily: "Space Mono, monospace",
      }}>
        <span style={{ color: "#3b82f6" }}>Start {start}°C</span>
        <span style={{ color: barColor, fontWeight: 700 }}>{current}°C now</span>
        <span style={{ color: current >= peak ? "#ef4444" : "var(--text-muted)" }}>
          Peak {peak}°C
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function RightPanel({ reaction, onCancel, lastCompleted }: RightPanelProps) {
  const progressPct = Math.round(reaction.progress * 100);
  const typeColor   = TYPE_COLORS[reaction.type] ?? "#64748b";
  const statColor   = STATUS_COLORS[reaction.status] ?? "#475569";

  const downloadLabReport = () => {
    if (!lastCompleted) return;
    const userStr = localStorage.getItem("lab_user");
    let userName = "Student";
    let userRole = "Scholar";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userName = u.name;
        userRole = u.role;
      } catch {}
    }

    const reportText = `# Virtual Chemistry Lab - Experiment Report
Date: ${new Date().toLocaleString()}
Student: ${userName} (${userRole})

==================================================
REACTION SUMMARY
==================================================
Equation:      ${lastCompleted.equation}
Reaction Type: ${lastCompleted.type.toUpperCase()}
Duration:      ${(lastCompleted.durationMs / 1000).toFixed(2)} seconds
Peak Temp:     ${lastCompleted.peakTemp}°C

==================================================
PRODUCTS GENERATED
==================================================
${lastCompleted.products.map((p, idx) => `${idx + 1}. [${p.formula}] ${p.name} (${p.emoji})`).join("\n")}

==================================================
OBSERVATIONS & ANALYSIS
==================================================
- The reaction was carried out in a virtual chemistry environment.
- The temperature reached a maximum of ${lastCompleted.peakTemp}°C.
- The reaction took ${(lastCompleted.durationMs / 1000).toFixed(2)}s to run to completion.
- Formed the following compounds: ${lastCompleted.products.map(p => p.name).join(", ")}.

Report generated automatically by Virtual Chemistry Lab-1.
`;

    const blob = new Blob([reportText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `chemistry_lab_report_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render duration directly from parent's animation tick

  /* ----------- Equation display ----------- */
  const [reactantsStr, productsStr] = React.useMemo(() => {
    const parts = reaction.equation.split("→");
    return [parts[0]?.trim() ?? reaction.equation, parts[1]?.trim() ?? ""];
  }, [reaction.equation]);

  return (
    <aside className="right-panel" style={{ display: "flex", flexDirection: "column", gap: 0, overflow: "hidden" }}>

      {/* ===== HEADER ===== */}
      <p className="panel-title" style={{ margin: "0 0 10px 0" }}>◈ Reaction Monitor</p>

      {/* ===== ACTIVE REACTION CARD ===== */}
      <div style={{
        background: reaction.status === "idle"
          ? "rgba(255,255,255,0.02)"
          : `rgba(${reaction.status === "reacting" ? "244,63,94" : reaction.status === "complete" ? "16,185,129" : "245,158,11"},0.05)`,
        border: `1px solid ${statColor}30`,
        borderRadius: "10px",
        padding: "12px",
        marginBottom: "10px",
        transition: "all 0.3s ease",
      }}>
        {/* Status badge + type */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{
            fontSize: "9px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "10px",
            background: `${statColor}20`,
            color: statColor,
            border: `1px solid ${statColor}40`,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            {reaction.status === "heat-required" ? "🔥 Heat Required" :
             reaction.status === "reacting"       ? "⚗️ Reacting"     :
             reaction.status === "complete"       ? "✅ Complete"     : "○ Idle"}
          </span>
          {reaction.type !== "generic" && (
            <span style={{
              fontSize: "8px", fontWeight: 700,
              color: typeColor, textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {reaction.type}
            </span>
          )}
        </div>

        {/* Equation */}
        {reaction.status !== "idle" ? (
          <div style={{ marginBottom: "8px" }}>
            <div style={{
              fontSize: "11px", fontWeight: 700, fontFamily: "Space Mono, monospace",
              color: "#fff", lineHeight: 1.4,
            }}>
              <span style={{ color: "#fde68a" }}>{reactantsStr}</span>
              {productsStr && (
                <>
                  <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>→</span>
                  <span style={{ color: "#86efac" }}>{productsStr}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "8px" }}>
            Add 2 chemicals to a slot to trigger a reaction
          </div>
        )}

        {/* Progress bar */}
        {(reaction.status === "reacting" || reaction.status === "complete") && (
          <div style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text-muted)", marginBottom: "3px" }}>
              <span>Reaction Progress</span>
              <span style={{ color: "var(--amber)", fontFamily: "Space Mono, monospace", fontWeight: 700 }}>
                {progressPct}%
              </span>
            </div>
            <div style={{
              height: "6px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "3px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                height: "100%",
                width: `${progressPct}%`,
                background: progressPct < 100
                  ? `linear-gradient(90deg, #f43f5e, #f59e0b ${progressPct}%, #10b981)`
                  : "linear-gradient(90deg, #10b981, #14b8a6)",
                borderRadius: "3px",
                transition: "width 0.1s linear",
                boxShadow: progressPct > 0 ? "0 0 8px rgba(244,63,94,0.4)" : "none",
              }} />
            </div>
          </div>
        )}

        {/* Temperature gauge */}
        {reaction.status !== "idle" && (
          <TempBar
            current={reaction.temperature}
            start={reaction.startTemp}
            peak={reaction.peakTemp}
          />
        )}

        {/* Duration + Cancel */}
        {(reaction.status === "reacting" || reaction.status === "complete") && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
            <span style={{
              fontSize: "10px", fontFamily: "Space Mono, monospace",
              color: "var(--teal)", letterSpacing: "0.04em",
            }}>
              ⏱ {formatDuration(reaction.durationMs)}
            </span>
            {reaction.status === "reacting" && onCancel && (
              <button
                onClick={onCancel}
                style={{
                  background: "rgba(244,63,94,0.12)",
                  border: "1px solid rgba(244,63,94,0.35)",
                  borderRadius: "6px",
                  color: "#f43f5e",
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(244,63,94,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(244,63,94,0.12)";
                }}
              >
                ✕ Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== PRODUCTS ===== */}
      {reaction.products.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{
            fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px",
          }}>
            Products Generated
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {reaction.products.map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "7px",
                padding: "5px 9px",
              }}>
                <div style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: p.color,
                  border: "1px solid rgba(255,255,255,0.2)",
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${p.color}60`,
                }} />
                <span style={{ fontSize: "10px", fontFamily: "Space Mono, monospace", color: "#a5f3fc", fontWeight: 700 }}>
                  {p.formula}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", flex: 1 }}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== LAST COMPLETED ===== */}
      {lastCompleted && (
        <>
          <div className="divider" style={{ margin: "6px 0" }} />
          <div style={{ marginBottom: "10px" }}>
            <div style={{
              fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px",
            }}>
              Last Completed
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px",
            }}>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--blue)", fontSize: "10px", lineHeight: 1.3 }}>
                  {lastCompleted.equation.split("→")[0]?.trim() ?? "—"}
                </div>
                <div className="stat-label">Reactants</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--emerald)" }}>
                  {formatDuration(lastCompleted.durationMs)}
                </div>
                <div className="stat-label">Duration</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "#f97316" }}>
                  {lastCompleted.peakTemp}°C
                </div>
                <div className="stat-label">Peak Temp</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{
                  color: TYPE_COLORS[lastCompleted.type] ?? "var(--teal)",
                  fontSize: "10px", lineHeight: 1.3, textTransform: "capitalize",
                }}>
                  {lastCompleted.type}
                </div>
                <div className="stat-label">Type</div>
              </div>
            </div>
            <button
              onClick={downloadLabReport}
              style={{
                width: "100%",
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.35)",
                borderRadius: "6px",
                color: "#10b981",
                fontSize: "10px",
                fontWeight: 700,
                padding: "8px",
                cursor: "pointer",
                marginTop: "8px",
                letterSpacing: "0.06em",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(16,185,129,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(16,185,129,0.12)";
              }}
            >
              📥 Download Lab Report
            </button>
          </div>
        </>
      )}

      <div className="divider" style={{ margin: "6px 0" }} />

      {/* ===== REACTION LIBRARY ===== */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="section-header">
          <p className="panel-title" style={{ margin: 0 }}>◉ Reaction Library</p>
          <div className="section-line" />
        </div>

        <div className="reaction-list" style={{ overflowY: "auto", flex: 1 }}>
          {ALL_REACTIONS.map((r) => {
            const tc = TYPE_COLORS[r.type] ?? "#64748b";
            return (
              <div key={r.id} className="reaction-item" id={`rxn-${r.id}`}>
                <div className="reaction-item-dot" style={{ background: tc, boxShadow: `0 0 5px ${tc}60` }} />
                <div style={{ flex: 1 }}>
                  <div className="reaction-item-text">{r.equation}</div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "2px", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "8px", color: tc,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                      {r.type}
                    </span>
                    {r.requiresHeat && (
                      <span style={{ fontSize: "8px", color: "#f59e0b" }}>🔥 heat</span>
                    )}
                    <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>
                      {r.durationSec}s · ΔH {r.deltaH > 0 ? "+" : ""}{r.deltaH} kJ/mol
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
