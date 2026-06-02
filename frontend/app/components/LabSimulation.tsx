"use client";

import React, {
  forwardRef,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle
} from "react";
import type { Chemical } from "./LeftPanel";
import type { HandData } from "../hooks/useHandGesture";
import { tickEngine, makeSlotState, calculatePH } from "../engine/reactionEngine";
import type { SlotState, ActiveReport } from "../engine/reactionEngine";
import { ALL_REACTIONS, REACTION_REGISTRY } from "../data/reactions";
import { synth } from "../audio/audioSynth";

/* =========================================================
   TYPES
   ========================================================= */
export interface WorldObject {
  id: string;
  type: string;
  emoji: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVel: number;
  grabbed: boolean;
  flameOn?: boolean;
  chemical?: Chemical;
  
  // Chemistry state properties for container objects
  chemicals?: Chemical[];
  reactionProgress?: number;
  reacting?: boolean;
  reactionId?: string | null;
  liquidColor?: string | null;
  liquidLevel?: number;
  temperature?: number;
  startTime?: number | null;
  startTemp?: number;
  peakTemp?: number;
  cancelled?: boolean;
  
  color?: string;
  measuredPH?: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  type: "droplet" | "smoke" | "bubble" | "steam" | "spark" | "fire" | "precipitate" | "ring";
  color: string;
  size: number;
  slotIndex?: number;
  containerId?: string;
}

// SlotState is now imported from reactionEngine — it replaces the local Slot type.

interface LabSimulationProps {
  paused: boolean;
  objects: WorldObject[];
  onObjectsChange: (objs: WorldObject[]) => void;
  /** Called every frame with the latest reaction report */
  onReactionUpdate: (report: ActiveReport) => void;
  /** Optional: called when a reaction is fully completed */
  onReactionComplete?: (report: import("../engine/reactionEngine").CompletedReport) => void;
  handDataRef?: React.RefObject<HandData[]>;
  handData: HandData[];
  cameraActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  bridgeFrameUrl?: string | null;
  glasswareSkin?: "classic" | "copper" | "cyber" | "gold";
  addToast?: (icon: string, text: string) => void;
}

export interface LabSimulationHandle {
  spawnObject: (type: string, emoji: string, label: string, chemical?: Chemical) => void;
  resetObjects: () => void;
  removeObjectByType: (type: string) => void;
  /** Abort all currently-reacting slots and clear their chemicals */
  cancelReaction: () => void;
}

/* =========================================================
   CONSTANTS
   ========================================================= */
const GRAVITY = 600;
const DAMPING = 0.65;
const ANGULAR_DAMPING = 0.85;
const SLOT_COUNT = 3;
const SLOT_W = 90;
const SLOT_H = 60;
const SLOT_GAP = 20;
const OBJECT_SIZE = 72;
const FLOOR_PAD = 140;

// Reaction equations are now handled by app/data/reactions.ts + app/engine/reactionEngine.ts


function blendColors(c1: string, c2: string, ratio: number): string {
  const parseHex = (c: string) => {
    const raw = c.replace("#", "");
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16)
    };
  };
  try {
    const rgb1 = parseHex(c1);
    const rgb2 = parseHex(c2);
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch {
    return c1;
  }
}

function drawSlotLiquid(ctx: CanvasRenderingContext2D, slot: SlotState, time: number) {
  if (!slot.liquidColor || slot.liquidLevel <= 0) return;

  const lH = slot.liquidLevel * (SLOT_H - 4);
  const lY = slot.y + SLOT_H - lH - 2;
  const x = slot.x + 2;
  const w = SLOT_W - 4;
  const y = lY;

  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, x, y, w, lH, 4);
  ctx.clip();

  // Realistic liquid gradient
  const grad = ctx.createLinearGradient(x, y, x, y + lH);
  grad.addColorStop(0, slot.liquidColor + "cc");
  grad.addColorStop(0.7, slot.liquidColor + "ee");
  grad.addColorStop(1, slot.liquidColor + "ff");
  ctx.fillStyle = grad;
  ctx.fill();

  // Meniscus
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y, w / 2, Math.min(3, lH / 2), 0, 0, Math.PI, true);
  ctx.fillStyle = slot.liquidColor + "aa";
  ctx.fill();

  // Meniscus line
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y, w / 2, Math.min(3, lH / 2), 0, 0, Math.PI, true);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Glass/liquid reflection highlight
  const shineGrad = ctx.createLinearGradient(x, y, x + w, y);
  shineGrad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
  shineGrad.addColorStop(0.18, "rgba(255, 255, 255, 0.28)");
  shineGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.0)");
  shineGrad.addColorStop(0.85, "rgba(255, 255, 255, 0.0)");
  shineGrad.addColorStop(0.96, "rgba(255, 255, 255, 0.08)");
  shineGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = shineGrad;
  ctx.fillRect(x, y, w, lH);

  ctx.restore();
}

