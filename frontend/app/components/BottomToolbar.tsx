"use client";

import React, { useState } from "react";

export interface Tool {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const TOOLS: Tool[] = [
  { id: "flask",     name: "Flask",     emoji: "⚗️",  description: "Conical flask for mixing" },
  { id: "beaker",    name: "Beaker",    emoji: "🧪",  description: "Beaker for holding liquids" },
  { id: "test_tube", name: "Test Tube", emoji: "🧫",  description: "Test tube for small samples" },
  { id: "burner",    name: "Burner",    emoji: "🔥",  description: "Bunsen burner — heat source" },
  { id: "dropper",   name: "Dropper",   emoji: "💧",  description: "Dropper to transfer liquids" },
  { id: "cylinder",  name: "Cylinder",  emoji: "🥛",  description: "Graduated cylinder for precise volume" },
  { id: "petri",     name: "Petri",     emoji: "🫙",  description: "Petri dish for solid cultures" },
  { id: "rod",       name: "Rod",       emoji: "🥢",  description: "Stirring rod" },
  { id: "spatula",   name: "Spatula",   emoji: "🗡️",  description: "Spatula for solids" },
];

interface BottomToolbarProps {
  onSpawnTool: (tool: Tool) => void;
}

export default function BottomToolbar({ onSpawnTool }: BottomToolbarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleClick = (tool: Tool) => {
    setActiveId(tool.id);
    onSpawnTool(tool);
    setTimeout(() => setActiveId(null), 400);
  };

  return (
    <footer className="bottom-toolbar">
      <span className="toolbar-section-label">Tools</span>

      {TOOLS.map((tool) => (
        <div
          key={tool.id}
          id={`tool-${tool.id}`}
          className={`tool-card ${activeId === tool.id ? "spawning" : ""}`}
          onClick={() => handleClick(tool)}
          title={tool.description}
          role="button"
          aria-label={`Spawn ${tool.name}`}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleClick(tool)}
        >
          <span className="tool-card-icon">{tool.emoji}</span>
          <span className="tool-card-name">{tool.name}</span>
        </div>
      ))}
    </footer>
  );
}
