/**
 * Reaction Registry — 20+ reactions for the Virtual Chemistry Lab
 *
 * Lookup key = sorted chemical IDs joined with "+".
 * Example: mixing "hcl" + "naoh" → key "hcl+naoh"
 *
 * deltaH: kJ/mol  (negative = exothermic → temperature rises)
 * durationSec: seconds to complete at 1× speed (×2 when heated)
 */

export interface ReactionProduct {
  name: string;
  formula: string;
  color: string;
  emoji: string;
}

export type ReactionType =
  | "neutralization"
  | "precipitation"
  | "synthesis"
  | "decomposition"
  | "displacement"
  | "combustion"
  | "generic";

export interface ReactionRecord {
  id: string;
  /** Sorted reactant chemical IDs joined with "+" — used as lookup key */
  key: string;
  reactantIds: string[];
  products: ReactionProduct[];
  equation: string;
  type: ReactionType;
  /** kJ/mol — negative = exothermic (temp rises), positive = endothermic */
  deltaH: number;
  /** Whether a lit Bunsen burner is required to initiate */
  requiresHeat: boolean;
  /** Minimum slot temperature (°C) before reaction triggers */
  minTemp: number;
  /** Nominal seconds to complete at 1× speed */
  durationSec: number;
  /** CSS hex color of the final product liquid */
  productColor: string;
  /** Short description for the Reaction Library sidebar */
  description: string;
}

/* ================================================================
   REACTION REGISTRY
   Key = sorted chemical IDs joined with "+"
   ================================================================ */