function drawHeatShimmer(ctx: CanvasRenderingContext2D, centerX: number, topY: number, width: number, temp: number, time: number) {
  if (temp <= 40) return;
  const intensity = Math.min(1, (temp - 40) / 150);
  const height = 30 + intensity * 50;

  ctx.save();
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";

  const waveCount = width < 20 ? 2 : width < 35 ? 3 : 4;
  const spacing = width / (waveCount + 1);
  const startLeft = centerX - width / 2;

  for (let i = 0; i < waveCount; i++) {
    const startX = startLeft + spacing * (i + 1);
    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.02 * intensity + 0.015 * Math.sin(time * 0.005 + i))})`;
    ctx.beginPath();
    for (let y = 0; y < height; y += 4) {
      const currentY = topY - y;
      const waveX = startX + Math.sin(time * 0.006 - y * 0.06 + i * 2.3) * (1.5 * intensity + 0.5);
      if (y === 0) {
        ctx.moveTo(waveX, currentY);
      } else {
        ctx.lineTo(waveX, currentY);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

let objIdCounter = 0; let particleIdCounter = 0;
const genId = () => `obj_${++objIdCounter}`;
const genParticleId = () => `p_${++particleIdCounter}`;

function getGlassStyles(skin: string, alpha: number, ctx: CanvasRenderingContext2D, hs: number) {
  const glassGrad = ctx.createLinearGradient(-hs, -hs, hs, hs);
  let strokeStyle = "rgba(150,210,255,0.6)";

  if (skin === "copper") {
    glassGrad.addColorStop(0, `rgba(224, 130, 94, ${alpha * 0.8})`);
    glassGrad.addColorStop(0.5, `rgba(180, 90, 60, ${alpha * 0.7})`);
    glassGrad.addColorStop(1, `rgba(150, 75, 45, ${alpha * 0.95})`);
    strokeStyle = "rgba(251, 146, 60, 0.75)";
  } else if (skin === "cyber") {
    glassGrad.addColorStop(0, `rgba(6, 182, 212, ${alpha * 0.7})`);
    glassGrad.addColorStop(0.5, `rgba(139, 92, 246, ${alpha * 0.6})`);
    glassGrad.addColorStop(1, `rgba(168, 85, 247, ${alpha * 0.8})`);
    strokeStyle = "rgba(34, 211, 238, 0.9)";
  } else if (skin === "gold") {
    glassGrad.addColorStop(0, `rgba(251, 191, 36, ${alpha * 0.7})`);
    glassGrad.addColorStop(0.5, `rgba(244, 63, 94, ${alpha * 0.6})`);
    glassGrad.addColorStop(1, `rgba(251, 113, 133, ${alpha * 0.8})`);
    strokeStyle = "rgba(253, 224, 71, 0.95)";
  } else {
    // classic
    glassGrad.addColorStop(0, `rgba(180,220,255,${alpha})`);
    glassGrad.addColorStop(0.5, `rgba(200,235,255,${alpha * 0.7})`);
    glassGrad.addColorStop(1, `rgba(160,200,240,${alpha * 0.9})`);
    strokeStyle = "rgba(150,210,255,0.6)";
  }

  return { fill: glassGrad, stroke: strokeStyle };
}

/* =========================================================
   DRAW TOOL SHAPES (realistic vector art)
   ========================================================= */
function drawToolShape(ctx: CanvasRenderingContext2D, obj: WorldObject, S: number, time: number, isCameraActive: boolean, skin: string = "classic") {
  const hs = S * 0.45; // half-size

  switch (obj.type) {
    case "flask": {
      const alpha = isCameraActive ? 0.7 : 0.5;
      const styles = getGlassStyles(skin, alpha, ctx, hs);

      ctx.beginPath();
      ctx.moveTo(-hs * 0.25, -hs);       // neck left
      ctx.lineTo(-hs * 0.25, -hs * 0.3); // neck bottom left
      ctx.lineTo(-hs * 0.9, hs * 0.7);   // body bottom left
      ctx.quadraticCurveTo(-hs * 0.9, hs, -hs * 0.5, hs);
      ctx.lineTo(hs * 0.5, hs);
      ctx.quadraticCurveTo(hs * 0.9, hs, hs * 0.9, hs * 0.7);
      ctx.lineTo(hs * 0.25, -hs * 0.3);
      ctx.lineTo(hs * 0.25, -hs);
      ctx.closePath();
      ctx.fillStyle = styles.fill;
      ctx.fill();
      ctx.strokeStyle = styles.stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Flask rim
      ctx.beginPath();
      ctx.ellipse(0, -hs, hs * 0.3, hs * 0.08, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180,220,255,0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Liquid if container has fluid
      if (obj.liquidLevel && obj.liquidLevel > 0 && obj.liquidColor) {
        const lh = hs * 1.35 * obj.liquidLevel;
        const ly = hs - lh;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-hs * 0.25, -hs);
        ctx.lineTo(-hs * 0.25, -hs * 0.3);
        ctx.lineTo(-hs * 0.9, hs * 0.7);
        ctx.quadraticCurveTo(-hs * 0.9, hs, -hs * 0.5, hs);
        ctx.lineTo(hs * 0.5, hs);
        ctx.quadraticCurveTo(hs * 0.9, hs, hs * 0.9, hs * 0.7);
        ctx.lineTo(hs * 0.25, -hs * 0.3);
        ctx.lineTo(hs * 0.25, -hs);
        ctx.closePath();
        ctx.clip();

        const grad = ctx.createLinearGradient(0, ly, 0, hs);
        grad.addColorStop(0, obj.liquidColor + "cc");
        grad.addColorStop(0.7, obj.liquidColor + "ee");
        grad.addColorStop(1, obj.liquidColor + "ff");
        ctx.fillStyle = grad;
        ctx.fillRect(-hs, ly, S, lh + hs * 0.1);

        ctx.beginPath();
        ctx.ellipse(0, ly, hs * 0.6 * (obj.liquidLevel * 0.5 + 0.5), hs * 0.05, 0, 0, Math.PI * 2);
        ctx.fillStyle = obj.liquidColor + "bb";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      }

      // Glass shine
      ctx.beginPath();
      ctx.moveTo(-hs * 0.15, -hs * 0.8);
      ctx.lineTo(-hs * 0.6, hs * 0.4);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case "beaker": {
      const alpha = isCameraActive ? 0.7 : 0.5;
      const styles = getGlassStyles(skin, alpha, ctx, hs);

      ctx.beginPath();
      ctx.moveTo(-hs * 0.7, -hs);
      ctx.lineTo(-hs * 0.8, hs * 0.85);
      ctx.quadraticCurveTo(-hs * 0.8, hs, -hs * 0.6, hs);
      ctx.lineTo(hs * 0.6, hs);
      ctx.quadraticCurveTo(hs * 0.8, hs, hs * 0.8, hs * 0.85);
      ctx.lineTo(hs * 0.7, -hs);
      // Pour spout
      ctx.lineTo(hs * 0.9, -hs * 1.1);
      ctx.lineTo(hs * 0.7, -hs);
      ctx.closePath();
      ctx.fillStyle = styles.fill;
      ctx.fill();
      ctx.strokeStyle = styles.stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Measurement lines
      for (let i = 1; i <= 3; i++) {
        const ly = hs - (i / 4) * (hs * 1.8);
        ctx.beginPath();
        ctx.moveTo(-hs * 0.55, ly);
        ctx.lineTo(-hs * 0.3, ly);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Liquid
      if (obj.liquidLevel && obj.liquidLevel > 0 && obj.liquidColor) {
        const lh = hs * 1.5 * obj.liquidLevel;
        const ly = hs - lh;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-hs * 0.7, -hs);
        ctx.lineTo(-hs * 0.8, hs * 0.85);
        ctx.quadraticCurveTo(-hs * 0.8, hs, -hs * 0.6, hs);
        ctx.lineTo(hs * 0.6, hs);
        ctx.quadraticCurveTo(hs * 0.8, hs, hs * 0.8, hs * 0.85);
        ctx.lineTo(hs * 0.7, -hs);
        ctx.closePath();
        ctx.clip();

        const grad = ctx.createLinearGradient(0, ly, 0, hs);
        grad.addColorStop(0, obj.liquidColor + "cc");
        grad.addColorStop(0.7, obj.liquidColor + "ee");
        grad.addColorStop(1, obj.liquidColor + "ff");
        ctx.fillStyle = grad;
        ctx.fillRect(-hs, ly, S, lh + hs * 0.1);

        ctx.beginPath();
        ctx.ellipse(0, ly, hs * 0.72, hs * 0.05, 0, 0, Math.PI * 2);
        ctx.fillStyle = obj.liquidColor + "bb";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      }
      break;
    }

    case "test_tube": {
      // Test tube
      const alpha = isCameraActive ? 0.7 : 0.5;
      const styles = getGlassStyles(skin, alpha, ctx, hs);

      ctx.beginPath();
      ctx.moveTo(-hs * 0.2, -hs);
      ctx.lineTo(-hs * 0.2, hs * 0.6);
      ctx.quadraticCurveTo(-hs * 0.2, hs, 0, hs);
      ctx.quadraticCurveTo(hs * 0.2, hs, hs * 0.2, hs * 0.6);
      ctx.lineTo(hs * 0.2, -hs);
      ctx.closePath();
      ctx.fillStyle = styles.fill;
      ctx.fill();
      ctx.strokeStyle = styles.stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rim
      ctx.beginPath();
      ctx.ellipse(0, -hs, hs * 0.25, hs * 0.06, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(200,230,255,0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Liquid
      if (obj.liquidLevel && obj.liquidLevel > 0 && obj.liquidColor) {
        const lh = hs * 1.4 * obj.liquidLevel;
        const ly = hs - lh;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-hs * 0.2, -hs);
        ctx.lineTo(-hs * 0.2, hs * 0.6);
        ctx.quadraticCurveTo(-hs * 0.2, hs, 0, hs);
        ctx.quadraticCurveTo(hs * 0.2, hs, hs * 0.2, hs * 0.6);
        ctx.lineTo(hs * 0.2, -hs);
        ctx.closePath();
        ctx.clip();

        const grad = ctx.createLinearGradient(0, ly, 0, hs);
        grad.addColorStop(0, obj.liquidColor + "cc");
        grad.addColorStop(0.7, obj.liquidColor + "ee");
        grad.addColorStop(1, obj.liquidColor + "ff");
        ctx.fillStyle = grad;
        ctx.fillRect(-hs * 0.2, ly, hs * 0.4, lh + hs * 0.1);

        ctx.beginPath();
        ctx.ellipse(0, ly, hs * 0.2, hs * 0.03, 0, 0, Math.PI * 2);
        ctx.fillStyle = obj.liquidColor + "bb";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      }
      break;
    }

    case "burner": {
      // Bunsen burner base
      ctx.beginPath();
      ctx.moveTo(-hs * 0.6, hs);
      ctx.lineTo(-hs * 0.5, hs * 0.3);
      ctx.lineTo(-hs * 0.15, hs * 0.3);
      ctx.lineTo(-hs * 0.15, -hs * 0.4);
      ctx.lineTo(hs * 0.15, -hs * 0.4);
      ctx.lineTo(hs * 0.15, hs * 0.3);
      ctx.lineTo(hs * 0.5, hs * 0.3);
      ctx.lineTo(hs * 0.6, hs);
      ctx.closePath();
      ctx.fillStyle = "rgba(120,130,150,0.7)";
      ctx.fill();
      ctx.strokeStyle = "rgba(180,190,200,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Nozzle
      ctx.beginPath();
      ctx.moveTo(-hs * 0.2, -hs * 0.4);
      ctx.lineTo(-hs * 0.12, -hs * 0.7);
      ctx.lineTo(hs * 0.12, -hs * 0.7);
      ctx.lineTo(hs * 0.2, -hs * 0.4);
      ctx.closePath();
      ctx.fillStyle = "rgba(90,95,110,0.8)";
      ctx.fill();

      // Flame if lit
      if (obj.flameOn) {
        const flicker = Math.sin(time * 0.015) * 3;
        const flicker2 = Math.cos(time * 0.022) * 2;

        // Outer flame (orange/yellow)
        ctx.beginPath();
        ctx.moveTo(-hs * 0.3, -hs * 0.7);
        ctx.quadraticCurveTo(-hs * 0.4 + flicker2, -hs * 1.3, 0 + flicker, -hs * 1.8);
        ctx.quadraticCurveTo(hs * 0.4 - flicker2, -hs * 1.3, hs * 0.3, -hs * 0.7);
        ctx.closePath();
        const flameGrad = ctx.createLinearGradient(0, -hs * 0.7, 0, -hs * 1.8);
        flameGrad.addColorStop(0, "rgba(255,140,0,0.9)");
        flameGrad.addColorStop(0.4, "rgba(255,200,0,0.8)");
        flameGrad.addColorStop(1, "rgba(255,255,100,0.3)");
        ctx.fillStyle = flameGrad;
        ctx.fill();

        // Inner flame (blue)
        ctx.beginPath();
        ctx.moveTo(-hs * 0.12, -hs * 0.7);
        ctx.quadraticCurveTo(-hs * 0.15, -hs * 1.1, 0, -hs * 1.3 + flicker);
        ctx.quadraticCurveTo(hs * 0.15, -hs * 1.1, hs * 0.12, -hs * 0.7);
        ctx.closePath();
        const innerGrad = ctx.createLinearGradient(0, -hs * 0.7, 0, -hs * 1.3);
        innerGrad.addColorStop(0, "rgba(50,100,255,0.9)");
        innerGrad.addColorStop(1, "rgba(100,180,255,0.4)");
        ctx.fillStyle = innerGrad;
        ctx.fill();

        // Glow
        ctx.shadowColor = "rgba(255,150,0,0.5)";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, -hs * 1.1, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,200,0.01)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      break;
    }

    case "dropper": {
      // Dropper body
      ctx.beginPath();
      ctx.moveTo(-hs * 0.15, -hs * 0.3);
      ctx.lineTo(-hs * 0.15, hs * 0.5);
      ctx.lineTo(-hs * 0.05, hs * 0.9);
      ctx.lineTo(hs * 0.05, hs * 0.9);
      ctx.lineTo(hs * 0.15, hs * 0.5);
      ctx.lineTo(hs * 0.15, -hs * 0.3);
      ctx.closePath();
      ctx.fillStyle = "rgba(200,230,255,0.3)";
      ctx.fill();
      ctx.strokeStyle = "rgba(170,210,250,0.6)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Rubber bulb
      ctx.beginPath();
      ctx.ellipse(0, -hs * 0.5, hs * 0.22, hs * 0.25, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(180,80,80,0.7)";
      ctx.fill();
      ctx.strokeStyle = "rgba(200,100,100,0.5)";
      ctx.stroke();

      // Liquid inside
      if (obj.chemical && obj.liquidLevel && obj.liquidLevel > 0) {
        const lh = hs * 0.7 * obj.liquidLevel;
        ctx.beginPath();
        ctx.rect(-hs * 0.12, hs * 0.5 - lh, hs * 0.24, lh);
        ctx.fillStyle = (obj.color || "#3b82f6") + "aa";
        ctx.fill();
      }

      // Drip at tip
      if (obj.chemical) {
        const dripPhase = (time * 0.003) % 1;
        if (dripPhase < 0.3) {
          ctx.beginPath();
          ctx.ellipse(0, hs * 0.9 + dripPhase * 10, 2, 3, 0, 0, Math.PI * 2);
          ctx.fillStyle = (obj.color || "#3b82f6") + "cc";
          ctx.fill();
        }
      }
      break;
    }

    case "cylinder": {
      // Graduated cylinder
      const alpha = isCameraActive ? 0.7 : 0.5;
      const styles = getGlassStyles(skin, alpha, ctx, hs);

      ctx.beginPath();
      ctx.moveTo(-hs * 0.25, -hs);
      ctx.lineTo(-hs * 0.3, hs * 0.85);
      ctx.quadraticCurveTo(-hs * 0.3, hs, 0, hs);
      ctx.quadraticCurveTo(hs * 0.3, hs, hs * 0.3, hs * 0.85);
      ctx.lineTo(hs * 0.25, -hs);
      ctx.closePath();
      ctx.fillStyle = styles.fill;
      ctx.fill();
      ctx.strokeStyle = styles.stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Graduation marks
      for (let i = 1; i <= 5; i++) {
        const gy = hs - (i / 6) * (hs * 1.8);
        const gw = i % 2 === 0 ? 0.2 : 0.12;
        ctx.beginPath();
        ctx.moveTo(-hs * 0.22, gy);
        ctx.lineTo(-hs * gw + hs * 0.08, gy);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Rim
      ctx.beginPath();
      ctx.ellipse(0, -hs, hs * 0.28, hs * 0.06, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(200,230,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }

    case "petri": {
      // Petri dish (top view)
      ctx.beginPath();
      ctx.ellipse(0, hs * 0.2, hs * 0.85, hs * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200,230,255,0.15)";
      ctx.fill();
      ctx.strokeStyle = "rgba(170,210,250,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.ellipse(0, hs * 0.2, hs * 0.7, hs * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(170,210,250,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Lid edge (3D effect)
      ctx.beginPath();
      ctx.ellipse(0, hs * 0.1, hs * 0.88, hs * 0.47, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = "rgba(220,240,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    }

    case "rod": {
      // Stirring rod
      ctx.beginPath();
      ctx.moveTo(0, -hs);
      ctx.lineTo(0, hs);
      ctx.strokeStyle = "rgba(200,210,220,0.7)";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();

      // Glass shine
      ctx.beginPath();
      ctx.moveTo(-1, -hs * 0.8);
      ctx.lineTo(-1, hs * 0.8);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tip
      ctx.beginPath();
      ctx.arc(0, hs, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200,210,220,0.8)";
      ctx.fill();
      break;
    }

    case "spatula": {
      // Spatula handle
      ctx.beginPath();
      ctx.moveTo(0, -hs);
      ctx.lineTo(0, hs * 0.3);
      ctx.strokeStyle = "rgba(160,140,100,0.8)";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();

      // Metal blade
      ctx.beginPath();
      ctx.moveTo(-hs * 0.3, hs * 0.3);
      ctx.quadraticCurveTo(-hs * 0.35, hs * 0.6, -hs * 0.2, hs * 0.9);
      ctx.lineTo(hs * 0.2, hs * 0.9);
      ctx.quadraticCurveTo(hs * 0.35, hs * 0.6, hs * 0.3, hs * 0.3);
      ctx.closePath();
      ctx.fillStyle = "rgba(180,190,200,0.6)";
      ctx.fill();
      ctx.strokeStyle = "rgba(200,210,220,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Shine
      ctx.beginPath();
      ctx.moveTo(-hs * 0.1, hs * 0.35);
      ctx.lineTo(0, hs * 0.8);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }

    case "thermometer": {
      const temp = obj.temperature ?? 25;

      // Draw thermometer backing (white glass backing)
      ctx.beginPath();
      ctx.roundRect(-hs * 0.15, -hs, hs * 0.3, hs * 1.6, 4);
      ctx.fillStyle = "rgba(240, 240, 240, 0.85)";
      ctx.fill();
      ctx.strokeStyle = "rgba(180, 180, 180, 0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw bulb at bottom
      ctx.beginPath();
      ctx.arc(0, hs * 0.7, hs * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444"; // red mercury bulb
      ctx.fill();
      ctx.strokeStyle = "rgba(180, 180, 180, 0.7)";
      ctx.stroke();

      // Mercury column (red line)
      // Map temperature (20 to 150) to height of mercury column
      const tempMin = 20;
      const tempMax = 150;
      const mercuryStart = hs * 0.6; // bottom of the column
      const mercuryEnd = -hs * 0.8; // top of the column
      const maxColH = mercuryStart - mercuryEnd;

      const ratio = Math.max(0, Math.min(1, (temp - tempMin) / (tempMax - tempMin)));
      const colH = ratio * maxColH;

      ctx.beginPath();
      ctx.moveTo(0, mercuryStart);
      ctx.lineTo(0, mercuryStart - colH);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      // Measurement graduation ticks
      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = 0.6;
      for (let i = 0; i <= 5; i++) {
        const ty = mercuryStart - (i / 5) * maxColH;
        ctx.beginPath();
        ctx.moveTo(-hs * 0.08, ty);
        ctx.lineTo(hs * 0.08, ty);
        ctx.stroke();
      }

      // Digital readout text overlay
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(`${Math.round(temp)}°C`, hs * 0.5, -hs * 0.6);
      ctx.shadowBlur = 0;
      break;
    }

    case "ph_meter": {
      const pH = obj.measuredPH ?? 7.0;

      // Draw probe shaft (dark gray/black plastic)
      ctx.beginPath();
      ctx.roundRect(-hs * 0.15, -hs * 0.9, hs * 0.3, hs * 1.5, 4);
      ctx.fillStyle = "rgba(31, 41, 55, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(100, 116, 139, 0.8)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Silver metal probe tip at bottom
      ctx.beginPath();
      ctx.roundRect(-hs * 0.1, hs * 0.5, hs * 0.2, hs * 0.25, 2);
      ctx.fillStyle = "rgba(200, 200, 200, 0.9)";
      ctx.fill();

      // Indicator LED screen block at the top
      ctx.beginPath();
      ctx.roundRect(-hs * 0.4, -hs * 1.1, hs * 0.8, hs * 0.45, 4);
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 184, 166, 0.5)"; // cyan accent border
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Glow color based on pH value (red for acid, green for neutral, purple for base)
      const glowColor = pH < 6.0 ? "#f43f5e" : pH > 8.0 ? "#a855f7" : "#10b981";
      ctx.fillStyle = glowColor;

      // Draw screen text showing measured pH
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`pH:${pH.toFixed(2)}`, 0, -hs * 0.88);
      break;
    }

    default: {
      // Fallback: draw emoji
      ctx.font = `${S * 0.85}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.emoji, 0, 0);
    }
  }
}

