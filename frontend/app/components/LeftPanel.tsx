"use client";

import React, { useState, useMemo } from "react";
import {
  CHEMICALS,
  CATEGORIES,
  type Chemical,
  type Category,
} from "../data/chemicals";

// Re-export so existing imports from other files still work
export type { Chemical };

interface LeftPanelProps {
  onAddChemical: (chem: Chemical) => void;
}

function getNFPARatings(chem: Chemical) {
  // Default values
  let health = 1;
  let fire = 0;
  let reactivity = 0;
  let special = "";

  const id = chem.id.toLowerCase();
  const category = chem.category;

  if (id === "h2o") {
    return { health: 0, fire: 0, reactivity: 0, special: "" };
  }

  // Acids
  if (category === "Acid") {
    health = 3;
    reactivity = 1;
    if (id === "hf" || id === "hcn") {
      health = 4; // HF & HCN are extremely toxic
    }
    if (id === "h2so4" || id === "hclo4") {
      reactivity = 2; // reacts violently with water
      special = "W";
    }
  }
  // Bases
  else if (category === "Base") {
    health = 3;
    reactivity = 1;
    if (id === "naoh" || id === "koh") {
      reactivity = 1;
    }
  }
  // Organic solvents (flammable)
  else if (category === "Organic") {
    health = 2;
    fire = 3;
    reactivity = 0;
    if (id === "benzene") {
      health = 3; // carcinogen
    }
    if (id === "acetylene") {
      fire = 4;
      reactivity = 2; // unstable gas
    }
  }
  // Reactive metals
  else if (category === "Metal") {
    if (id === "sodium" || id === "potassium" || id === "lithium" || id === "calcium") {
      health = 3;
      fire = 3;
      reactivity = 2;
      special = "W"; // reacts violently with water
    } else {
      health = 1;
      fire = 0;
      reactivity = 0;
    }
  }
  // Gases
  else if (category === "Gas") {
    if (id === "h2") {
      health = 0;
      fire = 4;
      reactivity = 0;
    } else if (id === "o2" || id === "o3") {
      health = 0;
      fire = 0;
      reactivity = 0;
      special = "OX"; // oxidizer
    } else if (id === "cl2" || id === "co" || id === "no2" || id === "h2s") {
      health = 3;
      fire = 0;
      reactivity = 0;
      if (id === "cl2") special = "OX";
    }
  }
  // Oxidizers
  else if (category === "Oxidizer") {
    health = 2;
    fire = 0;
    reactivity = 2;
    special = "OX";
  }

  return { health, fire, reactivity, special };
}

function getHazardStatement(chem: Chemical, health: number, fire: number, reactivity: number, special: string): string {
  if (chem.id === "h2o") return "Stable, non-toxic substance. Essential for life.";
  
  const hazards: string[] = [];
  if (health >= 3) hazards.push("Corrosive/Highly Toxic. Causes severe burns/irritation.");
  if (fire >= 3) hazards.push("Highly Flammable. Keep away from ignition sources.");
  if (reactivity >= 2) hazards.push("Highly Reactive. Avoid shocks, heat, or contact with incompatible materials.");
  if (special === "W") hazards.push("Reacts violently with water releasing dangerous gases.");
  if (special === "OX") hazards.push("Strong oxidizer. May intensify fire/combustion.");

  if (hazards.length === 0) {
    return "Relatively low hazard level under laboratory conditions. Handle with care.";
  }
  return hazards.join(" | ");
}

