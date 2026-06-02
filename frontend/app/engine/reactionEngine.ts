/**
 * reactionEngine.ts — Pure TypeScript real-time reaction engine.
 *
 * No React. No side effects. Call tickEngine() once per animation frame
 * from LabSimulation.tsx and apply the returned slot states + reports.
 *
 * Architecture:
 *   LabSimulation (canvas loop, 60 fps)
 *     └── tickEngine(slots, objects, dt, now)
 *           └── reactions.ts registry (pure data)
 *     └── returns EngineOutput → onReactionUpdate(ActiveReport)
 */

import { CHEMICALS } from "../data/chemicals";
import type { Chemical } from "../data/chemicals";
import { findReaction } from "../data/reactions";
import type { ReactionProduct } from "../data/reactions";

/** Convert a ReactionProduct into a Chemical object (looks up registry or builds dynamic) */
function getChemicalFromProduct(prod: ReactionProduct): Chemical {
  const formulaLower = prod.formula.toLowerCase().replace("↓", "").trim();
  const match = CHEMICALS.find(
    (c) => c.formula.toLowerCase() === formulaLower || c.name.toLowerCase() === formulaLower
  );
  if (match) return match;

  return {
    id: formulaLower.replace(/[^a-z0-9]/g, ""),
    name: prod.formula,
    fullName: prod.name,
    colorName: "Product",
    color: prod.color,
    state: prod.formula.includes("↓") ? "Solid" : "Liquid",
    temp: "25°C",
    formula: prod.formula,
    category: "Salt",
    emoji: prod.emoji,
  };
}


/* ================================================================
   SHARED TYPES (exported so LabSimulation and RightPanel can use them)
   ================================================================ */

/** Minimal object info the engine needs from WorldObject */
export interface EngineObject {
  x: number;
  y: number;
  type: string;
  flameOn?: boolean;
}

/** Per-slot simulation state — replaces the local Slot type in LabSimulation */
export interface SlotState {
  // Layout (set once during init, never changed by engine)
  x: number;
  y: number;

  // Chemistry
  chemicals: Chemical[];
  reactionProgress: number; // 0–1
  reacting: boolean;
  reactionId: string | null;
  liquidColor: string | null;
  liquidLevel: number;

  // Thermal
  temperature: number; // °C, current

  // Engine bookkeeping
  startTime: number | null;  // ms timestamp when reaction began
  startTemp: number;         // °C at reaction start
  peakTemp: number;          // highest temperature reached
  cancelled: boolean;        // true for one frame after cancellation
  burst?: boolean;           // true if slot glassware exploded due to overheating
}

/** Full live report surfaced to the UI each frame */
export interface ActiveReport {
  equation: string;
  type: string;
  status: "idle" | "reacting" | "complete" | "heat-required";
  progress: number;       // 0–1
  temperature: number;    // current °C (whole number)
  startTemp: number;      // °C at start
  peakTemp: number;       // max °C reached
  durationMs: number;     // elapsed ms since reaction started
  products: ReactionProduct[];
  reactantIds: string[];
  objectCount: number;    // total objects in scene
  slotIndex: number;      // which slot is most active
}

/** Snapshot emitted when a reaction finishes */
export interface CompletedReport {
  equation: string;
  type: string;
  durationMs: number;
  products: ReactionProduct[];
  peakTemp: number;
}

/** Returned by tickEngine() every frame */
export interface EngineOutput {
  slots: SlotState[];
  activeReport: ActiveReport;
  lastCompletedReport: CompletedReport | null;
  /** Indices of slots that *just started* reacting (use to spawn smoke) */
  newlyStartedSlots: number[];
  /** Indices of slots whose reaction was cancelled this frame */
  cancelledSlots: number[];
}

/* ================================================================
   CONSTANTS
   ================================================================ */
const SLOT_W = 90;
const SLOT_H = 60;
const BURNER_PROXIMITY = SLOT_W * 1.5; // px — how close a burner counts

/* ================================================================
   HELPERS
   ================================================================ */