/* =========================================================
   COMPONENT
   ========================================================= */
const LabSimulation = forwardRef<LabSimulationHandle, LabSimulationProps>(function LabSimulation({
  paused,
  objects,
  onObjectsChange,
  onReactionUpdate,
  onReactionComplete,
  handDataRef,
  handData,
  cameraActive,
  videoRef,
  overlayCanvasRef,
  bridgeFrameUrl,
  glasswareSkin = "classic",
  addToast,
}: LabSimulationProps, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const objectsRef = useRef<WorldObject[]>(objects);
  const particlesRef = useRef<Particle[]>([]);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  /** Track previous reaction status to avoid calling onReactionUpdate every idle frame */
  const prevReportStatusRef = useRef<string>("idle");
  const handGrabRef = useRef<Record<string, { id: string, offX: number, offY: number, wasPinching: boolean }>>({
    Left: { id: "", offX: 0, offY: 0, wasPinching: false },
    Right: { id: "", offX: 0, offY: 0, wasPinching: false }
  });
  const pausedRef = useRef(paused);
  const sizeRef = useRef({ W: 0, H: 0 });

  // Exporter line graph refs
  const graphPointsRef = useRef<number[]>([]);
  const lastGraphUpdateRef = useRef<number>(0);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { objectsRef.current = objects; }, [objects]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      const W = container.clientWidth;
      const H = container.clientHeight;
      canvas.width = W;
      canvas.height = H;
      sizeRef.current = { W, H };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const spawnDroplet = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        id: genParticleId(), x, y,
        vx: (Math.random() - 0.5) * 60,
        vy: Math.random() * 30 + 20,
        life: 1, type: "droplet", color,
        size: 6 + Math.random() * 6,
      });
    }
  }, []);

  const spawnSmoke = useCallback((x: number, y: number) => {
    for (let i = 0; i < 3; i++) {
      particlesRef.current.push({
        id: genParticleId(),
        x: x + (Math.random() - 0.5) * 20, y,
        vx: (Math.random() - 0.5) * 30,
        vy: -(Math.random() * 60 + 40),
        life: 1, type: "smoke", color: "#94a3b8",
        size: 10 + Math.random() * 14,
      });
    }
  }, []);

  const spawnCompletionAnimation = useCallback((x: number, y: number, color: string) => {
    // 1. Glowing ring particle
    particlesRef.current.push({
      id: genParticleId(),
      x, y, vx: 0, vy: 0,
      life: 1.0,
      type: "ring",
      color,
      size: 10
    });

    // 2. Sparkling burst particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 120 + 60;
      particlesRef.current.push({
        id: genParticleId(),
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 1.0,
        type: "spark",
        color,
        size: 3 + Math.random() * 4
      });
    }

    // 3. Steam burst particles
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        id: genParticleId(),
        x: x + (Math.random() - 0.5) * 30,
        y: y - 10,
        vx: (Math.random() - 0.5) * 20,
        vy: -(Math.random() * 40 + 20),
        life: 0.8,
        type: "steam",
        color: "#ffffff",
        size: 15 + Math.random() * 10
      });
    }
  }, []);

  const spawnExplosionAnimation = useCallback((x: number, y: number) => {
    // 1. Dark smoke particles
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        id: genParticleId(),
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 120,
        vy: -(Math.random() * 80 + 80),
        life: 1.0,
        type: "smoke",
        color: "#475569",
        size: 15 + Math.random() * 15
      });
    }

    // 2. Fire particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 160 + 80;
      particlesRef.current.push({
        id: genParticleId(),
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 0.6,
        type: "fire",
        color: "#f97316",
        size: 10 + Math.random() * 10
      });
    }

    // 3. Spark lines
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 250 + 100;
      particlesRef.current.push({
        id: genParticleId(),
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.8,
        type: "spark",
        color: "#fbbf24",
        size: 2 + Math.random() * 3
      });
    }
  }, []);

  /* --- Reaction engine tick (replaces the old checkReactions) --- */
  const runReactionEngine = useCallback((dt: number) => {
    // 1. Get all container objects from objectsRef
    const containers = objectsRef.current.filter(
      (o) => o.type === "flask" || o.type === "beaker" || o.type === "test_tube"
    );

    if (containers.length === 0) {
      const idleReport = {
        equation: "No active reaction",
        type: "generic",
        status: "idle" as const,
        progress: 0,
        temperature: 25,
        startTemp: 25,
        peakTemp: 25,
        durationMs: 0,
        products: [],
        reactantIds: [],
        objectCount: objectsRef.current.length,
        slotIndex: -1,
      };
      if (prevReportStatusRef.current !== "idle") {
        onReactionUpdate(idleReport);
      }
      prevReportStatusRef.current = "idle";
      return;
    }

    // 2. Map containers to SlotState inputs for the engine
    const slotsInput = containers.map((c) => ({
      x: c.x,
      y: c.y,
      chemicals: c.chemicals || [],
      reactionProgress: c.reactionProgress || 0,
      reacting: c.reacting || false,
      reactionId: c.reactionId || null,
      liquidColor: c.liquidColor || null,
      liquidLevel: c.liquidLevel || 0,
      temperature: c.temperature ?? 25,
      startTime: c.startTime || null,
      startTemp: c.startTemp ?? 25,
      peakTemp: c.peakTemp ?? 25,
      cancelled: c.cancelled || false,
    }));

    const reactingBefore = slotsInput.map((s) => s.reacting);

    // 3. Tick the engine
    const output = tickEngine(
      slotsInput,
      objectsRef.current,
      dt,
      performance.now()
    );

    // 4. Map updated states back to container objects
    let containerIdx = 0;
    objectsRef.current = objectsRef.current.map((obj) => {
      if (obj.type === "flask" || obj.type === "beaker" || obj.type === "test_tube") {
        const updated = output.slots[containerIdx++];
        if (updated) {
          if (updated.burst) {
            spawnExplosionAnimation(obj.x, obj.y);
            synth?.playExplosion();
            if (addToast) {
              addToast("⚠️", "Glassware burst due to excessive heat!");
            }
            obj.chemicals = [];
            obj.reactionProgress = 0;
            obj.reacting = false;
            obj.reactionId = null;
            obj.liquidColor = null;
            obj.liquidLevel = 0;
            obj.temperature = 25;
            obj.startTime = null;
            obj.startTemp = 25;
            obj.peakTemp = 25;
            obj.cancelled = false;
          } else {
            obj.chemicals = updated.chemicals;
            obj.reactionProgress = updated.reactionProgress;
            obj.reacting = updated.reacting;
            obj.reactionId = updated.reactionId;
            obj.liquidColor = updated.liquidColor;
            obj.liquidLevel = updated.liquidLevel;
            obj.temperature = updated.temperature;
            obj.startTime = updated.startTime;
            obj.startTemp = updated.startTemp;
            obj.peakTemp = updated.peakTemp;
            obj.cancelled = updated.cancelled;
          }
        }
      }
      return obj;
    });

    // 5. Detect completed reactions to trigger visual effects
    let tickedIdx = 0;
    for (let i = 0; i < objectsRef.current.length; i++) {
      const obj = objectsRef.current[i];
      if (obj.type === "flask" || obj.type === "beaker" || obj.type === "test_tube") {
        const wasReacting = reactingBefore[tickedIdx++];
        if (wasReacting && !obj.reacting && output.lastCompletedReport) {
          spawnCompletionAnimation(obj.x, obj.y, output.lastCompletedReport.products[0]?.color || "#10b981");
          synth?.playSuccess();
        }

        // Play dynamic bubble pop sound periodically during active reactions
        if (obj.reacting && Math.random() < 0.035) {
          synth?.playBubble();
        }
      }
    }

    // 6. Spawn smoke for containers that just started reacting
    let containerSearchIdx = 0;
    for (const obj of objectsRef.current) {
      if (obj.type === "flask" || obj.type === "beaker" || obj.type === "test_tube") {
        if (output.newlyStartedSlots.includes(containerSearchIdx++)) {
          spawnSmoke(obj.x, obj.y - OBJECT_SIZE * 0.4);
        }
      }
    }

    // 7. Only call setState when something meaningful changed
    const newStatus = output.activeReport.status;
    if (newStatus !== "idle" || prevReportStatusRef.current !== "idle") {
      onReactionUpdate(output.activeReport);
    }
    prevReportStatusRef.current = newStatus;

    // Fire onReactionComplete callback
    if (output.lastCompletedReport && onReactionComplete) {
      onReactionComplete(output.lastCompletedReport);
    }
  }, [onReactionUpdate, onReactionComplete, spawnSmoke, spawnCompletionAnimation]);

  const checkDropperSlot = useCallback(() => {
    for (const dropper of objectsRef.current) {
      if (dropper.type !== "dropper" || !dropper.chemical) continue;
      for (const container of objectsRef.current) {
        if (container.type !== "flask" && container.type !== "beaker" && container.type !== "test_tube") continue;
        
        const dx = dropper.x - container.x;
        const dy = (dropper.y + OBJECT_SIZE / 2) - container.y;
        const dist = Math.hypot(dx, dy);
        if (dist < OBJECT_SIZE * 0.9) {
          const containerChems = container.chemicals || [];
          const already = containerChems.find((c) => c.id === dropper.chemical!.id);
          if (!already) {
            container.chemicals = [...containerChems, dropper.chemical!];
            container.liquidColor = dropper.chemical!.color;
            container.liquidLevel = Math.min(1, (container.liquidLevel || 0) + 0.35);
            spawnDroplet(dropper.x, dropper.y + OBJECT_SIZE / 2, dropper.chemical!.color);
          }
        }
      }
    }
  }, [spawnDroplet]);