export default function LeftPanel({ onAddChemical }: LeftPanelProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [spawning, setSpawning] = useState<string | null>(null);
  const [selectedChem, setSelectedChem] = useState<Chemical | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CHEMICALS.filter((c) => {
      const matchesCategory =
        activeCategory === "All" || c.category === activeCategory;
      const matchesSearch =
        q === "" ||
        c.name.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.formula.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const handleAdd = (chem: Chemical) => {
    setSpawning(chem.id);
    onAddChemical(chem);
    setTimeout(() => setSpawning(null), 400);
  };

  const modalNFPA = selectedChem ? getNFPARatings(selectedChem) : null;
  const hazardText = selectedChem && modalNFPA ? getHazardStatement(selectedChem, modalNFPA.health, modalNFPA.fire, modalNFPA.reactivity, modalNFPA.special) : "";

  return (
    <aside className="left-panel">
      <p className="panel-title">⬡ Chemicals</p>

      {/* Search */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          id="chem-search"
          type="text"
          placeholder="Search chemicals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
        />
        {search && (
          <button
            className="search-clear"
            onClick={() => setSearch("")}
            title="Clear search"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category filter tabs */}
      <div className="category-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
            title={`Filter by ${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Result count */}
      <div className="chem-result-count">
        {filtered.length} of {CHEMICALS.length} chemicals
      </div>

      {/* Cards */}
      <div className="chemicals-list">
        {filtered.map((chem) => (
          <div
            key={chem.id}
            className="chem-card"
            style={{ "--chem-color": chem.color, cursor: "pointer" } as React.CSSProperties}
            onClick={() => setSelectedChem(chem)}
          >
            {/* Header */}
            <div className="chem-header">
              <div
                className="chem-swatch"
                style={{ background: chem.color }}
                title={chem.colorName}
              />
              <div>
                <div className="chem-name">{chem.name}</div>
                <div className="chem-fullname">{chem.fullName}</div>
              </div>
            </div>

            {/* Info grid */}
            <div className="chem-info">
              <div className="chem-info-item">
                <span>State</span>
                {chem.state}
              </div>
              <div className="chem-info-item">
                <span>Temp</span>
                {chem.temp}
              </div>
              <div className="chem-info-item">
                <span>Color</span>
                {chem.colorName}
              </div>
              <div className="chem-info-item">
                <span>Formula</span>
                {chem.formula}
              </div>
            </div>

            {/* Category badge + Add button */}
            <div className="chem-footer">
              <span className="chem-category-badge">{chem.category}</span>
              <button
                id={`btn-add-${chem.id}`}
                className={`btn-add ${spawning === chem.id ? "spawning" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd(chem);
                }}
                title={`Add ${chem.fullName} dropper to simulation`}
              >
                + Add
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "12px",
              padding: "24px 0",
            }}
          >
            No chemicals found
          </div>
        )}
      </div>

      {/* Chemical Info Modal */}
      {selectedChem && modalNFPA && (
        <div
          className="chemical-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSelectedChem(null)}
        >
          <div
            className="chemical-modal-content"
            style={{
              backgroundColor: "#0f172a",
              border: "1.5px solid rgba(34, 211, 238, 0.5)",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              padding: "24px",
              position: "relative",
              color: "#f8fafc",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "18px",
                cursor: "pointer",
              }}
              onClick={() => setSelectedChem(null)}
              title="Close modal"
            >
              ✕
            </button>

            {/* Modal Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "28px" }}>{selectedChem.emoji}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#22d3ee" }}>
                  {selectedChem.fullName}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                  Formula: <span style={{ fontFamily: "monospace", color: "#e2e8f0" }}>{selectedChem.formula}</span>
                </p>
              </div>
            </div>

            {/* Content Row */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
              {/* Left Column: NFPA SVG */}
              <div style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ fontWeight: "bold", fontSize: "11px", letterSpacing: "0.05em", color: "#94a3b8", textTransform: "uppercase" }}>
                  NFPA 704 Safety
                </div>
                <svg width="110" height="110" viewBox="0 0 100 100">
                  {/* Left (Blue) - Health */}
                  <polygon points="50,50 25,25 0,50 25,75" fill="#2563eb" stroke="#0f172a" strokeWidth="1.5" />
                  {/* Top (Red) - Flammability */}
                  <polygon points="50,50 25,25 50,0 75,25" fill="#dc2626" stroke="#0f172a" strokeWidth="1.5" />
                  {/* Right (Yellow) - Instability */}
                  <polygon points="50,50 75,25 100,50 75,75" fill="#ca8a04" stroke="#0f172a" strokeWidth="1.5" />
                  {/* Bottom (White) - Special */}
                  <polygon points="50,50 25,75 50,100 75,75" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
                  
                  {/* Text labels */}
                  <text x="25" y="56" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{modalNFPA.health}</text>
                  <text x="50" y="31" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{modalNFPA.fire}</text>
                  <text x="75" y="56" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{modalNFPA.reactivity}</text>
                  {modalNFPA.special && (
                    <text x="50" y="80" fill="#0f172a" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{modalNFPA.special}</text>
                  )}
                </svg>
              </div>

              {/* Right Column: Physical Properties */}
              <div style={{ flex: "2 2 240px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontWeight: "bold", fontSize: "11px", letterSpacing: "0.05em", color: "#94a3b8", textTransform: "uppercase" }}>
                  Physical Properties
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                  <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }}>
                    <div style={{ color: "#64748b", fontSize: "10px" }}>State</div>
                    <div style={{ fontWeight: "600" }}>{selectedChem.state}</div>
                  </div>
                  <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }}>
                    <div style={{ color: "#64748b", fontSize: "10px" }}>Normal Temp</div>
                    <div style={{ fontWeight: "600" }}>{selectedChem.temp}</div>
                  </div>
                  <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }}>
                    <div style={{ color: "#64748b", fontSize: "10px" }}>Appearance</div>
                    <div style={{ fontWeight: "600", color: selectedChem.color }}>{selectedChem.colorName}</div>
                  </div>
                  <div style={{ padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }}>
                    <div style={{ color: "#64748b", fontSize: "10px" }}>Category</div>
                    <div style={{ fontWeight: "600" }}>{selectedChem.category}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Hazard Warning */}
            <div style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "6px",
              padding: "12px",
              fontSize: "12px",
              lineHeight: "1.5",
              color: "#fca5a5",
              marginBottom: "20px"
            }}>
              <span style={{ fontWeight: "bold" }}>⚠️ HAZARD STATEMENTS: </span>
              {hazardText}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.05)",
                  color: "#e2e8f0",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
                onClick={() => setSelectedChem(null)}
              >
                Close
              </button>
              <button
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                  boxShadow: "0 4px 6px -1px rgba(6, 182, 212, 0.3)"
                }}
                onClick={() => {
                  handleAdd(selectedChem);
                  setSelectedChem(null);
                }}
              >
                + Add to Lab
              </button>
            </div>

          </div>
        </div>
      )}
    </aside>
  );
}
