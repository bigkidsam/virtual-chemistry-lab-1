"use client";

import React, { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import { CHEMICALS, CATEGORIES, type Category } from "../data/chemicals";

export default function AboutPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");

  const filteredChemicals = useMemo(() => {
    return CHEMICALS.filter((chem) => {
      const matchesSearch =
        chem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chem.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chem.formula.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory =
        selectedCategory === "All" || chem.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const controlGuides = [
    {
      title: "🖱️ Standard Controls",
      items: [
        "Drag & Drop: Left-click and hold tools (flask, dropper) to move them in the workspace.",
        "Add Chemicals: Click '+ Add' on the chemical list cards in the left panel.",
        "Burner Light: Double-click the Bunsen Burner to light it up or extinguish it.",
        "Slots Locking: Release flasks or burners over circular tabletop slots to snap them in place."
      ]
    },
    {
      title: "📷 Camera Gestures",
      items: [
        "Enable Camera: Click the floating camera toggle button in the bottom left.",
        "Pinch Gesture: Press your index finger and thumb tip together to pinch.",
        "Grab & Move: Pinch near a tool in camera view to grab it, then move your hand.",
        "Pour Liquids: Bring a dropper over a flask and pinch with your second hand to dispense."
      ]
    },
    {
      title: "🫰 Audio Snapping",
      items: [
        "Acoustic Capture: The Python backend captures room acoustics via the microphone.",
        "Single Snap: Snap your fingers once to instantly light the Bunsen Burner.",
        "Double Snap: Snap your fingers twice in rapid succession to extinguish the flame."
      ]
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.02), transparent 40%), var(--bg-void)",
      display: "flex",
      flexDirection: "column",
      color: "var(--text-primary)",
      overflowY: "auto"
    }}>
      <Navbar />

      <main style={{
        maxWidth: "1200px",
        width: "100%",
        margin: "0 auto",
        padding: "36px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "40px"
      }}>
        {/* Lab Guide Header */}
        <section style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 900, marginBottom: "12px", background: "linear-gradient(135deg, #fff, var(--amber))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Virtual Lab Operation Guide
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
            Familiarize yourself with the workspace layout, device control mappings, and interactive chemical database.
          </p>
        </section>

        {/* Operating Rules */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px"
        }}>
          {controlGuides.map((guide, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(13, 18, 32, 0.7)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--amber)", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                {guide.title}
              </h3>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "4px", listStyle: "none" }}>
                {guide.items.map((item, i) => {
                  const [boldText, normalText] = item.split(": ");
                  return (
                    <li key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, display: "flex", gap: "6px", alignItems: "flex-start" }}>
                      <span style={{ color: "var(--teal)" }}>•</span>
                      <span>
                        <strong style={{ color: "var(--text-primary)" }}>{boldText}:</strong> {normalText}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        {/* Chemical Catalog Table */}
        <section style={{
          background: "rgba(13, 18, 32, 0.7)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
                🔬 Interactive Reagent Index
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Explore molecular properties, physical states, and color indicators in our index of {CHEMICALS.length} compounds.
              </p>
            </div>

            {/* Search Input */}
            <div style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-input)",
              border: "1px solid var(--glass-border)",
              borderRadius: "8px",
              padding: "8px 12px",
              width: "280px"
            }}>
              <span style={{ marginRight: "8px", color: "var(--text-muted)", fontSize: "14px" }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by formula or name..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  color: "#fff",
                  width: "100%"
                }}
              />
            </div>
          </div>

          {/* Category Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? "linear-gradient(135deg, var(--amber), var(--amber-dark))" : "rgba(255, 255, 255, 0.04)",
                  border: selectedCategory === cat ? "1px solid var(--amber)" : "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: selectedCategory === cat ? "#000" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div style={{ overflowX: "auto", maxHeight: "400px", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "12px 16px", color: "var(--amber)", fontWeight: 700 }}>Formula</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Full Name</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Category</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>State</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Standard Temp</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Visual Tint</th>
                </tr>
              </thead>
              <tbody>
                {filteredChemicals.length > 0 ? (
                  filteredChemicals.map((chem) => (
                    <tr
                      key={chem.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                        transition: "all 0.15s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)" }}>
                        {chem.emoji} {chem.formula}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{chem.fullName}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.05)",
                          color: "var(--text-secondary)"
                        }}>{chem.category}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          color: chem.state === "Liquid" ? "var(--teal)" : chem.state === "Solid" ? "var(--amber)" : "var(--blue)"
                        }}>{chem.state}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{chem.temp}</td>
                      <td style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: chem.color, border: "1px solid rgba(255,255,255,0.15)" }}></div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{chem.colorName}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                      No chemicals match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
