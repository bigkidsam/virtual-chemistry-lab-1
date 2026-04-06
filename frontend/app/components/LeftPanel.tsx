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

export default function LeftPanel({ onAddChemical }: LeftPanelProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [spawning, setSpawning] = useState<string | null>(null);

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

            {/* Category badge + Add button */}
            <div className="chem-footer">
              <span className="chem-category-badge">{chem.category}</span>
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
