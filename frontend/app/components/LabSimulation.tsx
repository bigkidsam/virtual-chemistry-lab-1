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
  liquidLevel?: number;
  color?: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  type: "droplet" | "smoke";
  color: string;
  size: number;
}

interface Slot {
  x: number;
  y: number;
  chemicals: Chemical[];
  reactionProgress: number;
  reacting: boolean;
  liquidColor: string | null;
  liquidLevel: number;
}

interface LabSimulationProps {
  paused: boolean;
  objects: WorldObject[];
  onObjectsChange: (objs: WorldObject[]) => void;
  onReactionUpdate: (progress: number, temp: number, equation: string, status: "idle" | "reacting" | "complete") => void;
  handDataRef?: React.RefObject<HandData[]>;
  handData: HandData[];
  cameraActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  bridgeFrameUrl?: string | null;
}

export interface LabSimulationHandle {
  spawnObject: (type: string, emoji: string, label: string, chemical?: Chemical) => void;
  resetObjects: () => void;
  removeObjectByType: (type: string) => void;
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

const REACTION_EQUATIONS: Record<string, string> = {
  "hcl+naoh": "HCl + NaOH \u2192 NaCl + H\u2082O",
  "cuso4+naoh": "CuSO\u2084 + 2NaOH \u2192 Cu(OH)\u2082\u2193 + Na\u2082SO\u2084",
  "hcl+cuso4": "2HCl + CuSO\u2084 \u2192 CuCl\u2082 + H\u2082SO\u2084",
  default: "Reaction in progress...",
};

let objIdCounter = 0;
let particleIdCounter = 0;
const genId = () => `obj_${++objIdCounter}`;
const genParticleId = () => `p_${++particleIdCounter}`;

/* =========================================================
   DRAW TOOL SHAPES (realistic vector art)
   ========================================================= */
function drawToolShape(ctx: CanvasRenderingContext2D, obj: WorldObject, S: number, time: number, isCameraActive: boolean) {
  const hs = S * 0.45; // half-size

  switch (obj.type) {
    case "flask": {
      // Erlenmeyer flask
      const alpha = isCameraActive ? 0.7 : 0.5;
      const glassGrad = ctx.createLinearGradient(-hs, -hs, hs, hs);
      glassGrad.addColorStop(0, `rgba(180,220,255,${alpha})`);
      glassGrad.addColorStop(0.5, `rgba(200,235,255,${alpha * 0.7})`);
      glassGrad.addColorStop(1, `rgba(160,200,240,${alpha * 0.9})`);

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
      ctx.fillStyle = glassGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(150,210,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Flask rim
      ctx.beginPath();
      ctx.ellipse(0, -hs, hs * 0.3, hs * 0.08, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180,220,255,0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Liquid if chemical
      if (obj.chemical && obj.liquidLevel && obj.liquidLevel > 0) {
        const lh = hs * 1.2 * obj.liquidLevel;
        const ly = hs - lh;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-hs, ly, S, lh + hs * 0.1);
        ctx.clip();

        ctx.beginPath();
        ctx.moveTo(-hs * 0.9, hs * 0.7);
        ctx.quadraticCurveTo(-hs * 0.9, hs, -hs * 0.5, hs);
        ctx.lineTo(hs * 0.5, hs);
        ctx.quadraticCurveTo(hs * 0.9, hs, hs * 0.9, hs * 0.7);
        ctx.lineTo(hs * 0.25, -hs * 0.3);
        ctx.lineTo(-hs * 0.25, -hs * 0.3);
        ctx.closePath();
        ctx.fillStyle = (obj.color || "#3b82f6") + "88";
        ctx.fill();
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
      // Beaker shape
      const bGrad = ctx.createLinearGradient(-hs, -hs, hs, hs);
      bGrad.addColorStop(0, "rgba(180,220,255,0.3)");
      bGrad.addColorStop(1, "rgba(160,200,240,0.25)");

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
      ctx.fillStyle = bGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(150,210,255,0.5)";
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
      if (obj.chemical && obj.liquidLevel && obj.liquidLevel > 0) {
        const lh = hs * 1.5 * obj.liquidLevel;
        ctx.beginPath();
        ctx.rect(-hs * 0.75, hs - lh, hs * 1.5, lh);
        ctx.fillStyle = (obj.color || "#3b82f6") + "77";
        ctx.fill();
      }
      break;
    }

    case "test_tube": {
      // Test tube
      ctx.beginPath();
      ctx.moveTo(-hs * 0.2, -hs);
      ctx.lineTo(-hs * 0.2, hs * 0.6);
      ctx.quadraticCurveTo(-hs * 0.2, hs, 0, hs);
      ctx.quadraticCurveTo(hs * 0.2, hs, hs * 0.2, hs * 0.6);
      ctx.lineTo(hs * 0.2, -hs);
      ctx.closePath();
      ctx.fillStyle = "rgba(200,230,255,0.25)";
      ctx.fill();
      ctx.strokeStyle = "rgba(170,210,250,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rim
      ctx.beginPath();
      ctx.ellipse(0, -hs, hs * 0.25, hs * 0.06, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(200,230,255,0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Liquid
      if (obj.chemical && obj.liquidLevel && obj.liquidLevel > 0) {
        const lh = hs * 1.3 * obj.liquidLevel;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-hs * 0.2, hs - lh, hs * 0.4, lh + hs * 0.1);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(-hs * 0.2, hs * 0.6);
        ctx.quadraticCurveTo(-hs * 0.2, hs, 0, hs);
        ctx.quadraticCurveTo(hs * 0.2, hs, hs * 0.2, hs * 0.6);
        ctx.lineTo(hs * 0.2, -hs);
        ctx.lineTo(-hs * 0.2, -hs);
        ctx.closePath();
        ctx.fillStyle = (obj.color || "#3b82f6") + "88";
        ctx.fill();
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
      ctx.beginPath();
      ctx.moveTo(-hs * 0.25, -hs);
      ctx.lineTo(-hs * 0.3, hs * 0.85);
      ctx.quadraticCurveTo(-hs * 0.3, hs, 0, hs);
      ctx.quadraticCurveTo(hs * 0.3, hs, hs * 0.3, hs * 0.85);
      ctx.lineTo(hs * 0.25, -hs);
      ctx.closePath();
      ctx.fillStyle = "rgba(200,230,255,0.22)";
      ctx.fill();
      ctx.strokeStyle = "rgba(170,210,250,0.5)";
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
  handDataRef,
  handData,
  cameraActive,
  videoRef,
  overlayCanvasRef,
  bridgeFrameUrl,
}: LabSimulationProps, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const objectsRef = useRef<WorldObject[]>(objects);
  const particlesRef = useRef<Particle[]>([]);
  const slotsRef = useRef<Slot[]>([]);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const handGrabRef = useRef<Record<string, { id: string, offX: number, offY: number, wasPinching: boolean }>>({
    Left: { id: "", offX: 0, offY: 0, wasPinching: false },
    Right: { id: "", offX: 0, offY: 0, wasPinching: false }
  });
  const pausedRef = useRef(paused);
  const sizeRef = useRef({ W: 0, H: 0 });

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { objectsRef.current = objects; }, [objects]);

  const initSlots = useCallback((W: number, H: number) => {
    const totalW = SLOT_COUNT * SLOT_W + (SLOT_COUNT - 1) * SLOT_GAP;
    const startX = (W - totalW) / 2;
    const slotY = H - FLOOR_PAD + 10;
    slotsRef.current = Array.from({ length: SLOT_COUNT }, (_, i) => ({
      x: startX + i * (SLOT_W + SLOT_GAP),
      y: slotY,
      chemicals: [],
      reactionProgress: 0,
      reacting: false,
      liquidColor: null,
      liquidLevel: 0,
    }));
  }, []);

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
      initSlots(W, H);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [initSlots]);

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

  const checkReactions = useCallback((dt: number) => {
    let topEquation = "No active reaction";
    let topStatus: "idle" | "reacting" | "complete" = "idle";
    let topProgress = 0;
    let topTemp = 25;

    for (const slot of slotsRef.current) {
      if (slot.chemicals.length >= 2 && !slot.reacting) {
        slot.reacting = true;
        slot.reactionProgress = 0;
        spawnSmoke(slot.x + SLOT_W / 2, slot.y);
      }
      if (slot.reacting) {
        slot.reactionProgress = Math.min(1, slot.reactionProgress + dt * 0.25);
        const ids = slot.chemicals.map((c) => c.id).sort().join("+");
        const eq = REACTION_EQUATIONS[ids] ?? REACTION_EQUATIONS.default;
        const temp = Math.round(25 + slot.reactionProgress * 75);
        if (slot.reactionProgress > topProgress) {
          topProgress = slot.reactionProgress;
          topEquation = eq;
          topTemp = temp;
          topStatus = slot.reactionProgress >= 1 ? "complete" : "reacting";
        }
        if (slot.reactionProgress >= 1) {
          slot.reacting = false;
          slot.chemicals = [];
          slot.liquidLevel = 0;
          slot.liquidColor = null;
        }
      }
    }
    onReactionUpdate(topProgress, topTemp, topEquation, topStatus);
  }, [onReactionUpdate, spawnSmoke]);

  const checkDropperSlot = useCallback(() => {
    for (const obj of objectsRef.current) {
      if (obj.type !== "dropper" || !obj.chemical) continue;
      for (const slot of slotsRef.current) {
        const cx = slot.x + SLOT_W / 2;
        const cy = slot.y + SLOT_H / 2;
        const dist = Math.hypot(obj.x - cx, obj.y - cy);
        if (dist < SLOT_W * 0.8) {
          const already = slot.chemicals.find((c) => c.id === obj.chemical!.id);
          if (!already) {
            slot.chemicals = [...slot.chemicals, obj.chemical];
            slot.liquidColor = obj.chemical.color;
            slot.liquidLevel = Math.min(1, slot.liquidLevel + 0.35);
            spawnDroplet(obj.x, obj.y + OBJECT_SIZE / 2, obj.chemical.color);
          }
        }
      }
    }
  }, [spawnDroplet]);

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
        if (obj.type === "burner" && obj.flameOn && Math.random() < 0.12) {
          spawnSmoke(obj.x, obj.y - OBJECT_SIZE * 0.8);
        }
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx * dt;
        if (p.type === "droplet") { p.vy += 400 * dt; p.y += p.vy * dt; p.life -= dt * 1.2; }
        else { p.y += p.vy * dt; p.x += Math.sin(p.y * 0.05) * 0.5; p.life -= dt * 0.5; }
        return p.life > 0;
      });

      checkDropperSlot();
      checkReactions(dt);
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

    // Draw slots
    for (const slot of slotsRef.current) {
      const isReacting = slot.reacting;
      ctx.strokeStyle = isReacting
        ? `rgba(244,63,94,${0.4 + 0.4 * Math.sin(time * 0.008)})`
        : slot.chemicals.length > 0 ? "rgba(20,184,166,0.5)" : "rgba(245,158,11,0.2)";
      ctx.lineWidth = isReacting ? 2 : 1;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(slot.x, slot.y, SLOT_W, SLOT_H);
      ctx.setLineDash([]);
      ctx.fillStyle = isReacting
        ? `rgba(244,63,94,${0.04 + 0.04 * Math.sin(time * 0.008)})`
        : slot.chemicals.length > 0 ? "rgba(20,184,166,0.04)" : "rgba(245,158,11,0.02)";
      ctx.fillRect(slot.x, slot.y, SLOT_W, SLOT_H);
      if (slot.liquidColor && slot.liquidLevel > 0) {
        const lH = slot.liquidLevel * (SLOT_H - 4);
        const lY = slot.y + SLOT_H - lH - 2;
        ctx.fillStyle = slot.liquidColor + "99";
        roundedRect(ctx, slot.x + 2, lY, SLOT_W - 4, lH, 4);
        ctx.fill();
      }
      if (slot.chemicals.length === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SLOT", slot.x + SLOT_W / 2, slot.y + SLOT_H / 2 + 3);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "bold 10px Space Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(slot.chemicals.map((c) => c.name).join("+"), slot.x + SLOT_W / 2, slot.y + 16);
      }
    }

    // Draw particles
    for (const p of particlesRef.current) {
      ctx.globalAlpha = p.life;
      if (p.type === "droplet") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const smoke = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        smoke.addColorStop(0, "rgba(148,163,184,0.4)");
        smoke.addColorStop(1, "rgba(148,163,184,0)");
        ctx.fillStyle = smoke;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Draw world objects with realistic tool shapes
    for (const obj of objectsRef.current) {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation);
      if (obj.grabbed) { ctx.shadowColor = "rgba(245,158,11,0.7)"; ctx.shadowBlur = 20; }
      drawToolShape(ctx, obj, OBJECT_SIZE, time, cameraActive);
      ctx.shadowBlur = 0;
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.label, 0, OBJECT_SIZE * 0.65);
      ctx.restore();
    }

    animRef.current = requestAnimationFrame(animateFrame);
  }, [checkDropperSlot, checkReactions, handDataRef, spawnDroplet, spawnSmoke, cameraActive]);

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
    const obj: WorldObject = {
      id: genId(), type, emoji, label,
      x: W / 2 + (Math.random() - 0.5) * 200,
      y: H * 0.3 + (Math.random() - 0.5) * 50,
      vx: (Math.random() - 0.5) * 80, vy: 0,
      rotation: (Math.random() - 0.5) * 0.4,
      angularVel: (Math.random() - 0.5) * 0.3,
      grabbed: false, flameOn: false,
      chemical, liquidLevel: chemical ? 1 : undefined,
      color: chemical?.color,
    };
    objectsRef.current = [...objectsRef.current, obj];
    onObjectsChange(objectsRef.current);
  }, [onObjectsChange]);

  const resetObjects = useCallback(() => {
    objectsRef.current = [];
    particlesRef.current = [];
    for (const slot of slotsRef.current) {
      slot.chemicals = []; slot.reactionProgress = 0; slot.reacting = false;
      slot.liquidColor = null; slot.liquidLevel = 0;
    }
    onObjectsChange([]);
  }, [onObjectsChange]);

  const removeObjectByType = useCallback((type: string) => {
    const idx = objectsRef.current.findLastIndex((o) => o.type === type);
    if (idx === -1) return;
    objectsRef.current = objectsRef.current.filter((_, i) => i !== idx);
    onObjectsChange([...objectsRef.current]);
  }, [onObjectsChange]);

  useImperativeHandle(ref, () => ({ spawnObject, resetObjects, removeObjectByType }), [resetObjects, spawnObject, removeObjectByType]);

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
          {handData.map((h) => (
            <span key={h.label} className={`hand-tag ${h.pinching ? "pinching" : ""}`}>
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