export const REACTION_REGISTRY: Record<string, ReactionRecord> = {

  /* ---- Acid-Base Neutralizations ---- */

  "hcl+naoh": {
    id: "hcl_naoh", key: "hcl+naoh",
    reactantIds: ["hcl", "naoh"],
    products: [
      { name: "Sodium Chloride", formula: "NaCl",  color: "#f1f5f9", emoji: "🧂" },
      { name: "Water",           formula: "H₂O",   color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "HCl + NaOH → NaCl + H₂O",
    type:        "neutralization",
    deltaH:      -57.3,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#22d3ee",
    description:  "Strong acid-base neutralisation → saltwater",
  },

  "h2+o2": {
    id: "h2_o2", key: "h2+o2",
    reactantIds: ["h2", "o2"],
    products: [
      { name: "Water", formula: "H₂O", color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "2H₂ + O₂ → 2H₂O",
    type:        "synthesis",
    deltaH:      -483.6,
    requiresHeat: true,
    minTemp:      80,
    durationSec:  7,
    productColor: "#93c5fd",
    description:  "Highly exothermic synthesis of water from gases",
  },

  "agno3+nacl": {
    id: "agno3_nacl", key: "agno3+nacl",
    reactantIds: ["agno3", "nacl"],
    products: [
      { name: "Silver Chloride (precipitate)", formula: "AgCl↓",  color: "#ffffff", emoji: "🤍" },
      { name: "Sodium Nitrate",                formula: "NaNO₃",  color: "#e2e8f0", emoji: "🩶" },
    ],
    equation:    "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
    type:        "precipitation",
    deltaH:      -65.5,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  4,
    productColor: "#f8fafc",
    description:  "Double displacement → white AgCl precipitate",
  },

  "cuso4+naoh": {
    id: "cuso4_naoh", key: "cuso4+naoh",
    reactantIds: ["cuso4", "naoh"],
    products: [
      { name: "Copper(II) Hydroxide (ppt.)", formula: "Cu(OH)₂↓", color: "#60a5fa", emoji: "💙" },
      { name: "Sodium Sulfate",              formula: "Na₂SO₄",   color: "#e2e8f0", emoji: "🩶" },
    ],
    equation:    "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄",
    type:        "precipitation",
    deltaH:      -45.2,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#2dd4bf",
    description:  "Vivid blue Cu(OH)₂ precipitate formation",
  },

  "h2so4+naoh": {
    id: "h2so4_naoh", key: "h2so4+naoh",
    reactantIds: ["h2so4", "naoh"],
    products: [
      { name: "Sodium Sulfate", formula: "Na₂SO₄", color: "#e2e8f0", emoji: "🩶" },
      { name: "Water",          formula: "H₂O",    color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O",
    type:        "neutralization",
    deltaH:      -112.4,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#a5f3fc",
    description:  "Diprotic acid fully neutralised — highly exothermic",
  },

  "ch3cooh+naoh": {
    id: "ch3cooh_naoh", key: "ch3cooh+naoh",
    reactantIds: ["ch3cooh", "naoh"],
    products: [
      { name: "Sodium Acetate", formula: "CH₃COONa", color: "#fef3c7", emoji: "🧪" },
      { name: "Water",          formula: "H₂O",      color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "CH₃COOH + NaOH → CH₃COONa + H₂O",
    type:        "neutralization",
    deltaH:      -55.8,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  6,
    productColor: "#d9f99d",
    description:  "Weak acid-strong base (vinegar + lye)",
  },

  "hno3+koh": {
    id: "hno3_koh", key: "hno3+koh",
    reactantIds: ["hno3", "koh"],
    products: [
      { name: "Potassium Nitrate", formula: "KNO₃", color: "#f1f5f9", emoji: "🩶" },
      { name: "Water",             formula: "H₂O",  color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "HNO₃ + KOH → KNO₃ + H₂O",
    type:        "neutralization",
    deltaH:      -57.0,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#bbf7d0",
    description:  "Nitric acid + potassium hydroxide → saltpeter",
  },

  "ba_oh_2+h2so4": {
    id: "ba_oh_2_h2so4", key: "ba_oh_2+h2so4",
    reactantIds: ["ba_oh_2", "h2so4"],
    products: [
      { name: "Barium Sulfate (ppt.)", formula: "BaSO₄↓", color: "#f8fafc", emoji: "🤍" },
      { name: "Water",                 formula: "H₂O",    color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "Ba(OH)₂ + H₂SO₄ → BaSO₄↓ + 2H₂O",
    type:        "precipitation",
    deltaH:      -180.0,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  4,
    productColor: "#e0f2fe",
    description:  "Classic precipitation — sparingly soluble BaSO₄",
  },

  "hcl+koh": {
    id: "hcl_koh", key: "hcl+koh",
    reactantIds: ["hcl", "koh"],
    products: [
      { name: "Potassium Chloride", formula: "KCl", color: "#f1f5f9", emoji: "🪨" },
      { name: "Water",              formula: "H₂O", color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "HCl + KOH → KCl + H₂O",
    type:        "neutralization",
    deltaH:      -57.3,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#e2e8f0",
    description:  "Strong acid-strong base neutralisation",
  },

  "feso4+naoh": {
    id: "feso4_naoh", key: "feso4+naoh",
    reactantIds: ["feso4", "naoh"],
    products: [
      { name: "Iron(II) Hydroxide (ppt.)", formula: "Fe(OH)₂↓", color: "#86efac", emoji: "💚" },
      { name: "Sodium Sulfate",            formula: "Na₂SO₄",   color: "#e2e8f0", emoji: "🩶" },
    ],
    equation:    "FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄",
    type:        "precipitation",
    deltaH:      -40.0,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#4ade80",
    description:  "Green Fe(OH)₂ precipitate — oxidises to rust over time",
  },

  "hcl+mg_oh_2": {
    id: "hcl_mg_oh_2", key: "hcl+mg_oh_2",
    reactantIds: ["hcl", "mg_oh_2"],
    products: [
      { name: "Magnesium Chloride", formula: "MgCl₂", color: "#e2e8f0", emoji: "🩶" },
      { name: "Water",              formula: "H₂O",   color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "2HCl + Mg(OH)₂ → MgCl₂ + 2H₂O",
    type:        "neutralization",
    deltaH:      -109.6,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#bfdbfe",
    description:  "Antacid chemistry — acid-base reaction",
  },

  "agno3+kcl": {
    id: "agno3_kcl", key: "agno3+kcl",
    reactantIds: ["agno3", "kcl"],
    products: [
      { name: "Silver Chloride (ppt.)", formula: "AgCl↓", color: "#ffffff", emoji: "🤍" },
      { name: "Potassium Nitrate",      formula: "KNO₃",  color: "#f1f5f9", emoji: "🩶" },
    ],
    equation:    "AgNO₃ + KCl → AgCl↓ + KNO₃",
    type:        "precipitation",
    deltaH:      -65.5,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  4,
    productColor: "#f0f9ff",
    description:  "Double displacement — milky AgCl precipitate",
  },

  "ch3cooh+koh": {
    id: "ch3cooh_koh", key: "ch3cooh+koh",
    reactantIds: ["ch3cooh", "koh"],
    products: [
      { name: "Potassium Acetate", formula: "CH₃COOK", color: "#fef9c3", emoji: "🧪" },
      { name: "Water",             formula: "H₂O",     color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "CH₃COOH + KOH → CH₃COOK + H₂O",
    type:        "neutralization",
    deltaH:      -55.8,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  6,
    productColor: "#fef08a",
    description:  "Weak acid-strong base neutralisation",
  },

  "hcl+lioh": {
    id: "hcl_lioh", key: "hcl+lioh",
    reactantIds: ["hcl", "lioh"],
    products: [
      { name: "Lithium Chloride", formula: "LiCl", color: "#e2e8f0", emoji: "🩶" },
      { name: "Water",            formula: "H₂O",  color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "HCl + LiOH → LiCl + H₂O",
    type:        "neutralization",
    deltaH:      -57.3,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#e0f2fe",
    description:  "Lithium-based neutralisation",
  },

  "h2co3+naoh": {
    id: "h2co3_naoh", key: "h2co3+naoh",
    reactantIds: ["h2co3", "naoh"],
    products: [
      { name: "Sodium Carbonate", formula: "Na₂CO₃", color: "#e2e8f0", emoji: "🩶" },
      { name: "Water",            formula: "H₂O",    color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "H₂CO₃ + 2NaOH → Na₂CO₃ + 2H₂O",
    type:        "neutralization",
    deltaH:      -47.1,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  6,
    productColor: "#a5f3fc",
    description:  "Carbonic acid neutralisation — CO₂ bubbles released",
  },

  "hno3+naoh": {
    id: "hno3_naoh", key: "hno3+naoh",
    reactantIds: ["hno3", "naoh"],
    products: [
      { name: "Sodium Nitrate", formula: "NaNO₃", color: "#e2e8f0", emoji: "🩶" },
      { name: "Water",          formula: "H₂O",   color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "HNO₃ + NaOH → NaNO₃ + H₂O",
    type:        "neutralization",
    deltaH:      -57.0,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#bfdbfe",
    description:  "Nitric acid + caustic soda neutralisation",
  },

  "hf+naoh": {
    id: "hf_naoh", key: "hf+naoh",
    reactantIds: ["hf", "naoh"],
    products: [
      { name: "Sodium Fluoride", formula: "NaF", color: "#f1f5f9", emoji: "🩶" },
      { name: "Water",           formula: "H₂O", color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "HF + NaOH → NaF + H₂O",
    type:        "neutralization",
    deltaH:      -68.6,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#e0f2fe",
    description:  "Hydrofluoric acid neutralisation — highly exothermic",
  },

  "h3po4+naoh": {
    id: "h3po4_naoh", key: "h3po4+naoh",
    reactantIds: ["h3po4", "naoh"],
    products: [
      { name: "Trisodium Phosphate", formula: "Na₃PO₄", color: "#e2e8f0", emoji: "🩶" },
      { name: "Water",               formula: "H₂O",    color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "H₃PO₄ + 3NaOH → Na₃PO₄ + 3H₂O",
    type:        "neutralization",
    deltaH:      -75.4,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  6,
    productColor: "#bae6fd",
    description:  "Triprotic acid fully neutralised by NaOH",
  },

  "hbr+naoh": {
    id: "hbr_naoh", key: "hbr+naoh",
    reactantIds: ["hbr", "naoh"],
    products: [
      { name: "Sodium Bromide", formula: "NaBr", color: "#fecaca", emoji: "🌸" },
      { name: "Water",          formula: "H₂O",  color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "HBr + NaOH → NaBr + H₂O",
    type:        "neutralization",
    deltaH:      -57.3,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#fed7aa",
    description:  "Hydrobromic acid neutralisation",
  },

  "ca_oh_2+hcl": {
    id: "ca_oh_2_hcl", key: "ca_oh_2+hcl",
    reactantIds: ["ca_oh_2", "hcl"],
    products: [
      { name: "Calcium Chloride", formula: "CaCl₂", color: "#e2e8f0", emoji: "🩶" },
      { name: "Water",            formula: "H₂O",   color: "#93c5fd", emoji: "💧" },
    ],
    equation:    "Ca(OH)₂ + 2HCl → CaCl₂ + 2H₂O",
    type:        "neutralization",
    deltaH:      -115.4,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  5,
    productColor: "#e0f2fe",
    description:  "Slaked lime + hydrochloric acid",
  },

  "hcl+h2so4": {
    id: "hcl_h2so4", key: "hcl+h2so4",
    reactantIds: ["hcl", "h2so4"],
    products: [
      { name: "Chlorosulfuric Acid (fumes)", formula: "ClSO₃H", color: "#94a3b8", emoji: "☁️" },
    ],
    equation:    "HCl + H₂SO₄ → ClSO₃H + HF (fuming mixture)",
    type:        "generic",
    deltaH:      -15.0,
    requiresHeat: false,
    minTemp:      20,
    durationSec:  8,
    productColor: "#94a3b8",
    description:  "Two strong acids — fuming chlorosulfuric mixture",
  },
};

/** Look up a reaction by a set of chemical IDs (order-independent) */
export function findReaction(chemicalIds: string[]): ReactionRecord | null {
  // Filter out water (h2o) from reactants lookup, since it is a solvent/spectator
  const activeIds = chemicalIds.filter((id) => id !== "h2o");
  if (activeIds.length < 2) return null;

  // 1. First check if the entire set of active chemicals matches a reaction directly
  const fullKey = [...activeIds].sort().join("+");
  if (REACTION_REGISTRY[fullKey]) return REACTION_REGISTRY[fullKey];

  // 2. Otherwise, check all pairs of active chemicals to find a matching reaction
  for (let i = 0; i < activeIds.length; i++) {
    for (let j = i + 1; j < activeIds.length; j++) {
      const pairKey = [activeIds[i], activeIds[j]].sort().join("+");
      if (REACTION_REGISTRY[pairKey]) {
        return REACTION_REGISTRY[pairKey];
      }
    }
  }

  return null;
}

/** All reactions as a flat array (for library display) */
export const ALL_REACTIONS: ReactionRecord[] = Object.values(REACTION_REGISTRY);

