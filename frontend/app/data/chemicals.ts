/**
 * Comprehensive Chemical Dataset — ~150+ chemicals
 * Categories: "Acid", "Base", "Salt", "Organic", "Indicator", "Oxidizer", "Metal", "Gas", "Other"
 */

export interface Chemical {
  id: string;
  name: string;
  fullName: string;
  colorName: string;
  color: string;
  state: "Liquid" | "Solid" | "Gas";
  temp: string;
  formula: string;
  category: string;
  emoji: string;
}

export const CATEGORIES = [
  "All", "Acid", "Base", "Salt", "Organic", "Indicator", "Oxidizer", "Metal", "Gas", "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CHEMICALS: Chemical[] = [
  // ═══════════════════════════════════════════════════════
  //  ACIDS (20)
  // ═══════════════════════════════════════════════════════
  { id: "hcl", name: "HCl", fullName: "Hydrochloric Acid", colorName: "Pale Yellow", color: "#fde68a", state: "Liquid", temp: "25°C", formula: "HCl", category: "Acid", emoji: "💛" },
  { id: "h2so4", name: "H₂SO₄", fullName: "Sulfuric Acid", colorName: "Colorless", color: "#94a3b8", state: "Liquid", temp: "20°C", formula: "H₂SO₄", category: "Acid", emoji: "🩶" },
  { id: "hno3", name: "HNO₃", fullName: "Nitric Acid", colorName: "Colorless", color: "#cbd5e1", state: "Liquid", temp: "25°C", formula: "HNO₃", category: "Acid", emoji: "🤍" },
  { id: "ch3cooh", name: "CH₃COOH", fullName: "Acetic Acid (Vinegar)", colorName: "Colorless", color: "#fef3c7", state: "Liquid", temp: "25°C", formula: "CH₃COOH", category: "Acid", emoji: "🫗" },
  { id: "h3po4", name: "H₃PO₄", fullName: "Phosphoric Acid", colorName: "Colorless", color: "#e2e8f0", state: "Liquid", temp: "25°C", formula: "H₃PO₄", category: "Acid", emoji: "💧" },
  { id: "h2co3", name: "H₂CO₃", fullName: "Carbonic Acid", colorName: "Colorless", color: "#dbeafe", state: "Liquid", temp: "20°C", formula: "H₂CO₃", category: "Acid", emoji: "💧" },
  { id: "hf", name: "HF", fullName: "Hydrofluoric Acid", colorName: "Colorless", color: "#e0f2fe", state: "Liquid", temp: "20°C", formula: "HF", category: "Acid", emoji: "⚠️" },
  { id: "hbr", name: "HBr", fullName: "Hydrobromic Acid", colorName: "Colorless", color: "#fecaca", state: "Liquid", temp: "25°C", formula: "HBr", category: "Acid", emoji: "💧" },
  { id: "hi", name: "HI", fullName: "Hydroiodic Acid", colorName: "Colorless", color: "#e9d5ff", state: "Liquid", temp: "25°C", formula: "HI", category: "Acid", emoji: "💧" },
  { id: "hclo4", name: "HClO₄", fullName: "Perchloric Acid", colorName: "Colorless", color: "#f1f5f9", state: "Liquid", temp: "22°C", formula: "HClO₄", category: "Acid", emoji: "⚠️" },
  { id: "hclo", name: "HClO", fullName: "Hypochlorous Acid", colorName: "Pale Yellow", color: "#fef9c3", state: "Liquid", temp: "25°C", formula: "HClO", category: "Acid", emoji: "💛" },
  { id: "h2s", name: "H₂S", fullName: "Hydrosulfuric Acid", colorName: "Colorless", color: "#fef3c7", state: "Liquid", temp: "20°C", formula: "H₂S", category: "Acid", emoji: "💨" },
  { id: "h2so3", name: "H₂SO₃", fullName: "Sulfurous Acid", colorName: "Colorless", color: "#e2e8f0", state: "Liquid", temp: "22°C", formula: "H₂SO₃", category: "Acid", emoji: "💧" },
  { id: "hno2", name: "HNO₂", fullName: "Nitrous Acid", colorName: "Pale Blue", color: "#bfdbfe", state: "Liquid", temp: "22°C", formula: "HNO₂", category: "Acid", emoji: "💧" },
  { id: "h2cro4", name: "H₂CrO₄", fullName: "Chromic Acid", colorName: "Orange-Red", color: "#fb923c", state: "Liquid", temp: "22°C", formula: "H₂CrO₄", category: "Acid", emoji: "🧡" },
  { id: "h3bo3", name: "H₃BO₃", fullName: "Boric Acid", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "H₃BO₃", category: "Acid", emoji: "🤍" },
  { id: "hcooh", name: "HCOOH", fullName: "Formic Acid", colorName: "Colorless", color: "#ecfdf5", state: "Liquid", temp: "25°C", formula: "HCOOH", category: "Acid", emoji: "🐜" },
  { id: "c6h8o7", name: "C₆H₈O₇", fullName: "Citric Acid", colorName: "Colorless", color: "#fef9c3", state: "Solid", temp: "25°C", formula: "C₆H₈O₇", category: "Acid", emoji: "🍋" },
  { id: "c4h6o6", name: "C₄H₆O₆", fullName: "Tartaric Acid", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "C₄H₆O₆", category: "Acid", emoji: "🍇" },
  { id: "c2h2o4", name: "C₂H₂O₄", fullName: "Oxalic Acid", colorName: "White Crystal", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "C₂H₂O₄", category: "Acid", emoji: "🤍" },
  { id: "hbrO3", name: "HBrO₃", fullName: "Bromic Acid", colorName: "Colorless", color: "#f1f5f9", state: "Liquid", temp: "25°C", formula: "HBrO₃", category: "Acid", emoji: "💧" },
  { id: "hcn", name: "HCN", fullName: "Hydrocyanic Acid", colorName: "Colorless", color: "#e2e8f0", state: "Liquid", temp: "20°C", formula: "HCN", category: "Acid", emoji: "☠️" },

  // ═══════════════════════════════════════════════════════
  //  BASES (15)
  // ═══════════════════════════════════════════════════════
  { id: "naoh", name: "NaOH", fullName: "Sodium Hydroxide (Caustic Soda)", colorName: "White", color: "#e2e8f0", state: "Solid", temp: "20°C", formula: "NaOH", category: "Base", emoji: "🤍" },
  { id: "koh", name: "KOH", fullName: "Potassium Hydroxide", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "20°C", formula: "KOH", category: "Base", emoji: "🤍" },
  { id: "ca_oh_2", name: "Ca(OH)₂", fullName: "Calcium Hydroxide (Slaked Lime)", colorName: "White", color: "#f8fafc", state: "Solid", temp: "22°C", formula: "Ca(OH)₂", category: "Base", emoji: "🪨" },
  { id: "nh4oh", name: "NH₄OH", fullName: "Ammonium Hydroxide", colorName: "Colorless", color: "#c7d2fe", state: "Liquid", temp: "20°C", formula: "NH₄OH", category: "Base", emoji: "💧" },
  { id: "mg_oh_2", name: "Mg(OH)₂", fullName: "Magnesium Hydroxide (Milk of Magnesia)", colorName: "White", color: "#f0f9ff", state: "Solid", temp: "22°C", formula: "Mg(OH)₂", category: "Base", emoji: "🤍" },
  { id: "ba_oh_2", name: "Ba(OH)₂", fullName: "Barium Hydroxide", colorName: "White", color: "#f8fafc", state: "Solid", temp: "22°C", formula: "Ba(OH)₂", category: "Base", emoji: "🤍" },
  { id: "al_oh_3", name: "Al(OH)₃", fullName: "Aluminium Hydroxide", colorName: "White Gel", color: "#f0f9ff", state: "Solid", temp: "22°C", formula: "Al(OH)₃", category: "Base", emoji: "🤍" },
  { id: "lioh", name: "LiOH", fullName: "Lithium Hydroxide", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "22°C", formula: "LiOH", category: "Base", emoji: "🤍" },
  { id: "fe_oh_3", name: "Fe(OH)₃", fullName: "Iron(III) Hydroxide", colorName: "Rust Brown", color: "#b45309", state: "Solid", temp: "22°C", formula: "Fe(OH)₃", category: "Base", emoji: "🟤" },
  { id: "fe_oh_2", name: "Fe(OH)₂", fullName: "Iron(II) Hydroxide", colorName: "Green", color: "#86efac", state: "Solid", temp: "22°C", formula: "Fe(OH)₂", category: "Base", emoji: "💚" },
  { id: "cu_oh_2", name: "Cu(OH)₂", fullName: "Copper(II) Hydroxide", colorName: "Blue", color: "#60a5fa", state: "Solid", temp: "22°C", formula: "Cu(OH)₂", category: "Base", emoji: "💙" },
  { id: "zn_oh_2", name: "Zn(OH)₂", fullName: "Zinc Hydroxide", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "22°C", formula: "Zn(OH)₂", category: "Base", emoji: "🤍" },
  { id: "sr_oh_2", name: "Sr(OH)₂", fullName: "Strontium Hydroxide", colorName: "White", color: "#f8fafc", state: "Solid", temp: "22°C", formula: "Sr(OH)₂", category: "Base", emoji: "🤍" },
  { id: "csoh", name: "CsOH", fullName: "Caesium Hydroxide", colorName: "White", color: "#e2e8f0", state: "Solid", temp: "22°C", formula: "CsOH", category: "Base", emoji: "🤍" },
  { id: "nanh2", name: "NaNH₂", fullName: "Sodium Amide", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "22°C", formula: "NaNH₂", category: "Base", emoji: "🤍" },
  { id: "rboh", name: "RbOH", fullName: "Rubidium Hydroxide", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "RbOH", category: "Base", emoji: "🤍" },

  // ═══════════════════════════════════════════════════════
  //  SALTS (30)
  // ═══════════════════════════════════════════════════════
  { id: "nacl", name: "NaCl", fullName: "Sodium Chloride (Table Salt)", colorName: "White Crystal", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "NaCl", category: "Salt", emoji: "🧂" },
  { id: "kcl", name: "KCl", fullName: "Potassium Chloride", colorName: "White Crystal", color: "#f1f5f9", state: "Solid", temp: "22°C", formula: "KCl", category: "Salt", emoji: "🪨" },
  { id: "cuso4", name: "CuSO₄", fullName: "Copper(II) Sulfate", colorName: "Vivid Blue", color: "#3b82f6", state: "Liquid", temp: "25°C", formula: "CuSO₄", category: "Salt", emoji: "💙" },
  { id: "feso4", name: "FeSO₄", fullName: "Iron(II) Sulfate (Ferrous Sulfate)", colorName: "Pale Green", color: "#86efac", state: "Solid", temp: "22°C", formula: "FeSO₄", category: "Salt", emoji: "💚" },
  { id: "agno3", name: "AgNO₃", fullName: "Silver Nitrate", colorName: "Colorless", color: "#e2e8f0", state: "Solid", temp: "22°C", formula: "AgNO₃", category: "Salt", emoji: "🩶" },
  { id: "baso4", name: "BaSO₄", fullName: "Barium Sulfate", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "BaSO₄", category: "Salt", emoji: "🤍" },
  { id: "cacl2", name: "CaCl₂", fullName: "Calcium Chloride", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "CaCl₂", category: "Salt", emoji: "🤍" },
  { id: "na2co3", name: "Na₂CO₃", fullName: "Sodium Carbonate (Washing Soda)", colorName: "White Powder", color: "#f8fafc", state: "Solid", temp: "22°C", formula: "Na₂CO₃", category: "Salt", emoji: "🤍" },
  { id: "nahco3", name: "NaHCO₃", fullName: "Sodium Bicarbonate (Baking Soda)", colorName: "White Powder", color: "#f1f5f9", state: "Solid", temp: "22°C", formula: "NaHCO₃", category: "Salt", emoji: "🧂" },
  { id: "caco3", name: "CaCO₃", fullName: "Calcium Carbonate (Chalk/Limestone)", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "CaCO₃", category: "Salt", emoji: "🪨" },
  { id: "pbno3_2", name: "Pb(NO₃)₂", fullName: "Lead(II) Nitrate", colorName: "Colorless", color: "#e2e8f0", state: "Solid", temp: "22°C", formula: "Pb(NO₃)₂", category: "Salt", emoji: "🩶" },
  { id: "znso4", name: "ZnSO₄", fullName: "Zinc Sulfate", colorName: "Colorless", color: "#e2e8f0", state: "Solid", temp: "22°C", formula: "ZnSO₄", category: "Salt", emoji: "🤍" },
  { id: "na2so4", name: "Na₂SO₄", fullName: "Sodium Sulfate (Glauber's Salt)", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "Na₂SO₄", category: "Salt", emoji: "🤍" },
  { id: "k2so4", name: "K₂SO₄", fullName: "Potassium Sulfate", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "K₂SO₄", category: "Salt", emoji: "🤍" },
  { id: "mgso4", name: "MgSO₄", fullName: "Magnesium Sulfate (Epsom Salt)", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "MgSO₄", category: "Salt", emoji: "🧂" },
  { id: "fecl3", name: "FeCl₃", fullName: "Iron(III) Chloride (Ferric Chloride)", colorName: "Brown-Yellow", color: "#d97706", state: "Solid", temp: "22°C", formula: "FeCl₃", category: "Salt", emoji: "🟤" },
  { id: "fecl2", name: "FeCl₂", fullName: "Iron(II) Chloride (Ferrous Chloride)", colorName: "Green", color: "#86efac", state: "Solid", temp: "22°C", formula: "FeCl₂", category: "Salt", emoji: "💚" },
  { id: "cucl2", name: "CuCl₂", fullName: "Copper(II) Chloride", colorName: "Blue-Green", color: "#2dd4bf", state: "Solid", temp: "22°C", formula: "CuCl₂", category: "Salt", emoji: "💙" },
  { id: "bacl2", name: "BaCl₂", fullName: "Barium Chloride", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "22°C", formula: "BaCl₂", category: "Salt", emoji: "🤍" },
  { id: "agcl", name: "AgCl", fullName: "Silver Chloride", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "AgCl", category: "Salt", emoji: "🩶" },
  { id: "pbi2", name: "PbI₂", fullName: "Lead(II) Iodide", colorName: "Bright Yellow", color: "#facc15", state: "Solid", temp: "22°C", formula: "PbI₂", category: "Salt", emoji: "💛" },
  { id: "pbcl2", name: "PbCl₂", fullName: "Lead(II) Chloride", colorName: "White", color: "#f8fafc", state: "Solid", temp: "22°C", formula: "PbCl₂", category: "Salt", emoji: "🤍" },
  { id: "ki", name: "KI", fullName: "Potassium Iodide", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "KI", category: "Salt", emoji: "🤍" },
  { id: "kbr", name: "KBr", fullName: "Potassium Bromide", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "KBr", category: "Salt", emoji: "🤍" },
  { id: "nabr", name: "NaBr", fullName: "Sodium Bromide", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "NaBr", category: "Salt", emoji: "🤍" },
  { id: "na2s", name: "Na₂S", fullName: "Sodium Sulfide", colorName: "Yellow", color: "#fde68a", state: "Solid", temp: "22°C", formula: "Na₂S", category: "Salt", emoji: "💛" },
  { id: "fe2_so4_3", name: "Fe₂(SO₄)₃", fullName: "Iron(III) Sulfate", colorName: "Yellow", color: "#fbbf24", state: "Solid", temp: "22°C", formula: "Fe₂(SO₄)₃", category: "Salt", emoji: "💛" },
  { id: "caso4", name: "CaSO₄", fullName: "Calcium Sulfate (Gypsum)", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "CaSO₄", category: "Salt", emoji: "🪨" },
  { id: "nh4cl", name: "NH₄Cl", fullName: "Ammonium Chloride", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "NH₄Cl", category: "Salt", emoji: "🤍" },
  { id: "nh4no3", name: "NH₄NO₃", fullName: "Ammonium Nitrate", colorName: "White", color: "#f8fafc", state: "Solid", temp: "22°C", formula: "NH₄NO₃", category: "Salt", emoji: "🤍" },
  { id: "mgcl2", name: "MgCl₂", fullName: "Magnesium Chloride", colorName: "White Crystal", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "MgCl₂", category: "Salt", emoji: "🧂" },
  { id: "kclo3", name: "KClO₃", fullName: "Potassium Chlorate", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "KClO₃", category: "Salt", emoji: "🤍" },

  // ═══════════════════════════════════════════════════════
  //  ORGANIC (20)
  // ═══════════════════════════════════════════════════════
  { id: "ethanol", name: "C₂H₅OH", fullName: "Ethanol", colorName: "Colorless", color: "#a7f3d0", state: "Liquid", temp: "18°C", formula: "C₂H₅OH", category: "Organic", emoji: "💚" },
  { id: "methanol", name: "CH₃OH", fullName: "Methanol", colorName: "Colorless", color: "#bbf7d0", state: "Liquid", temp: "20°C", formula: "CH₃OH", category: "Organic", emoji: "💚" },
  { id: "acetone", name: "(CH₃)₂CO", fullName: "Acetone", colorName: "Colorless", color: "#fef9c3", state: "Liquid", temp: "20°C", formula: "(CH₃)₂CO", category: "Organic", emoji: "💛" },
  { id: "benzene", name: "C₆H₆", fullName: "Benzene", colorName: "Colorless", color: "#fecdd3", state: "Liquid", temp: "20°C", formula: "C₆H₆", category: "Organic", emoji: "🩷" },
  { id: "glucose", name: "C₆H₁₂O₆", fullName: "Glucose", colorName: "White Crystal", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "C₆H₁₂O₆", category: "Organic", emoji: "🤍" },
  { id: "toluene", name: "C₇H₈", fullName: "Toluene (Methylbenzene)", colorName: "Colorless", color: "#fce7f3", state: "Liquid", temp: "20°C", formula: "C₇H₈", category: "Organic", emoji: "🩷" },
  { id: "phenol", name: "C₆H₅OH", fullName: "Phenol (Carbolic Acid)", colorName: "Colorless", color: "#fecdd3", state: "Solid", temp: "25°C", formula: "C₆H₅OH", category: "Organic", emoji: "🩷" },
  { id: "formaldehyde", name: "HCHO", fullName: "Formaldehyde (Methanal)", colorName: "Colorless", color: "#e2e8f0", state: "Gas", temp: "25°C", formula: "HCHO", category: "Organic", emoji: "💨" },
  { id: "acetaldehyde", name: "CH₃CHO", fullName: "Acetaldehyde (Ethanal)", colorName: "Colorless", color: "#fef3c7", state: "Liquid", temp: "20°C", formula: "CH₃CHO", category: "Organic", emoji: "💛" },
  { id: "glycerol", name: "C₃H₈O₃", fullName: "Glycerol (Glycerine)", colorName: "Colorless", color: "#dbeafe", state: "Liquid", temp: "25°C", formula: "C₃H₈O₃", category: "Organic", emoji: "💧" },
  { id: "ethylene", name: "C₂H₄", fullName: "Ethylene (Ethene)", colorName: "Colorless", color: "#d1fae5", state: "Gas", temp: "25°C", formula: "C₂H₄", category: "Organic", emoji: "💨" },
  { id: "acetylene", name: "C₂H₂", fullName: "Acetylene (Ethyne)", colorName: "Colorless", color: "#e0f2fe", state: "Gas", temp: "25°C", formula: "C₂H₂", category: "Organic", emoji: "🔥" },
  { id: "methane", name: "CH₄", fullName: "Methane", colorName: "Colorless", color: "#ecfdf5", state: "Gas", temp: "25°C", formula: "CH₄", category: "Organic", emoji: "💨" },
  { id: "propanol", name: "C₃H₇OH", fullName: "Propanol (1-Propanol)", colorName: "Colorless", color: "#a7f3d0", state: "Liquid", temp: "20°C", formula: "C₃H₇OH", category: "Organic", emoji: "💚" },
  { id: "butanol", name: "C₄H₉OH", fullName: "Butanol (1-Butanol)", colorName: "Colorless", color: "#bbf7d0", state: "Liquid", temp: "20°C", formula: "C₄H₉OH", category: "Organic", emoji: "💚" },
  { id: "diethyl_ether", name: "(C₂H₅)₂O", fullName: "Diethyl Ether", colorName: "Colorless", color: "#dbeafe", state: "Liquid", temp: "20°C", formula: "(C₂H₅)₂O", category: "Organic", emoji: "💧" },
  { id: "chloroform", name: "CHCl₃", fullName: "Chloroform (Trichloromethane)", colorName: "Colorless", color: "#e2e8f0", state: "Liquid", temp: "20°C", formula: "CHCl₃", category: "Organic", emoji: "💧" },
  { id: "sucrose", name: "C₁₂H₂₂O₁₁", fullName: "Sucrose (Table Sugar)", colorName: "White Crystal", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "C₁₂H₂₂O₁₁", category: "Organic", emoji: "🍬" },
  { id: "urea", name: "CO(NH₂)₂", fullName: "Urea", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "CO(NH₂)₂", category: "Organic", emoji: "🤍" },
  { id: "starch", name: "(C₆H₁₀O₅)ₙ", fullName: "Starch", colorName: "White Powder", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "(C₆H₁₀O₅)ₙ", category: "Organic", emoji: "🤍" },
  { id: "isopropyl_alcohol", name: "C₃H₈O", fullName: "Isopropyl Alcohol", colorName: "Colorless", color: "#e0f2fe", state: "Liquid", temp: "20°C", formula: "C₃H₈O", category: "Organic", emoji: "💧" },

  // ═══════════════════════════════════════════════════════
  //  INDICATORS (8)
  // ═══════════════════════════════════════════════════════
  { id: "phenolphthalein", name: "Phenolphthalein", fullName: "Phenolphthalein Indicator", colorName: "Colorless/Pink", color: "#f9a8d4", state: "Liquid", temp: "25°C", formula: "C₂₀H₁₄O₄", category: "Indicator", emoji: "🩷" },
  { id: "litmus", name: "Litmus", fullName: "Litmus Solution", colorName: "Purple", color: "#a78bfa", state: "Liquid", temp: "25°C", formula: "Litmus", category: "Indicator", emoji: "💜" },
  { id: "methyl_orange", name: "Methyl Orange", fullName: "Methyl Orange Indicator", colorName: "Orange", color: "#fb923c", state: "Liquid", temp: "25°C", formula: "C₁₄H₁₄N₃NaO₃S", category: "Indicator", emoji: "🧡" },
  { id: "universal_indicator", name: "Universal", fullName: "Universal Indicator", colorName: "Green (Neutral)", color: "#4ade80", state: "Liquid", temp: "25°C", formula: "Mixed", category: "Indicator", emoji: "🌈" },
  { id: "methyl_red", name: "Methyl Red", fullName: "Methyl Red Indicator", colorName: "Red", color: "#f87171", state: "Liquid", temp: "25°C", formula: "C₁₅H₁₅N₃O₂", category: "Indicator", emoji: "❤️" },
  { id: "bromothymol_blue", name: "Bromothymol Blue", fullName: "Bromothymol Blue Indicator", colorName: "Blue/Yellow", color: "#38bdf8", state: "Liquid", temp: "25°C", formula: "C₂₇H₂₈Br₂O₅S", category: "Indicator", emoji: "💙" },
  { id: "thymol_blue", name: "Thymol Blue", fullName: "Thymol Blue Indicator", colorName: "Red/Yellow/Blue", color: "#f59e0b", state: "Liquid", temp: "25°C", formula: "C₂₇H₃₀O₅S", category: "Indicator", emoji: "🟡" },
  { id: "starch_indicator", name: "Starch Soln", fullName: "Starch Indicator Solution", colorName: "Colorless", color: "#e2e8f0", state: "Liquid", temp: "25°C", formula: "Starch (aq)", category: "Indicator", emoji: "🤍" },
  { id: "congo_red", name: "Congo Red", fullName: "Congo Red Indicator", colorName: "Red", color: "#ef4444", state: "Liquid", temp: "25°C", formula: "C₃₂H₂₂N₆Na₂O₆S₂", category: "Indicator", emoji: "❤️" },

  // ═══════════════════════════════════════════════════════
  //  OXIDIZERS / REDUCERS (10)
  // ═══════════════════════════════════════════════════════
  { id: "kmno4", name: "KMnO₄", fullName: "Potassium Permanganate", colorName: "Deep Purple", color: "#7c3aed", state: "Solid", temp: "22°C", formula: "KMnO₄", category: "Oxidizer", emoji: "💜" },
  { id: "h2o2", name: "H₂O₂", fullName: "Hydrogen Peroxide", colorName: "Colorless", color: "#bfdbfe", state: "Liquid", temp: "20°C", formula: "H₂O₂", category: "Oxidizer", emoji: "💧" },
  { id: "k2cr2o7", name: "K₂Cr₂O₇", fullName: "Potassium Dichromate", colorName: "Orange", color: "#fb923c", state: "Solid", temp: "22°C", formula: "K₂Cr₂O₇", category: "Oxidizer", emoji: "🧡" },
  { id: "mno2", name: "MnO₂", fullName: "Manganese Dioxide", colorName: "Black", color: "#374151", state: "Solid", temp: "25°C", formula: "MnO₂", category: "Oxidizer", emoji: "⚫" },
  { id: "kno3", name: "KNO₃", fullName: "Potassium Nitrate (Saltpetre)", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "KNO₃", category: "Oxidizer", emoji: "🤍" },
  { id: "na2o2", name: "Na₂O₂", fullName: "Sodium Peroxide", colorName: "Yellowish", color: "#fde68a", state: "Solid", temp: "22°C", formula: "Na₂O₂", category: "Oxidizer", emoji: "💛" },
  { id: "pbO2", name: "PbO₂", fullName: "Lead(IV) Dioxide", colorName: "Dark Brown", color: "#78350f", state: "Solid", temp: "22°C", formula: "PbO₂", category: "Oxidizer", emoji: "🟤" },
  { id: "k2cro4", name: "K₂CrO₄", fullName: "Potassium Chromate", colorName: "Bright Yellow", color: "#facc15", state: "Solid", temp: "22°C", formula: "K₂CrO₄", category: "Oxidizer", emoji: "💛" },
  { id: "na2s2o3", name: "Na₂S₂O₃", fullName: "Sodium Thiosulfate (Hypo)", colorName: "Colorless", color: "#e2e8f0", state: "Solid", temp: "22°C", formula: "Na₂S₂O₃", category: "Oxidizer", emoji: "🤍" },
  { id: "feso4_nh4_2so4", name: "Mohr's Salt", fullName: "Ferrous Ammonium Sulfate", colorName: "Pale Green", color: "#86efac", state: "Solid", temp: "22°C", formula: "FeSO₄·(NH₄)₂SO₄·6H₂O", category: "Oxidizer", emoji: "💚" },
  { id: "hclo3", name: "HClO₃", fullName: "Chloric Acid", colorName: "Colorless", color: "#f1f5f9", state: "Liquid", temp: "25°C", formula: "HClO₃", category: "Oxidizer", emoji: "💧" },

  // ═══════════════════════════════════════════════════════
  //  METALS (18)
  // ═══════════════════════════════════════════════════════
  { id: "zinc", name: "Zn", fullName: "Zinc (Granulated)", colorName: "Silver-Grey", color: "#9ca3af", state: "Solid", temp: "25°C", formula: "Zn", category: "Metal", emoji: "⚙️" },
  { id: "iron", name: "Fe", fullName: "Iron Filings", colorName: "Dark Grey", color: "#6b7280", state: "Solid", temp: "25°C", formula: "Fe", category: "Metal", emoji: "⚙️" },
  { id: "copper", name: "Cu", fullName: "Copper Turnings", colorName: "Copper Orange", color: "#ea580c", state: "Solid", temp: "25°C", formula: "Cu", category: "Metal", emoji: "🟠" },
  { id: "magnesium", name: "Mg", fullName: "Magnesium Ribbon", colorName: "Silver", color: "#d1d5db", state: "Solid", temp: "25°C", formula: "Mg", category: "Metal", emoji: "🩶" },
  { id: "aluminium", name: "Al", fullName: "Aluminium Foil", colorName: "Silver", color: "#d1d5db", state: "Solid", temp: "25°C", formula: "Al", category: "Metal", emoji: "🩶" },
  { id: "sodium", name: "Na", fullName: "Sodium (stored in oil)", colorName: "Silver", color: "#cbd5e1", state: "Solid", temp: "25°C", formula: "Na", category: "Metal", emoji: "⚠️" },
  { id: "potassium", name: "K", fullName: "Potassium (stored in oil)", colorName: "Silver", color: "#cbd5e1", state: "Solid", temp: "25°C", formula: "K", category: "Metal", emoji: "⚠️" },
  { id: "calcium", name: "Ca", fullName: "Calcium", colorName: "Silver-Grey", color: "#9ca3af", state: "Solid", temp: "25°C", formula: "Ca", category: "Metal", emoji: "🩶" },
  { id: "tin", name: "Sn", fullName: "Tin", colorName: "Silver-White", color: "#d1d5db", state: "Solid", temp: "25°C", formula: "Sn", category: "Metal", emoji: "🩶" },
  { id: "lead", name: "Pb", fullName: "Lead", colorName: "Bluish Grey", color: "#94a3b8", state: "Solid", temp: "25°C", formula: "Pb", category: "Metal", emoji: "🩶" },
  { id: "silver", name: "Ag", fullName: "Silver", colorName: "Silver White", color: "#e2e8f0", state: "Solid", temp: "25°C", formula: "Ag", category: "Metal", emoji: "🩶" },
  { id: "gold", name: "Au", fullName: "Gold", colorName: "Golden Yellow", color: "#f59e0b", state: "Solid", temp: "25°C", formula: "Au", category: "Metal", emoji: "🥇" },
  { id: "platinum", name: "Pt", fullName: "Platinum", colorName: "Silver-White", color: "#e2e8f0", state: "Solid", temp: "25°C", formula: "Pt", category: "Metal", emoji: "🩶" },
  { id: "nickel", name: "Ni", fullName: "Nickel", colorName: "Silver", color: "#d1d5db", state: "Solid", temp: "25°C", formula: "Ni", category: "Metal", emoji: "⚙️" },
  { id: "chromium", name: "Cr", fullName: "Chromium", colorName: "Silver", color: "#d1d5db", state: "Solid", temp: "25°C", formula: "Cr", category: "Metal", emoji: "⚙️" },
  { id: "manganese", name: "Mn", fullName: "Manganese", colorName: "Silver-Grey", color: "#9ca3af", state: "Solid", temp: "25°C", formula: "Mn", category: "Metal", emoji: "⚙️" },
  { id: "mercury", name: "Hg", fullName: "Mercury (Quicksilver)", colorName: "Silver", color: "#cbd5e1", state: "Liquid", temp: "25°C", formula: "Hg", category: "Metal", emoji: "💧" },
  { id: "lithium", name: "Li", fullName: "Lithium", colorName: "Silver-White", color: "#e2e8f0", state: "Solid", temp: "25°C", formula: "Li", category: "Metal", emoji: "⚠️" },
  { id: "cu_wire", name: "Cu (Wire)", fullName: "Copper Wire", colorName: "Copper Orange", color: "#ea580c", state: "Solid", temp: "25°C", formula: "Cu", category: "Metal", emoji: "🟠" },

  // ═══════════════════════════════════════════════════════
  //  GASES (15)
  // ═══════════════════════════════════════════════════════
  { id: "co2", name: "CO₂", fullName: "Carbon Dioxide", colorName: "Colorless", color: "#d1d5db", state: "Gas", temp: "25°C", formula: "CO₂", category: "Gas", emoji: "💨" },
  { id: "o2", name: "O₂", fullName: "Oxygen", colorName: "Colorless", color: "#bfdbfe", state: "Gas", temp: "25°C", formula: "O₂", category: "Gas", emoji: "💨" },
  { id: "h2", name: "H₂", fullName: "Hydrogen", colorName: "Colorless", color: "#e0f2fe", state: "Gas", temp: "25°C", formula: "H₂", category: "Gas", emoji: "💨" },
  { id: "cl2", name: "Cl₂", fullName: "Chlorine Gas", colorName: "Yellow-Green", color: "#bef264", state: "Gas", temp: "25°C", formula: "Cl₂", category: "Gas", emoji: "🟢" },
  { id: "nh3", name: "NH₃", fullName: "Ammonia", colorName: "Colorless", color: "#c4b5fd", state: "Gas", temp: "25°C", formula: "NH₃", category: "Gas", emoji: "💨" },
  { id: "n2", name: "N₂", fullName: "Nitrogen", colorName: "Colorless", color: "#e0f2fe", state: "Gas", temp: "25°C", formula: "N₂", category: "Gas", emoji: "💨" },
  { id: "so2", name: "SO₂", fullName: "Sulfur Dioxide", colorName: "Colorless", color: "#fef3c7", state: "Gas", temp: "25°C", formula: "SO₂", category: "Gas", emoji: "☁️" },
  { id: "so3", name: "SO₃", fullName: "Sulfur Trioxide", colorName: "Colorless", color: "#e2e8f0", state: "Gas", temp: "25°C", formula: "SO₃", category: "Gas", emoji: "☁️" },
  { id: "no2", name: "NO₂", fullName: "Nitrogen Dioxide", colorName: "Brown", color: "#b45309", state: "Gas", temp: "25°C", formula: "NO₂", category: "Gas", emoji: "🟤" },
  { id: "no", name: "NO", fullName: "Nitric Oxide", colorName: "Colorless", color: "#e2e8f0", state: "Gas", temp: "25°C", formula: "NO", category: "Gas", emoji: "💨" },
  { id: "co", name: "CO", fullName: "Carbon Monoxide", colorName: "Colorless", color: "#f1f5f9", state: "Gas", temp: "25°C", formula: "CO", category: "Gas", emoji: "⚠️" },
  { id: "he", name: "He", fullName: "Helium", colorName: "Colorless", color: "#dbeafe", state: "Gas", temp: "25°C", formula: "He", category: "Gas", emoji: "🎈" },
  { id: "ar", name: "Ar", fullName: "Argon", colorName: "Colorless", color: "#e0f2fe", state: "Gas", temp: "25°C", formula: "Ar", category: "Gas", emoji: "💨" },
  { id: "ne", name: "Ne", fullName: "Neon", colorName: "Colorless", color: "#fecdd3", state: "Gas", temp: "25°C", formula: "Ne", category: "Gas", emoji: "✨" },
  { id: "o3", name: "O₃", fullName: "Ozone", colorName: "Pale Blue", color: "#93c5fd", state: "Gas", temp: "25°C", formula: "O₃", category: "Gas", emoji: "💙" },
  { id: "kr", name: "Kr", fullName: "Krypton", colorName: "Colorless", color: "#e2e8f0", state: "Gas", temp: "25°C", formula: "Kr", category: "Gas", emoji: "✨" },
  { id: "xe", name: "Xe", fullName: "Xenon", colorName: "Colorless", color: "#e2e8f0", state: "Gas", temp: "25°C", formula: "Xe", category: "Gas", emoji: "✨" },

  // ═══════════════════════════════════════════════════════
  //  OTHER / COMMON REAGENTS (15)
  // ═══════════════════════════════════════════════════════
  { id: "h2o", name: "H₂O", fullName: "Distilled Water", colorName: "Colorless", color: "#93c5fd", state: "Liquid", temp: "25°C", formula: "H₂O", category: "Other", emoji: "💧" },
  { id: "sio2", name: "SiO₂", fullName: "Silicon Dioxide (Sand/Silica)", colorName: "White/Tan", color: "#d6d3d1", state: "Solid", temp: "25°C", formula: "SiO₂", category: "Other", emoji: "🏖️" },
  { id: "al2o3", name: "Al₂O₃", fullName: "Aluminium Oxide (Alumina)", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "Al₂O₃", category: "Other", emoji: "🤍" },
  { id: "cao", name: "CaO", fullName: "Calcium Oxide (Quicklime)", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "CaO", category: "Other", emoji: "🔥" },
  { id: "na2o", name: "Na₂O", fullName: "Sodium Oxide", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "Na₂O", category: "Other", emoji: "🤍" },
  { id: "fe2o3", name: "Fe₂O₃", fullName: "Iron(III) Oxide (Rust)", colorName: "Red-Brown", color: "#dc2626", state: "Solid", temp: "25°C", formula: "Fe₂O₃", category: "Other", emoji: "🟤" },
  { id: "cuo", name: "CuO", fullName: "Copper(II) Oxide", colorName: "Black", color: "#374151", state: "Solid", temp: "25°C", formula: "CuO", category: "Other", emoji: "⚫" },
  { id: "zno", name: "ZnO", fullName: "Zinc Oxide", colorName: "White", color: "#f8fafc", state: "Solid", temp: "25°C", formula: "ZnO", category: "Other", emoji: "🤍" },
  { id: "mgo", name: "MgO", fullName: "Magnesium Oxide", colorName: "White", color: "#f1f5f9", state: "Solid", temp: "25°C", formula: "MgO", category: "Other", emoji: "🤍" },
  { id: "sulfur", name: "S", fullName: "Sulfur (Powder)", colorName: "Yellow", color: "#facc15", state: "Solid", temp: "25°C", formula: "S", category: "Other", emoji: "💛" },
  { id: "phosphorus_red", name: "P (red)", fullName: "Red Phosphorus", colorName: "Dark Red", color: "#dc2626", state: "Solid", temp: "25°C", formula: "P", category: "Other", emoji: "🔴" },
  { id: "carbon", name: "C", fullName: "Carbon (Charcoal/Graphite)", colorName: "Black", color: "#1f2937", state: "Solid", temp: "25°C", formula: "C", category: "Other", emoji: "⚫" },
  { id: "iodine", name: "I₂", fullName: "Iodine", colorName: "Purple-Black", color: "#6d28d9", state: "Solid", temp: "25°C", formula: "I₂", category: "Other", emoji: "💜" },
  { id: "bromine", name: "Br₂", fullName: "Bromine", colorName: "Red-Brown", color: "#b91c1c", state: "Liquid", temp: "25°C", formula: "Br₂", category: "Other", emoji: "🟤" },
  { id: "naclo", name: "NaClO", fullName: "Sodium Hypochlorite (Bleach)", colorName: "Pale Yellow", color: "#fef9c3", state: "Liquid", temp: "25°C", formula: "NaClO", category: "Other", emoji: "🧴" },
  { id: "tio2", name: "TiO₂", fullName: "Titanium Dioxide", colorName: "White", color: "#ffffff", state: "Solid", temp: "25°C", formula: "TiO₂", category: "Other", emoji: "🤍" },
];
