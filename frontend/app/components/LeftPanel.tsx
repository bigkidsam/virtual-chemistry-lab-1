"use client";

import React, { useState } from "react";

export interface Chemical {
  id: string;
  name: string;
  fullName: string;
  colorName: string;
  color: string; // CSS color
  state: "Liquid" | "Solid" | "Gas";
  temp: string;
  formula: string;
}

export const CHEMICALS: Chemical[] = [
  {
    id: "hcl",
    name: "HCl",
    fullName: "Hydrochloric Acid",
    colorName: "Pale Yellow",
    color: "#fde68a",
    state: "Liquid",
    temp: "25°C",
    formula: "HCl",
  },
  {
    id: "naoh",
    name: "NaOH",
    fullName: "Sodium Hydroxide",
    colorName: "White",
    color: "#e2e8f0",
    state: "Solid",
    temp: "20°C",
    formula: "NaOH",
  },
  {
    id: "cuso4",
    name: "CuSO₄",
    fullName: "Copper(II) Sulfate",
    colorName: "Vivid Blue",
    color: "#3b82f6",
    state: "Liquid",
    temp: "25°C",
    formula: "CuSO₄",
  },
  {
    id: "h2so4",
    name: "H₂SO₄",
    fullName: "Sulfuric Acid",
    colorName: "Colorless",
    color: "#94a3b8",
    state: "Liquid",
    temp: "20°C",
    formula: "H₂SO₄",
  },
  {
    id: "kcl",
    name: "KCl",
    fullName: "Potassium Chloride",
    colorName: "White Crystal",
    color: "#f1f5f9",
    state: "Solid",
    temp: "22°C",
    formula: "KCl",
  },
  {
    id: "ethanol",
    name: "C₂H₅OH",
    fullName: "Ethanol",
    colorName: "Colorless",
    color: "#a7f3d0",
    state: "Liquid",
    temp: "18°C",
    formula: "C₂H₅OH",
  },
];

interface LeftPanelProps {
  onAddChemical: (chem: Chemical) => void;
}

export default function LeftPanel({ onAddChemical }: LeftPanelProps) {
  const [search, setSearch] = useState("");
  const [spawning, setSpawning] = useState<string | null>(null);

  const filtered = CHEMICALS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (chem: Chemical) => {
    setSpawning(chem.id);
    onAddChemical(chem);
    setTimeout(() => setSpawning(null), 400);
  };

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
      </div>

      {/* Cards */}
      <div className="chemicals-list">
        {filtered.map((chem) => (
          <div
            key={chem.id}
            className="chem-card"
            style={{ "--chem-color": chem.color } as React.CSSProperties}
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

            {/* Add button */}
            <div className="chem-footer">
              <button
                id={`btn-add-${chem.id}`}
                className={`btn-add ${spawning === chem.id ? "spawning" : ""}`}
                onClick={() => handleAdd(chem)}
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
    </aside>
  );
}
