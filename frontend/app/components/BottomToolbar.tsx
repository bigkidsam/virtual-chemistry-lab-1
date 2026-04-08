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

interface ToolCounts {
  [toolId: string]: number;
}

interface BottomToolbarProps {
  onSpawnTool: (tool: Tool) => void;
  toolCounts: ToolCounts;
  onRemoveTool: (toolId: string) => void;
}

export default function BottomToolbar({ onSpawnTool, toolCounts, onRemoveTool }: BottomToolbarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleClick = (tool: Tool) => {
    setActiveId(tool.id);
    onSpawnTool(tool);
    setTimeout(() => setActiveId(null), 400);
  };

  const handleBadgeClick = (e: React.MouseEvent, toolId: string) => {
    e.stopPropagation(); // prevent spawning a new tool
    onRemoveTool(toolId);
  };

  return (
    <footer className="bottom-toolbar">
      <span className="toolbar-section-label">Tools</span>

      {TOOLS.map((tool) => {
        const count = toolCounts[tool.id] || 0;
        return (
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

            {count > 0 && (
              <span
                className="tool-badge"
                onClick={(e) => handleBadgeClick(e, tool.id)}
                title={`${count} in lab — click to remove one`}
                role="button"
                aria-label={`Remove one ${tool.name}`}
              >
                {count}
              </span>
            )}
          </div>
        );
      })}
    </footer>
  );
}