/** Blend two hex colors: ratio=0 → c1, ratio=1 → c2 */
function blendHex(c1: string, c2: string, ratio: number): string {
  const parse = (c: string) => {
    const raw = c.replace("#", "");
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  };
  try {
    const a = parse(c1);
    const b = parse(c2);
    const lerp = (x: number, y: number) => Math.round(x + (y - x) * ratio);
    const hex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${hex(lerp(a.r, b.r))}${hex(lerp(a.g, b.g))}${hex(lerp(a.b, b.b))}`;
  } catch {
    return c1;
  }
}

/** Calculate standard pH value (1.0 to 14.0) based on chemical counts */
export function calculatePH(chemicals: Chemical[]): number {
  if (!chemicals || chemicals.length === 0) return 7.0;

  let strongAcidCount = 0;
  let weakAcidCount = 0;
  let strongBaseCount = 0;
  let weakBaseCount = 0;

  for (const chem of chemicals) {
    if (chem.category === "Acid") {
      if (["hcl", "h2so4", "hno3", "hbr", "hi", "hclo4"].includes(chem.id)) {
        strongAcidCount++;
      } else {
        weakAcidCount++;
      }
    } else if (chem.category === "Base") {
      if (["naoh", "koh", "ca_oh_2", "lioh", "ba_oh_2", "csoh", "rboh"].includes(chem.id)) {
        strongBaseCount++;
      } else {
        weakBaseCount++;
      }
    }
  }

  let pH = 7.0;
  const acidFactor = strongAcidCount * 3.0 + weakAcidCount * 1.5;
  const baseFactor = strongBaseCount * 3.0 + weakBaseCount * 1.5;

  if (acidFactor > baseFactor) {
    pH = 7.0 - (acidFactor - baseFactor);
  } else if (baseFactor > acidFactor) {
    pH = 7.0 + (baseFactor - acidFactor);
  }

  return Math.max(1.0, Math.min(14.0, pH));
}

/** Blend hex colors of all chemicals present in the container */
export function blendChemicalColors(chemicals: Chemical[]): string {
  if (chemicals.length === 0) return "#93c5fd"; // water default
  const activeChems = chemicals.filter((c) => c.id !== "h2o");
  const list = activeChems.length > 0 ? activeChems : chemicals;

  let rSum = 0, gSum = 0, bSum = 0;
  for (const chem of list) {
    try {
      const raw = chem.color.replace("#", "");
      rSum += parseInt(raw.slice(0, 2), 16);
      gSum += parseInt(raw.slice(2, 4), 16);
      bSum += parseInt(raw.slice(4, 6), 16);
    } catch {
      rSum += 147; gSum += 197; bSum += 253; // default light blue
    }
  }
  const avgR = Math.round(rSum / list.length);
  const avgG = Math.round(gSum / list.length);
  const avgB = Math.round(bSum / list.length);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(avgR)}${hex(avgG)}${hex(avgB)}`;
}

/** Determine visual color of the liquid based on pH and present indicators */
export function getIndicatorColor(chemicals: Chemical[], pH: number): string | null {
  const hasPhenol = chemicals.some((c) => c.id === "phenolphthalein");
  const hasLitmus = chemicals.some((c) => c.id === "litmus");
  const hasUniversal = chemicals.some((c) => c.id === "universal_indicator");

  if (hasUniversal) {
    if (pH <= 3) return "#ef4444"; // red
    if (pH <= 5) return "#fb923c"; // orange
    if (pH <= 6) return "#facc15"; // yellow
    if (pH <= 7.5) return "#22c55e"; // green
    if (pH <= 9) return "#06b6d4"; // cyan
    if (pH <= 11) return "#3b82f6"; // blue
    return "#a855f7"; // purple
  }

  if (hasPhenol) {
    return pH >= 8.2 ? "#f472b6" : "#e2e8f0"; // pink or colorless/white-gray tint
  }

  if (hasLitmus) {
    if (pH < 4.5) return "#ef4444"; // red
    if (pH > 8.3) return "#3b82f6"; // blue
    return "#a78bfa"; // purple
  }

  return null;
}

/** Is a lit burner close enough to heat the slot? */
function isSlotHeated(slot: SlotState, objects: EngineObject[]): boolean {
  const cx = slot.x;
  const cy = slot.y;
  return objects.some(
    (o) => o.type === "burner" && o.flameOn && Math.hypot(o.x - cx, o.y - cy) < BURNER_PROXIMITY
  );
}

/** Build an idle/default report */
function idleReport(objectCount: number): ActiveReport {
  return {
    equation:    "No active reaction",
    type:        "generic",
    status:      "idle",
    progress:    0,
    temperature: 25,
    startTemp:   25,
    peakTemp:    25,
    durationMs:  0,
    products:    [],
    reactantIds: [],
    objectCount,
    slotIndex:   -1,
  };
}

/* ================================================================
   CORE TICK FUNCTION
   ================================================================ */

/**
 * Process one simulation tick for all slots.
 *
 * @param slots        Current mutable slot states
 * @param objects      World objects (burners, droppers, flasks, …)
 * @param dt           Delta time in seconds (capped at 0.05)
 * @param now          Current timestamp in ms (use performance.now())
 */
export function tickEngine(
  slots: SlotState[],
  objects: EngineObject[],
  dt: number,
  now: number
): EngineOutput {
  const newlyStartedSlots: number[] = [];
  const cancelledSlots: number[]   = [];
  let lastCompletedReport: CompletedReport | null = null;

  const candidateReports: Array<{ report: ActiveReport; progress: number }> = [];

  const updatedSlots: SlotState[] = slots.map((rawSlot, slotIndex) => {
    // Work on a shallow copy so we don't mutate the caller's array
    const s: SlotState = { ...rawSlot };
    s.cancelled = false;

    const heated = isSlotHeated(s, objects);

    /* ---- 1. Thermal dynamics ---- */
    const targetTemp = heated ? 185 : 25;
    s.temperature = s.temperature + (targetTemp - s.temperature) * dt * 0.5;
    // Clamp to reasonable range
    s.temperature = Math.max(20, Math.min(300, s.temperature));

    // Overheating thermal safety hazard
    s.burst = false;
    if (s.temperature > 220) {
      s.burst = true;
      s.chemicals = [];
      s.reacting = false;
      s.reactionProgress = 0;
      s.reactionId = null;
      s.startTime = null;
      s.liquidColor = null;
      s.liquidLevel = 0;
      s.temperature = 25; // reset
      return s;
    }

    // Liquid color updates for non-reacting slots
    if (!s.reacting && s.chemicals.length > 0) {
      const currentPH = calculatePH(s.chemicals);
      const indicatorCol = getIndicatorColor(s.chemicals, currentPH);
      s.liquidColor = indicatorCol || blendChemicalColors(s.chemicals);
    }

    /* ---- 1.5 Physical Evaporation ---- */
    if (s.temperature > 95 && s.liquidLevel > 0) {
      const evapRate = dt * 0.04 * (s.temperature / 100);
      s.liquidLevel = Math.max(0, s.liquidLevel - evapRate);
      if (s.liquidLevel === 0) {
        s.liquidColor = null;
        s.chemicals = [];
        s.reacting = false;
        s.reactionId = null;
        s.startTime = null;
        s.reactionProgress = 0;
      }
    }

    /* ---- 2. Cancellation detection ---- */
    if (s.reacting && s.chemicals.length < 2) {
      s.reacting       = false;
      s.reactionProgress = 0;
      s.reactionId     = null;
      s.startTime      = null;
      s.liquidColor    = null;
      s.liquidLevel    = Math.max(0, s.liquidLevel - 0.3);
      s.cancelled      = true;
      cancelledSlots.push(slotIndex);
      return s;
    }

    /* ---- 3. Find matching reaction ---- */
    if (s.chemicals.length < 2) return s;

    const reaction = findReaction(s.chemicals.map((c) => c.id));

    /* ---- 4. Heat-required waiting state ---- */
    if (reaction && reaction.requiresHeat && !heated && !s.reacting) {
      candidateReports.push({
        report: {
          equation:    reaction.equation,
          type:        reaction.type,
          status:      "heat-required",
          progress:    0,
          temperature: Math.round(s.temperature),
          startTemp:   Math.round(s.temperature),
          peakTemp:    Math.round(s.peakTemp ?? s.temperature),
          durationMs:  0,
          products:    reaction.products,
          reactantIds: s.chemicals.map((c) => c.id),
          objectCount: objects.length,
          slotIndex,
        },
        progress: 0,
      });
      return s;
    }

    /* ---- 5. Trigger new reaction ---- */
    if (!s.reacting && reaction) {
      const tempOk = s.temperature >= reaction.minTemp;
      const heatOk = !reaction.requiresHeat || heated;

      if (tempOk && heatOk) {
        s.reacting         = true;
        s.reactionProgress = 0;
        s.reactionId       = reaction.id;
        s.startTime        = now;
        s.startTemp        = s.temperature;
        s.peakTemp         = s.temperature;
        newlyStartedSlots.push(slotIndex);
      } else {
        return s; // Not ready yet
      }
    }

    /* ---- 6. Advance reaction ---- */
    if (s.reacting && reaction) {
      const stirred = objects.some(
        (o) => o.type === "rod" && Math.hypot(o.x - s.x, o.y - s.y) < SLOT_W * 1.5
      );
      const speedMult = (heated ? 2.5 : 1.0) * (stirred ? 2.0 : 1.0);
      s.reactionProgress = Math.min(
        1,
        s.reactionProgress + (dt / reaction.durationSec) * speedMult
      );

      // Temperature contribution from exothermic/endothermic reaction
      // Scale deltaH so max contribution ≈ 80°C at ΔH = -100 kJ/mol
      const tempContrib = (-reaction.deltaH / 100) * 80 * s.reactionProgress;
      const reactionTemp = s.startTemp + Math.max(0, tempContrib);
      if (reactionTemp > s.temperature) s.temperature = reactionTemp;
      s.peakTemp = Math.max(s.peakTemp, s.temperature);

      // Liquid color blend: reactant mix → product color
      if (s.chemicals.length >= 2 && reaction.productColor) {
        const currentPH = calculatePH(s.chemicals);
        const indicatorCol = getIndicatorColor(s.chemicals, currentPH);
        if (indicatorCol) {
          s.liquidColor = indicatorCol;
        } else {
          const c1 = s.chemicals[0].color;
          const c2 = s.chemicals[1]?.color ?? c1;
          const startColor = blendHex(c1, c2, 0.5);
          s.liquidColor = blendHex(startColor, reaction.productColor, s.reactionProgress);
        }
      }
      s.liquidLevel = Math.min(1, s.liquidLevel + 0.005 * dt * 60);

      const elapsed = now - (s.startTime ?? now);
      const status  = s.reactionProgress >= 1 ? "complete" : "reacting";

      candidateReports.push({
        report: {
          equation:    reaction.equation,
          type:        reaction.type,
          status,
          progress:    s.reactionProgress,
          temperature: Math.round(s.temperature),
          startTemp:   Math.round(s.startTemp),
          peakTemp:    Math.round(s.peakTemp),
          durationMs:  elapsed,
          products:    reaction.products,
          reactantIds: s.chemicals.map((c) => c.id),
          objectCount: objects.length,
          slotIndex,
        },
        progress: s.reactionProgress,
      });

      /* ---- 7. Completion ---- */
      if (s.reactionProgress >= 1) {
        lastCompletedReport = {
          equation:   reaction.equation,
          type:       reaction.type,
          durationMs: elapsed,
          products:   reaction.products,
          peakTemp:   Math.round(s.peakTemp),
        };

        // Consume reactants and replace them with products, keeping spectators
        const reactantIds = reaction.reactantIds;
        const spectators = s.chemicals.filter((c) => !reactantIds.includes(c.id));
        const products = reaction.products.map(getChemicalFromProduct);
        s.chemicals = [...spectators, ...products];

        s.reacting         = false;
        s.reactionId       = null;
        s.startTime        = null;
        s.reactionProgress = 0;

        const finalPH = calculatePH(s.chemicals);
        const indicatorCol = getIndicatorColor(s.chemicals, finalPH);
        s.liquidColor = indicatorCol || reaction.productColor;
      }
    }

    return s;
  });

  /* ---- 8. Select the most active slot's report ---- */
  candidateReports.sort((a, b) => b.progress - a.progress);
  const best = candidateReports[0];

  const activeReport: ActiveReport = best
    ? { ...best.report, objectCount: objects.length }
    : idleReport(objects.length);

  return {
    slots:               updatedSlots,
    activeReport,
    lastCompletedReport,
    newlyStartedSlots,
    cancelledSlots,
  };
}

/** Create a blank SlotState for a given position */
export function makeSlotState(x: number, y: number): SlotState {
  return {
    x, y,
    chemicals:         [],
    reactionProgress:  0,
    reacting:          false,
    reactionId:        null,
    liquidColor:       null,
    liquidLevel:       0,
    temperature:       25,
    startTime:         null,
    startTemp:         25,
    peakTemp:          25,
    cancelled:         false,
    burst:             false,
  };
}