function getContainerSurfaceY(obj: WorldObject): number {
  const hs = OBJECT_SIZE * 0.45;
  const mult = obj.type === "flask" ? 1.35 : obj.type === "beaker" ? 1.5 : 1.4;
  const lh = hs * mult * (obj.liquidLevel || 0);
  return obj.y + hs - lh;
}

function getContainerSurfaceWidth(obj: WorldObject): number {
  const hs = OBJECT_SIZE * 0.45;
  if (obj.type === "beaker") {
    return hs * 1.4;
  } else if (obj.type === "test_tube") {
    return hs * 0.4;
  } else if (obj.type === "flask") {
    const level = obj.liquidLevel || 0;
    return hs * (1.8 - level * 1.3);
  }
  return hs * 0.9;
}

  /* ------- Main animation loop ------- */
  const animate = useCallback(function animateFrame(time: number) {
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { W, H } = sizeRef.current;
    const floorY = H - FLOOR_PAD;

    if (!pausedRef.current) {
      // Hand gesture update
      if (handDataRef?.current) {
        for (const hand of handDataRef.current) {
          const hState = handGrabRef.current[hand.label];
          if (!hState) continue;
          const px = (1 - hand.indexTip.x) * W;
          const py = hand.indexTip.y * H;

          if (hand.pinching && !hState.wasPinching) {
            const otherLabel = hand.label === "Left" ? "Right" : "Left";
            const otherHState = handGrabRef.current[otherLabel];
            let actionTriggered = false;
            if (otherHState?.id) {
              const grabbedObj = objectsRef.current.find(o => o.id === otherHState.id);
              if (grabbedObj) {
                if (grabbedObj.type === "dropper" && grabbedObj.chemical) {
                  spawnDroplet(grabbedObj.x, grabbedObj.y + OBJECT_SIZE / 2, grabbedObj.chemical.color);
                  actionTriggered = true;
                } else if (grabbedObj.type === "burner") {
                  grabbedObj.flameOn = !grabbedObj.flameOn;
                  actionTriggered = true;
                }
              }
            }
            if (!actionTriggered) {
              for (let i = objectsRef.current.length - 1; i >= 0; i--) {
                const obj = objectsRef.current[i];
                const dist = Math.hypot(obj.x - px, obj.y - py);
                if (dist < OBJECT_SIZE * 1.5) {
                  hState.id = obj.id;
                  hState.offX = obj.x - px;
                  hState.offY = obj.y - py;
                  obj.grabbed = true;
                  obj.vx = 0;
                  obj.vy = 0;
                  break;
                }
              }
            }
          } else if (hand.pinching && hState.id) {
            const obj = objectsRef.current.find(o => o.id === hState.id);
            if (obj) {
              const newX = px + hState.offX;
              const newY = py + hState.offY;
              obj.vx = (newX - obj.x) * 15;
              obj.vy = (newY - obj.y) * 15;
              obj.x = newX;
              obj.y = newY;
            }
          } else if (!hand.pinching && hState.wasPinching && hState.id) {
            const obj = objectsRef.current.find(o => o.id === hState.id);
            if (obj) {
              if (dragRef.current?.id !== obj.id) obj.grabbed = false;
              obj.angularVel = (Math.random() - 0.5) * 0.5;
            }
            hState.id = "";
          }
          hState.wasPinching = hand.pinching;
        }
      }

      for (const obj of objectsRef.current) {
        if (obj.grabbed) continue;
        obj.vy += GRAVITY * dt;
        obj.x += obj.vx * dt;
        obj.y += obj.vy * dt;
        obj.rotation += obj.angularVel * dt;
        obj.angularVel *= ANGULAR_DAMPING;
        if (obj.y > floorY - OBJECT_SIZE / 2) {
          obj.y = floorY - OBJECT_SIZE / 2;
          obj.vy *= -DAMPING;
          obj.vx *= 0.85;
          if (Math.abs(obj.vy) < 20) obj.vy = 0;
        }
        if (obj.x < OBJECT_SIZE / 2) { obj.x = OBJECT_SIZE / 2; obj.vx *= -0.5; }
        if (obj.x > W - OBJECT_SIZE / 2) { obj.x = W - OBJECT_SIZE / 2; obj.vx *= -0.5; }
        if (obj.type === "burner" && obj.flameOn) {
          if (Math.random() < 0.15) {
            particlesRef.current.push({
              id: genParticleId(),
              x: obj.x + (Math.random() - 0.5) * 8,
              y: obj.y - OBJECT_SIZE * 0.5,
              vx: (Math.random() - 0.5) * 10,
              vy: -(Math.random() * 40 + 35),
              life: 0.3 + Math.random() * 0.2,
              type: "fire",
              color: "#3b82f6",
              size: 6 + Math.random() * 6
            });
          }
          if (Math.random() < 0.05) {
            spawnSmoke(obj.x, obj.y - OBJECT_SIZE * 0.8);
          }
        }
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx * dt;
        if (p.type === "droplet") {
          p.vy += 400 * dt;
          p.y += p.vy * dt;
          p.life -= dt * 1.2;
        } else if (p.type === "smoke") {
          p.y += p.vy * dt;
          p.x += Math.sin(p.y * 0.05) * 0.5;
          p.life -= dt * 0.5;
        } else if (p.type === "bubble") {
          p.y += p.vy * dt;
          p.x += (Math.random() - 0.5) * 8 * dt;
          if (p.containerId) {
            const container = objectsRef.current.find((o) => o.id === p.containerId);
            if (container) {
              const surfaceY = getContainerSurfaceY(container);
              if (p.y <= surfaceY) {
                p.life = 0;
              } else {
                const isStirred = objectsRef.current.some(
                  (o) => o.type === "rod" && Math.hypot(o.x - container.x, o.y - container.y) < SLOT_W * 1.5
                );
                if (isStirred) {
                  const dx = p.x - container.x;
                  p.vx -= dx * 10 * dt;
                  p.vx += (p.y - container.y) * 30 * dt * (p.x > container.x ? 1 : -1);
                }
              }
            }
          }
          p.life -= dt * 0.6;
        } else if (p.type === "steam") {
          p.y += p.vy * dt;
          p.x += Math.sin(p.y * 0.02 + p.size) * 15 * dt;
          p.size += dt * 8;
          p.life -= dt * 0.8;
        } else if (p.type === "fire") {
          p.y += p.vy * dt;
          p.x += p.vx * dt;
          p.size = Math.max(0.1, p.size - dt * 8);
          p.life -= dt * 2.2;
        } else if (p.type === "spark") {
          p.vy += 250 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt * 1.4;
        } else if (p.type === "precipitate") {
          if (p.containerId) {
            const container = objectsRef.current.find((o) => o.id === p.containerId);
            if (container) {
              const hs = OBJECT_SIZE * 0.45;
              const bottomY = container.y + hs - 4;
              if (p.y < bottomY) {
                p.y += p.vy * dt;
                p.x += p.vx * dt;
              } else {
                p.y = bottomY;
                p.vx = 0;
                p.vy = 0;
                if (!container.reacting) p.life -= dt * 0.12;
              }
            }
          }
        } else if (p.type === "ring") {
          p.size += dt * 140;
          p.life -= dt * 1.8;
        }
        return p.life > 0;
      });

      checkDropperSlot();
      runReactionEngine(dt);

      // Update thermodynamic graph points for active reactions
      const activeContainer = objectsRef.current.find(
        (obj) => (obj.type === "flask" || obj.type === "beaker" || obj.type === "test_tube") && obj.reacting
      );
      if (activeContainer) {
        const now = performance.now();
        if (now - lastGraphUpdateRef.current > 150) {
          graphPointsRef.current.push(activeContainer.temperature ?? 25);
          if (graphPointsRef.current.length > 80) {
            graphPointsRef.current.shift();
          }
          lastGraphUpdateRef.current = now;
        }
      } else {
        if (graphPointsRef.current.length > 0) {
          graphPointsRef.current = [];
        }
      }

      // Boiling sound sizzle control
      const boilingSlot = objectsRef.current.find(
        (obj) => (obj.type === "flask" || obj.type === "beaker" || obj.type === "test_tube") &&
                 obj.liquidLevel && obj.liquidLevel > 0 && (obj.temperature ?? 25) > 90
      );
      if (boilingSlot) {
        const temp = boilingSlot.temperature ?? 25;
        const intensity = Math.min(1, (temp - 90) / 40); // 90 to 130 C
        synth?.playSizzle(intensity);
      } else {
        synth?.stopSizzle();
      }

      // Read values for Thermometer and pH Probe
      objectsRef.current.forEach((o) => {
        if (o.type === "thermometer") {
          let temp = 25;
          for (const container of objectsRef.current) {
            if (container.type === "flask" || container.type === "beaker" || container.type === "test_tube") {
              const dx = o.x - container.x;
              const dy = (o.y + OBJECT_SIZE * 0.3) - container.y;
              const dist = Math.hypot(dx, dy);
              if (dist < OBJECT_SIZE * 0.9) {
                temp = container.temperature ?? 25;
                break;
              }
            }
          }
          o.temperature = temp;
        } else if (o.type === "ph_meter") {
          let pH = 7.0;
          for (const container of objectsRef.current) {
            if (container.type === "flask" || container.type === "beaker" || container.type === "test_tube") {
              const dx = o.x - container.x;
              const dy = (o.y + OBJECT_SIZE * 0.3) - container.y;
              const dist = Math.hypot(dx, dy);
              if (dist < OBJECT_SIZE * 0.9) {
                pH = calculatePH(container.chemicals || []);
                break;
              }
            }
          }
          o.measuredPH = pH;
        }
      });

      // Periodically spawn reaction particles, steam, and bubbles per container object
      objectsRef.current.forEach((obj) => {
        if (obj.type !== "flask" && obj.type !== "beaker" && obj.type !== "test_tube") return;
        if (!obj.liquidColor || !obj.liquidLevel || obj.liquidLevel <= 0) return;

        const containerTemp = obj.temperature ?? 25;
        const surfaceY = getContainerSurfaceY(obj);
        const surfaceW = getContainerSurfaceWidth(obj);
        const hs = OBJECT_SIZE * 0.45;
        const bottomY = obj.y + hs - 6;
        const depth = Math.max(0, bottomY - surfaceY);

        // Spawning swirling vortex particles when stirred
        const stirred = objectsRef.current.some(
          (o) => o.type === "rod" && Math.hypot(o.x - obj.x, o.y - obj.y) < SLOT_W * 1.5
        );
        if (stirred && Math.random() < 0.35) {
          particlesRef.current.push({
            id: genParticleId(),
            x: obj.x - surfaceW / 2 + Math.random() * surfaceW,
            y: surfaceY + Math.random() * depth,
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 10 - 5,
            life: 0.8 + Math.random() * 0.4,
            type: "bubble",
            color: obj.liquidColor || "#ffffff",
            size: 1.5 + Math.random() * 2,
            containerId: obj.id
          });
        }

        // Evaporation steam & bubbles if slot is boiling (> 95C)
        if (containerTemp > 95 && Math.random() < 0.25) {
          particlesRef.current.push({
            id: genParticleId(),
            x: obj.x - surfaceW / 2 + Math.random() * surfaceW,
            y: surfaceY,
            vx: (Math.random() - 0.5) * 15,
            vy: -(Math.random() * 30 + 30),
            life: 0.7 + Math.random() * 0.4,
            type: "steam",
            color: "#ffffff",
            size: 6 + Math.random() * 8
          });
        }
        if (containerTemp > 85 && Math.random() < 0.15) {
          particlesRef.current.push({
            id: genParticleId(),
            x: obj.x - surfaceW / 2 + Math.random() * surfaceW,
            y: bottomY - Math.random() * depth,
            vx: 0,
            vy: -(Math.random() * 20 + 20),
            life: 1.0,
            type: "bubble",
            color: "#ffffff",
            size: 1.5 + Math.random() * 2.5,
            containerId: obj.id
          });
        }

        // Reaction specific particles
        if (obj.reacting && obj.reactionId) {
          const reaction = ALL_REACTIONS.find((r) => r.id === obj.reactionId);
          const rxType = reaction ? reaction.type : "generic";

          // Bubbles for synthesis / gas releases
          const isGasGenerating = rxType === "synthesis" || reaction?.equation.includes("bubbles") || reaction?.equation.includes("fumes");
          if ((isGasGenerating || containerTemp > 80) && Math.random() < 0.3) {
            particlesRef.current.push({
              id: genParticleId(),
              x: obj.x - surfaceW / 2 + Math.random() * surfaceW,
              y: bottomY - Math.random() * depth,
              vx: 0,
              vy: -(Math.random() * 25 + 20),
              life: 1.0,
              type: "bubble",
              color: "#ffffff",
              size: 2 + Math.random() * 3,
              containerId: obj.id
            });
          }

          // Steam for neutralization (heat pulses)
          if (rxType === "neutralization" && Math.random() < 0.15) {
            particlesRef.current.push({
              id: genParticleId(),
              x: obj.x - surfaceW / 2 + Math.random() * surfaceW,
              y: surfaceY,
              vx: (Math.random() - 0.5) * 10,
              vy: -(Math.random() * 20 + 20),
              life: 0.6 + Math.random() * 0.3,
              type: "steam",
              color: "#ffffff",
              size: 5 + Math.random() * 6
            });
          }

          // Solid settling flakes for precipitation
          if (rxType === "precipitation" && Math.random() < 0.25) {
            const precipColor = reaction ? reaction.productColor : "#ffffff";
            particlesRef.current.push({
              id: genParticleId(),
              x: obj.x - surfaceW / 2 + Math.random() * surfaceW,
              y: surfaceY + 2,
              vx: (Math.random() - 0.5) * 5,
              vy: Math.random() * 15 + 10,
              life: 1.0,
              type: "precipitate",
              color: precipColor,
              size: 1.5 + Math.random() * 2.5,
              containerId: obj.id
            });
          }

          // Combustion fire & sparks (H2 + O2 synthesis)
          if (rxType === "synthesis" && reaction && reaction.id === "h2_o2") {
            if (Math.random() < 0.6) {
              particlesRef.current.push({
                id: genParticleId(),
                x: obj.x + (Math.random() - 0.5) * 40,
                y: obj.y + hs - 10 - Math.random() * 20,
                vx: (Math.random() - 0.5) * 40,
                vy: -(Math.random() * 60 + 50),
                life: 0.4,
                type: "fire",
                color: "#ff8c00",
                size: 12 + Math.random() * 15
              });
            }
            if (Math.random() < 0.3) {
              particlesRef.current.push({
                id: genParticleId(),
                x: obj.x + (Math.random() - 0.5) * 20,
                y: surfaceY,
                vx: (Math.random() - 0.5) * 100,
                vy: -(Math.random() * 150 + 50),
                life: 0.8 + Math.random() * 0.4,
                type: "spark",
                color: "#ffd700",
                size: 2 + Math.random() * 3
              });
            }
          }
        }
      });
    }

    /* --- Draw --- */
    ctx.clearRect(0, 0, W, H);

    // Background grid (only when no camera)
    if (!cameraActive) {
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < W; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }

    // Lab floor
    const grad = ctx.createLinearGradient(0, floorY, 0, floorY + 6);
    grad.addColorStop(0, "rgba(245,158,11,0.5)");
    grad.addColorStop(1, "rgba(245,158,11,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, floorY, W, 6);

    const platformGrad = ctx.createLinearGradient(0, floorY, 0, H);
    platformGrad.addColorStop(0, "rgba(10,14,30,0.9)");
    platformGrad.addColorStop(1, "rgba(5,8,16,0.95)");
    ctx.fillStyle = platformGrad;
    ctx.fillRect(0, floorY, W, H - floorY);

    // Draw visual stands (former slots)
    const standSlotY = H - FLOOR_PAD;
    const totalW = SLOT_COUNT * SLOT_W + (SLOT_COUNT - 1) * SLOT_GAP;
    const startX = (W - totalW) / 2;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const standX = startX + i * (SLOT_W + SLOT_GAP);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(standX, standSlotY, SLOT_W, SLOT_H);
      ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
      ctx.fillRect(standX, standSlotY, SLOT_W, SLOT_H);
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.font = "8px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("STAND", standX + SLOT_W / 2, standSlotY + SLOT_H / 2 + 3);
    }

    // Draw particles
    for (const p of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = p.life;
      
      if (p.type === "droplet") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "smoke") {
        const smoke = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        smoke.addColorStop(0, "rgba(148,163,184,0.4)");
        smoke.addColorStop(1, "rgba(148,163,184,0)");
        ctx.fillStyle = smoke;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "bubble") {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "steam") {
        const steamGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        steamGrad.addColorStop(0, `rgba(255, 255, 255, ${0.12 * p.life})`);
        steamGrad.addColorStop(0.5, `rgba(240, 240, 240, ${0.04 * p.life})`);
        steamGrad.addColorStop(1, "rgba(240, 240, 240, 0)");
        ctx.fillStyle = steamGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "fire") {
        const fireGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        fireGrad.addColorStop(0, p.color === "#3b82f6" ? "rgba(200, 220, 255, 1)" : "rgba(255, 255, 200, 1)");
        fireGrad.addColorStop(0.3, p.color === "#3b82f6" ? "rgba(50, 100, 255, 0.85)" : "rgba(255, 140, 0, 0.85)");
        fireGrad.addColorStop(0.7, p.color === "#3b82f6" ? "rgba(30, 60, 220, 0.4)" : "rgba(239, 68, 68, 0.4)");
        fireGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "spark") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.5, p.size * 0.4);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
        ctx.stroke();
      } else if (p.type === "precipitate") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else if (p.type === "ring") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 3 * p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw world objects with realistic tool shapes
    for (const obj of objectsRef.current) {
      // 1. Draw wavy heat shimmer above container objects in screen space
      if (obj.type === "flask" || obj.type === "beaker" || obj.type === "test_tube") {
        const hs = OBJECT_SIZE * 0.45;
        const widthMult = obj.type === "flask" ? 0.6 : obj.type === "beaker" ? 1.4 : 0.4;
        const rimWidth = hs * widthMult;
        drawHeatShimmer(ctx, obj.x, obj.y - hs, rimWidth, obj.temperature ?? 25, time);
      }

      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation);
      
      if (obj.grabbed) { 
        ctx.shadowColor = "rgba(245,158,11,0.7)"; 
        ctx.shadowBlur = 20; 
      }
      
      // 2. Apply glowing neon aura around reacting containers
      if (obj.reacting) {
        const rx = ALL_REACTIONS.find((r) => r.id === obj.reactionId);
        const glowColor =
          rx?.type === "synthesis" || rx?.type === "combustion" ? "rgba(239, 68, 68, 0.85)" :
          rx?.type === "precipitation" ? "rgba(139, 92, 246, 0.85)" :
          rx?.type === "neutralization" ? "rgba(20, 184, 166, 0.85)" : "rgba(245, 158, 11, 0.7)";
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 18 + 6 * Math.sin(time * 0.008);
      }

      drawToolShape(ctx, obj, OBJECT_SIZE, time, cameraActive, glasswareSkin);
      ctx.shadowBlur = 0;
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      let labelText = obj.label;
      if ((obj.type === "flask" || obj.type === "beaker" || obj.type === "test_tube") && obj.chemicals && obj.chemicals.length > 0) {
        labelText = obj.chemicals.map((c) => c.name).join("+");
      }
      ctx.fillText(labelText, 0, OBJECT_SIZE * 0.65);
      ctx.restore();
    }

    // Draw Thermodynamic Graph Overlay
    if (graphPointsRef.current.length > 1) {
      ctx.save();
      const gw = 200;
      const gh = 110;
      const gx = W - gw - 20;
      const gy = floorY - gh - 20;

      // Dark card glassmorphism
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
      ctx.lineWidth = 1.5;
      roundedRect(ctx, gx, gy, gw, gh, 8);
      ctx.fill();
      ctx.stroke();

      // Card Header
      ctx.fillStyle = "rgba(34, 211, 238, 0.9)";
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("THERMODYNAMIC TELEMETRY", gx + 10, gy + 18);

      const plotX = gx + 15;
      const plotY = gy + 28;
      const plotW = gw - 30;
      const plotH = gh - 45;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 0.8;
      for (let i = 0; i <= 4; i++) {
        const yLine = plotY + (i / 4) * plotH;
        ctx.beginPath();
        ctx.moveTo(plotX, yLine);
        ctx.lineTo(plotX + plotW, yLine);
        ctx.stroke();
      }

      const temps = graphPointsRef.current;
      const minTemp = 20;
      const maxTemp = Math.max(220, ...temps);

      // Plot smooth line
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < temps.length; i++) {
        const tx = plotX + (i / (temps.length - 1)) * plotW;
        const ty = plotY + plotH - ((temps[i] - minTemp) / (maxTemp - minTemp)) * plotH;
        if (i === 0) {
          ctx.moveTo(tx, ty);
        } else {
          const prevTx = plotX + ((i - 1) / (temps.length - 1)) * plotW;
          const prevTy = plotY + plotH - ((temps[i - 1] - minTemp) / (maxTemp - minTemp)) * plotH;
          const xc = (prevTx + tx) / 2;
          const yc = (prevTy + ty) / 2;
          ctx.quadraticCurveTo(prevTx, prevTy, xc, yc);
        }
      }
      if (temps.length > 1) {
        const lastIdx = temps.length - 1;
        const tx = plotX + (lastIdx / lastIdx) * plotW;
        const ty = plotY + plotH - ((temps[lastIdx] - minTemp) / (maxTemp - minTemp)) * plotH;
        ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // Plot gradient fill below
      ctx.lineTo(plotX + plotW, plotY + plotH);
      ctx.lineTo(plotX, plotY + plotH);
      ctx.closePath();
      const plotGrad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
      plotGrad.addColorStop(0, "rgba(34, 211, 238, 0.2)");
      plotGrad.addColorStop(1, "rgba(34, 211, 238, 0.0)");
      ctx.fillStyle = plotGrad;
      ctx.fill();

      // Current temp readout
      const currentTemp = temps[temps.length - 1];
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(currentTemp)}°C`, gx + gw - 10, gy + 18);
      ctx.restore();
    }

    animRef.current = requestAnimationFrame(animateFrame);
  }, [checkDropperSlot, runReactionEngine, handDataRef, spawnDroplet, spawnSmoke, cameraActive, glasswareSkin]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [animate]);

  /* ------- Mouse drag handlers ------- */
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = getPos(e);
    for (let i = objectsRef.current.length - 1; i >= 0; i--) {
      const obj = objectsRef.current[i];
      const dist = Math.hypot(obj.x - x, obj.y - y);
      if (dist < OBJECT_SIZE * 0.8) {
        dragRef.current = { id: obj.id, offX: obj.x - x, offY: obj.y - y };
        obj.grabbed = true; obj.vx = 0; obj.vy = 0;
        break;
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const { x, y } = getPos(e);
    const obj = objectsRef.current.find((o) => o.id === dragRef.current!.id);
    if (obj) {
      const newX = x + dragRef.current!.offX;
      const newY = y + dragRef.current!.offY;
      obj.vx = (newX - obj.x) * 15; obj.vy = (newY - obj.y) * 15;
      obj.x = newX; obj.y = newY;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      const obj = objectsRef.current.find((o) => o.id === dragRef.current!.id);
      if (obj) { obj.grabbed = false; obj.angularVel = (Math.random() - 0.5) * 0.5; }
      dragRef.current = null;
    }
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const { x, y } = getPos(e);
    for (const obj of objectsRef.current) {
      if (obj.type === "burner") {
        const dist = Math.hypot(obj.x - x, obj.y - y);
        if (dist < OBJECT_SIZE) { obj.flameOn = !obj.flameOn; break; }
      }
    }
  }, []);

  const spawnObject = useCallback((type: string, emoji: string, label: string, chemical?: Chemical) => {
    const { W, H } = sizeRef.current;
    const isContainer = type === "flask" || type === "beaker" || type === "test_tube";
    const obj: WorldObject = {
      id: genId(), type, emoji, label,
      x: W / 2 + (Math.random() - 0.5) * 200,
      y: H * 0.3 + (Math.random() - 0.5) * 50,
      vx: (Math.random() - 0.5) * 80, vy: 0,
      rotation: (Math.random() - 0.5) * 0.4,
      angularVel: (Math.random() - 0.5) * 0.3,
      grabbed: false, flameOn: false,
      chemical,
      chemicals: isContainer ? [] : undefined,
      reactionProgress: isContainer ? 0 : undefined,
      reacting: isContainer ? false : undefined,
      reactionId: isContainer ? null : undefined,
      liquidColor: isContainer ? null : undefined,
      liquidLevel: isContainer ? 0 : (chemical ? 1 : undefined),
      temperature: isContainer ? 25 : undefined,
      startTime: isContainer ? null : undefined,
      startTemp: isContainer ? 25 : undefined,
      peakTemp: isContainer ? 25 : undefined,
      cancelled: isContainer ? false : undefined,
      color: chemical?.color,
    };
    objectsRef.current = [...objectsRef.current, obj];
    onObjectsChange(objectsRef.current);
  }, [onObjectsChange]);

  const resetObjects = useCallback(() => {
    objectsRef.current = [];
    particlesRef.current = [];
    prevReportStatusRef.current = "idle";
    onObjectsChange([]);
  }, [onObjectsChange]);

  const cancelReaction = useCallback(() => {
    for (const obj of objectsRef.current) {
      if ((obj.type === "flask" || obj.type === "beaker" || obj.type === "test_tube") && obj.reacting) {
        obj.chemicals        = [];
        obj.reacting         = false;
        obj.reactionProgress = 0;
        obj.reactionId       = null;
        obj.startTime        = null;
        obj.liquidColor      = null;
        obj.liquidLevel      = 0;
      }
    }
    prevReportStatusRef.current = "idle";
  }, []);

  const removeObjectByType = useCallback((type: string) => {
    const idx = objectsRef.current.findLastIndex((o) => o.type === type);
    if (idx === -1) return;
    objectsRef.current = objectsRef.current.filter((_, i) => i !== idx);
    onObjectsChange([...objectsRef.current]);
  }, [onObjectsChange]);

  useImperativeHandle(ref, () => ({ spawnObject, resetObjects, removeObjectByType, cancelReaction }), [resetObjects, spawnObject, removeObjectByType, cancelReaction]);

  return (
    <div className={`sim-area ${cameraActive ? "has-camera" : ""}`} ref={containerRef}>
      {/* Camera Backdrop */}
      <div style={{
        visibility: cameraActive ? "visible" : "hidden",
        opacity: cameraActive ? 1 : 0,
        position: "absolute", inset: 0, zIndex: 1,
        background: "transparent",
        transition: "opacity 0.3s ease"
      }}>
        {bridgeFrameUrl ? (
          <img src={bridgeFrameUrl} alt="Camera feed"
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: 0.7 }} />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: 0.7 }} />
        )}
        <canvas ref={overlayCanvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
      </div>

      {cameraActive && (
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: "8px", zIndex: 100 }}>
          {handData.map((h, i) => (
            <span key={`hand_${i}_${h.label}`} className={`hand-tag ${h.pinching ? "pinching" : ""}`}>
              {h.label} {h.pinching ? "\u270A" : "\u{1F590}"}
            </span>
          ))}
        </div>
      )}

      <div className="sim-label" style={{ zIndex: 10 }}>Lab Simulation</div>
      <div className="sim-border" style={{ zIndex: 5 }}>
        <div className="sim-corner tl" />
        <div className="sim-corner tr" />
        <div className="sim-corner bl" />
        <div className="sim-corner br" />
      </div>
      <canvas
        ref={canvasRef} className="sim-canvas"
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: dragRef.current ? "grabbing" : "default", zIndex: 20 }}
      />
    </div>
  );
});

LabSimulation.displayName = "LabSimulation";
export default LabSimulation;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
