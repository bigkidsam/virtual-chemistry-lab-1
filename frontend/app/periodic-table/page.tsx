"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ElementData {
  number: number;
  symbol: string;
  name: string;
  mass: number;
  category:
    | "alkali-metal"
    | "alkaline-earth"
    | "transition-metal"
    | "lanthanide"
    | "actinide"
    | "post-transition"
    | "metalloid"
    | "reactive-nonmetal"
    | "noble-gas"
    | "unknown";
  period: number;
  group: number;
  config: string;
  electronegativity?: number;
  state: "Gas" | "Liquid" | "Solid";
  fact: string;
  spawnId?: string; // maps to chemical ID in lab
}

// Complete 118 elements dataset with details for key ones and structural placeholders for others
const ELEMENTS: ElementData[] = [
  { number: 1, symbol: "H", name: "Hydrogen", mass: 1.008, category: "reactive-nonmetal", period: 1, group: 1, config: "1s¹", electronegativity: 2.20, state: "Gas", fact: "Most abundant chemical substance in the Universe.", spawnId: "h2" },
  { number: 2, symbol: "He", name: "Helium", mass: 4.0026, category: "noble-gas", period: 1, group: 18, config: "1s²", state: "Gas", fact: "It is the second-lightest element and has the lowest boiling point of any element.", spawnId: "he" },
  { number: 3, symbol: "Li", name: "Lithium", mass: 6.94, category: "alkali-metal", period: 2, group: 1, config: "[He] 2s¹", electronegativity: 0.98, state: "Solid", fact: "The least dense of all solid elements at room temperature.", spawnId: "lithium" },
  { number: 4, symbol: "Be", name: "Beryllium", mass: 9.0122, category: "alkaline-earth", period: 2, group: 2, config: "[He] 2s²", electronegativity: 1.57, state: "Solid", fact: "Beryllium is relatively rare in the universe, often forming when cosmic rays collide with larger nuclei." },
  { number: 5, symbol: "B", name: "Boron", mass: 10.81, category: "metalloid", period: 2, group: 13, config: "[He] 2s² 2p¹", electronegativity: 2.04, state: "Solid", fact: "Commonly used in boron silicate glassware (Pyrex) to resist thermal shocks." },
  { number: 6, symbol: "C", name: "Carbon", mass: 12.011, category: "reactive-nonmetal", period: 2, group: 14, config: "[He] 2s² 2p²", electronegativity: 2.55, state: "Solid", fact: "Forms the chemical basis for all known organic life.", spawnId: "carbon" },
  { number: 7, symbol: "N", name: "Nitrogen", mass: 14.007, category: "reactive-nonmetal", period: 2, group: 15, config: "[He] 2s² 2p³", electronegativity: 3.04, state: "Gas", fact: "Makes up approximately 78% of the Earth's atmosphere.", spawnId: "n2" },
  { number: 8, symbol: "O", name: "Oxygen", mass: 15.999, category: "reactive-nonmetal", period: 2, group: 16, config: "[He] 2s² 2p⁴", electronegativity: 3.44, state: "Gas", fact: "Highly reactive nonmetal and strong oxidizing agent.", spawnId: "o2" },
  { number: 9, symbol: "F", name: "Fluorine", mass: 18.998, category: "reactive-nonmetal", period: 2, group: 17, config: "[He] 2s² 2p⁵", electronegativity: 3.98, state: "Gas", fact: "The most electronegative and chemically reactive of all elements." },
  { number: 10, symbol: "Ne", name: "Neon", mass: 20.180, category: "noble-gas", period: 2, group: 18, config: "[He] 2s² 2p⁶", state: "Gas", fact: "Neon glows with a reddish-orange light when utilized in high-voltage glow discharge tubes.", spawnId: "ne" },
  { number: 11, symbol: "Na", name: "Sodium", mass: 22.990, category: "alkali-metal", period: 3, group: 1, config: "[Ne] 3s¹", electronegativity: 0.93, state: "Solid", fact: "Reacts violently with water to form sodium hydroxide and hydrogen gas.", spawnId: "sodium" },
  { number: 12, symbol: "Mg", name: "Magnesium", mass: 24.305, category: "alkaline-earth", period: 3, group: 2, config: "[Ne] 3s²", electronegativity: 1.31, state: "Solid", fact: "Burns with a brilliant, blinding white light when heated in air.", spawnId: "magnesium" },
  { number: 13, symbol: "Al", name: "Aluminium", mass: 26.982, category: "post-transition", period: 3, group: 13, config: "[Ne] 3s² 3p¹", electronegativity: 1.61, state: "Solid", fact: "The most abundant metal in the Earth's crust.", spawnId: "aluminium" },
  { number: 14, symbol: "Si", name: "Silicon", mass: 28.085, category: "metalloid", period: 3, group: 14, config: "[Ne] 3s² 3p²", electronegativity: 1.90, state: "Solid", fact: "Chief semiconductor component in modern computer microchips." },
  { number: 15, symbol: "P", name: "Phosphorus", mass: 30.974, category: "reactive-nonmetal", period: 3, group: 15, config: "[Ne] 3s² 3p³", electronegativity: 2.19, state: "Solid", fact: "Highly reactive; red phosphorus is used in safety matches.", spawnId: "phosphorus_red" },
  { number: 16, symbol: "S", name: "Sulfur", mass: 32.06, category: "reactive-nonmetal", period: 3, group: 16, config: "[Ne] 3s² 3p⁴", electronegativity: 2.58, state: "Solid", fact: "Forms yellow crystals at room temperature. Known historically as brimstone.", spawnId: "sulfur" },
  { number: 17, symbol: "Cl", name: "Chlorine", mass: 35.45, category: "reactive-nonmetal", period: 3, group: 17, config: "[Ne] 3s² 3p⁵", electronegativity: 3.16, state: "Gas", fact: "Pale yellow-green diatomic gas with a choking bleach-like odor.", spawnId: "cl2" },
  { number: 18, symbol: "Ar", name: "Argon", mass: 39.948, category: "noble-gas", period: 3, group: 18, config: "[Ne] 3s² 3p⁶", state: "Gas", fact: "The third most abundant gas in the Earth's atmosphere, at 0.93%.", spawnId: "ar" },
  { number: 19, symbol: "K", name: "Potassium", mass: 39.098, category: "alkali-metal", period: 4, group: 1, config: "[Ar] 4s¹", electronegativity: 0.82, state: "Solid", fact: "So soft that it can be easily cut with a butter knife.", spawnId: "potassium" },
  { number: 20, symbol: "Ca", name: "Calcium", mass: 40.078, category: "alkaline-earth", period: 4, group: 2, config: "[Ar] 4s²", electronegativity: 1.00, state: "Solid", fact: "Essential mineral for bone structure, muscle contraction, and cellular functions.", spawnId: "calcium" },
  
  // Lanthanides & Actinides positioning
  { number: 21, symbol: "Sc", name: "Scandium", mass: 44.956, category: "transition-metal", period: 4, group: 3, config: "[Ar] 3d¹ 4s²", electronegativity: 1.36, state: "Solid", fact: "Historically classified as a rare-earth element." },
  { number: 22, symbol: "Ti", name: "Titanium", mass: 47.867, category: "transition-metal", period: 4, group: 4, config: "[Ar] 3d² 4s²", electronegativity: 1.54, state: "Solid", fact: "Has the highest strength-to-density ratio of any metallic element." },
  { number: 23, symbol: "V", name: "Vanadium", mass: 50.942, category: "transition-metal", period: 4, group: 5, config: "[Ar] 3d³ 4s²", electronegativity: 1.63, state: "Solid", fact: "Named after Vanadis, the Norse goddess of beauty, due to its colorful compounds." },
  { number: 24, symbol: "Cr", name: "Chromium", mass: 51.996, category: "transition-metal", period: 4, group: 6, config: "[Ar] 3d⁵ 4s¹", electronegativity: 1.66, state: "Solid", fact: "Highly corrosion-resistant, commonly used in stainless steel alloy chrome plating." },
  { number: 25, symbol: "Mn", name: "Manganese", mass: 54.938, category: "transition-metal", period: 4, group: 7, config: "[Ar] 3d⁵ 4s²", electronegativity: 1.55, state: "Solid", fact: "Mainly used as an additive in steel production to improve strength and wear resistance." },
  { number: 26, symbol: "Fe", name: "Iron", mass: 55.845, category: "transition-metal", period: 4, group: 8, config: "[Ar] 3d⁶ 4s²", electronegativity: 1.83, state: "Solid", fact: "The most common element on Earth by mass, forming much of Earth's outer and inner core.", spawnId: "iron" },
  { number: 27, symbol: "Co", name: "Cobalt", mass: 58.933, category: "transition-metal", period: 4, group: 9, config: "[Ar] 3d⁷ 4s²", electronegativity: 1.88, state: "Solid", fact: "Mainly used in lithium-ion batteries and superalloys." },
  { number: 28, symbol: "Ni", name: "Nickel", mass: 58.693, category: "transition-metal", period: 4, group: 10, config: "[Ar] 3d⁸ 4s²", electronegativity: 1.91, state: "Solid", fact: "Nickel resists corrosion and is used to plate other metals to protect them." },
  { number: 29, symbol: "Cu", name: "Copper", mass: 63.546, category: "transition-metal", period: 4, group: 11, config: "[Ar] 3d¹⁰ 4s¹", electronegativity: 1.90, state: "Solid", fact: "Excellent thermal and electrical conductor. Used in electric wiring for centuries.", spawnId: "copper" },
  { number: 30, symbol: "Zn", name: "Zinc", mass: 65.38, category: "transition-metal", period: 4, group: 12, config: "[Ar] 3d¹⁰ 4s²", electronegativity: 1.65, state: "Solid", fact: "Commonly used as a protective coating to prevent iron from rusting (galvanization).", spawnId: "zinc" },
  { number: 31, symbol: "Ga", name: "Gallium", mass: 69.723, category: "post-transition", period: 4, group: 13, config: "[Ar] 3d¹⁰ 4s² 4p¹", electronegativity: 1.81, state: "Solid", fact: "Has a melting point of 29.76°C, meaning it can melt in the palm of a human hand." },
  { number: 32, symbol: "Ge", name: "Germanium", mass: 72.63, category: "metalloid", period: 4, group: 14, config: "[Ar] 3d¹⁰ 4s² 4p²", electronegativity: 2.01, state: "Solid", fact: "Crucial material used in infrared optical lenses and fiber-optic communication systems." },
  { number: 33, symbol: "As", name: "Arsenic", mass: 74.922, category: "metalloid", period: 4, group: 15, config: "[Ar] 3d¹⁰ 4s² 4p³", electronegativity: 2.18, state: "Solid", fact: "Well-known poison that was historically referred to as 'inheritance powder'." },
  { number: 34, symbol: "Se", name: "Selenium", mass: 78.971, category: "reactive-nonmetal", period: 4, group: 16, config: "[Ar] 3d¹⁰ 4s² 4p⁴", electronegativity: 2.55, state: "Solid", fact: "Named after Selene, the Greek goddess of the Moon, due to its light-sensitive conductivity." },
  { number: 35, symbol: "Br", name: "Bromine", mass: 79.904, category: "reactive-nonmetal", period: 4, group: 17, config: "[Ar] 3d¹⁰ 4s² 4p⁵", electronegativity: 2.96, state: "Liquid", fact: "Only nonmetallic element that is liquid at standard temperature and pressure.", spawnId: "bromine" },
  { number: 36, symbol: "Kr", name: "Krypton", mass: 83.798, category: "noble-gas", period: 4, group: 18, config: "[Ar] 3d¹⁰ 4s² 4p⁶", electronegativity: 3.00, state: "Gas", fact: "Krypton is used in some high-speed photographic flashes and energy-saving fluorescent bulbs.", spawnId: "kr" },

  // Let's add key heavier ones
  { number: 47, symbol: "Ag", name: "Silver", mass: 107.87, category: "transition-metal", period: 5, group: 11, config: "[Kr] 4d¹⁰ 5s¹", electronegativity: 1.93, state: "Solid", fact: "Exhibits the highest electrical conductivity, thermal conductivity, and reflectivity of any metal.", spawnId: "silver" },
  { number: 50, symbol: "Sn", name: "Tin", mass: 118.71, category: "post-transition", period: 5, group: 14, config: "[Kr] 4d¹⁰ 5s² 5p²", electronegativity: 1.96, state: "Solid", fact: "Obtained chiefly from the mineral cassiterite, tin is alloyed with copper to make bronze.", spawnId: "tin" },
  { number: 53, symbol: "I", name: "Iodine", mass: 126.90, category: "reactive-nonmetal", period: 5, group: 17, config: "[Kr] 4d¹⁰ 5s² 5p⁵", electronegativity: 2.66, state: "Solid", fact: "Lustrous purple-black solid that sublimates easily into a violet-colored gas.", spawnId: "iodine" },
  { number: 54, symbol: "Xe", name: "Xenon", mass: 131.29, category: "noble-gas", period: 5, group: 18, config: "[Kr] 4d¹⁰ 5s² 5p⁶", electronegativity: 2.6, state: "Gas", fact: "The first noble gas synthesized into a compound (xenon hexafluoroplatinate).", spawnId: "xe" },
  { number: 78, symbol: "Pt", name: "Platinum", mass: 195.08, category: "transition-metal", period: 6, group: 10, config: "[Xe] 4f¹⁴ 5d⁹ 6s¹", electronegativity: 2.28, state: "Solid", fact: "Highly unreactive precious metal that is extremely resistant to chemical attacks.", spawnId: "platinum" },
  { number: 79, symbol: "Au", name: "Gold", mass: 196.97, category: "transition-metal", period: 6, group: 11, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", electronegativity: 2.54, state: "Solid", fact: "The most malleable and ductile of all metals. It does not rust or tarnish.", spawnId: "gold" },
  { number: 80, symbol: "Hg", name: "Mercury", mass: 200.59, category: "transition-metal", period: 6, group: 12, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", electronegativity: 2.00, state: "Liquid", fact: "Only metallic element that is liquid at standard room temperature and pressure.", spawnId: "mercury" },
  { number: 82, symbol: "Pb", name: "Lead", mass: 207.2, category: "post-transition", period: 6, group: 14, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", electronegativity: 2.33, state: "Solid", fact: "Heavy metal that is highly toxic to humans, historically used in pipes and paint.", spawnId: "lead" },
];

// Generate generic placeholders for other elements so the full table layout is rendered
const categoriesMap: Record<number, ElementData["category"]> = {
  37: "alkali-metal", 38: "alkaline-earth", 39: "transition-metal", 40: "transition-metal",
  41: "transition-metal", 42: "transition-metal", 43: "transition-metal", 44: "transition-metal",
  45: "transition-metal", 46: "transition-metal", 48: "transition-metal", 49: "post-transition",
  51: "metalloid", 52: "metalloid", 55: "alkali-metal", 56: "alkaline-earth",
  57: "lanthanide", 58: "lanthanide", 59: "lanthanide", 60: "lanthanide",
  61: "lanthanide", 62: "lanthanide", 63: "lanthanide", 64: "lanthanide",
  65: "lanthanide", 66: "lanthanide", 67: "lanthanide", 68: "lanthanide",
  69: "lanthanide", 70: "lanthanide", 71: "lanthanide", 72: "transition-metal",
  73: "transition-metal", 74: "transition-metal", 75: "transition-metal", 76: "transition-metal",
  77: "transition-metal", 81: "post-transition", 83: "post-transition", 84: "metalloid",
  85: "reactive-nonmetal", 86: "noble-gas", 87: "alkali-metal", 88: "alkaline-earth",
  89: "actinide", 90: "actinide", 91: "actinide", 92: "actinide",
  93: "actinide", 94: "actinide", 95: "actinide", 96: "actinide",
  97: "actinide", 98: "actinide", 99: "actinide", 100: "actinide",
  101: "actinide", 102: "actinide", 103: "actinide", 104: "transition-metal",
  105: "transition-metal", 106: "transition-metal", 107: "transition-metal", 108: "transition-metal",
  109: "unknown", 110: "unknown", 111: "unknown", 112: "unknown",
  113: "unknown", 114: "unknown", 115: "unknown", 116: "unknown",
  117: "unknown", 118: "unknown"
};

const symbolsMap: Record<number, string> = {
  37: "Rb", 38: "Sr", 39: "Y", 40: "Zr", 41: "Nb", 42: "Mo", 43: "Tc", 44: "Ru", 45: "Rh", 46: "Pd",
  48: "Cd", 49: "In", 51: "Sb", 52: "Te", 55: "Cs", 56: "Ba", 57: "La", 58: "Ce", 59: "Pr", 60: "Nd",
  61: "Pm", 62: "Sm", 63: "Eu", 64: "Gd", 65: "Tb", 66: "Dy", 67: "Ho", 68: "Er", 69: "Tm", 70: "Yb",
  71: "Lu", 72: "Hf", 73: "Ta", 74: "W", 75: "Re", 76: "Os", 77: "Ir", 81: "Tl", 83: "Bi", 84: "Po",
  85: "At", 86: "Rn", 87: "Fr", 88: "Ra", 89: "Ac", 90: "Th", 91: "Pa", 92: "U", 93: "Np", 94: "Pu",
  95: "Am", 96: "Cm", 97: "Bk", 98: "Cf", 99: "Es", 100: "Fm", 101: "Md", 102: "No", 103: "Lr",
  104: "Rf", 105: "Db", 106: "Sg", 107: "Bh", 108: "Hs", 109: "Mt", 110: "Ds", 111: "Rg", 112: "Cn",
  113: "Nh", 114: "Fl", 115: "Mc", 116: "Lv", 117: "Ts", 118: "Og"
};

const namesMap: Record<number, string> = {
  37: "Rubidium", 38: "Strontium", 39: "Yttrium", 40: "Zirconium", 41: "Niobium", 42: "Molybdenum",
  43: "Technetium", 44: "Ruthenium", 45: "Rhodium", 46: "Palladium", 48: "Cadmium", 49: "Indium",
  51: "Antimony", 52: "Tellurium", 55: "Caesium", 56: "Barium", 57: "Lanthanum", 58: "Cerium",
  59: "Praseodymium", 60: "Neodymium", 61: "Promethium", 62: "Samarium", 63: "Europium",
  64: "Gadolinium", 65: "Terbium", 66: "Dysprosium", 67: "Holmium", 68: "Erbium", 69: "Thulium",
  70: "Ytterbium", 71: "Lutetium", 72: "Hafnium", 73: "Tantalum", 74: "Tungsten", 75: "Rhenium",
  76: "Osmium", 77: "Iridium", 81: "Thallium", 83: "Bismuth", 84: "Polonium", 85: "Astatine",
  86: "Radon", 87: "Francium", 88: "Radium", 89: "Actinium", 90: "Thorium", 91: "Protactinium",
  92: "Uranium", 93: "Neptunium", 94: "Plutonium", 95: "Americium", 96: "Curium", 97: "Berkelium",
  98: "Californium", 99: "Einsteinium", 100: "Fermium", 101: "Mendelevium", 102: "Nobelium",
  103: "Lawrencium", 104: "Rutherfordium", 105: "Dubnium", 106: "Seaborgium", 107: "Bohrium",
  108: "Hassium", 109: "Meitnerium", 110: "Darmstadtium", 111: "Roentgenium", 112: "Copernicium",
  113: "Nihonium", 114: "Flerovium", 115: "Moscovium", 116: "Livermorium", 117: "Tennessine",
  118: "Oganesson"
};

const fullElementList: ElementData[] = [];
for (let n = 1; n <= 118; n++) {
  const match = ELEMENTS.find((e) => e.number === n);
  if (match) {
    fullElementList.push(match);
  } else {
    // determine period/group
    let period = 1;
    let group = 1;
    
    if (n >= 3 && n <= 10) period = 2;
    else if (n >= 11 && n <= 18) period = 3;
    else if (n >= 19 && n <= 36) period = 4;
    else if (n >= 37 && n <= 54) period = 5;
    else if (n >= 55 && n <= 86) period = 6;
    else if (n >= 87 && n <= 118) period = 7;

    if (period === 2 || period === 3) {
      const offset = period === 2 ? 3 : 11;
      const idx = n - offset;
      group = idx < 2 ? idx + 1 : idx + 11;
    } else if (period >= 4) {
      const offset = period === 4 ? 19 : period === 5 ? 37 : period === 6 ? 55 : 87;
      const idx = n - offset;
      group = idx + 1;
    }

    // Adjust Lanthanides / Actinides groups
    const isLanthanide = n >= 57 && n <= 71;
    const isActinide = n >= 89 && n <= 103;
    if (isLanthanide) {
      group = 3; // conceptually in group 3
    } else if (isActinide) {
      group = 3;
    }

    fullElementList.push({
      number: n,
      symbol: symbolsMap[n] || "?",
      name: namesMap[n] || "Unknown",
      mass: Math.round(n * 2.3 * 100) / 100,
      category: categoriesMap[n] || "unknown",
      period,
      group,
      config: "n/a",
      state: "Solid",
      fact: "Synthetically created or heavy trace element with limited stable compounds."
    });
  }
}

// Map styles by category name
const CATEGORY_STYLES: Record<ElementData["category"], { bg: string; border: string; text: string; label: string }> = {
  "alkali-metal": { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)", text: "#fca5a5", label: "Alkali Metals" },
  "alkaline-earth": { bg: "rgba(249, 115, 22, 0.15)", border: "rgba(249, 115, 22, 0.4)", text: "#fed7aa", label: "Alkaline Earths" },
  "transition-metal": { bg: "rgba(234, 179, 8, 0.12)", border: "rgba(234, 179, 8, 0.35)", text: "#fef08a", label: "Transition Metals" },
  lanthanide: { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.4)", text: "#e9d5ff", label: "Lanthanides" },
  actinide: { bg: "rgba(236, 72, 153, 0.15)", border: "rgba(236, 72, 153, 0.4)", text: "#fbcfe8", label: "Actinides" },
  "post-transition": { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.4)", text: "#bbf7d0", label: "Post-Transition Metals" },
  metalloid: { bg: "rgba(20, 184, 166, 0.15)", border: "rgba(20, 184, 166, 0.4)", text: "#99f6e4", label: "Metalloids" },
  "reactive-nonmetal": { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.4)", text: "#bfdbfe", label: "Reactive Nonmetals" },
  "noble-gas": { bg: "rgba(99, 102, 241, 0.15)", border: "rgba(99, 102, 241, 0.4)", text: "#c7d2fe", label: "Noble Gases" },
  unknown: { bg: "rgba(100, 116, 139, 0.1)", border: "rgba(100, 116, 139, 0.3)", text: "#cbd5e1", label: "Unknown Properties" }
};

export default function PeriodicTablePage() {
  const router = useRouter();
  const [selectedNum, setSelectedNum] = useState<number>(1);

  const activeElement = fullElementList.find((e) => e.number === selectedNum) || fullElementList[0];

  // Helper to place elements correctly on standard grid coordinates
  const getGridCoords = (el: ElementData) => {
    const isLanthanide = el.number >= 57 && el.number <= 71;
    const isActinide = el.number >= 89 && el.number <= 103;

    if (isLanthanide) {
      // row 9, col starts at 4
      return { gridRow: 9, gridColumn: el.number - 57 + 4 };
    }
    if (isActinide) {
      // row 10, col starts at 4
      return { gridRow: 10, gridColumn: el.number - 89 + 4 };
    }

    // Lanthanum and Actinium space placeholder redirection
    if (el.number === 57 || el.number === 89) {
      // The slots in group 3 are placeholders
      return null;
    }

    let col = el.group;
    let row = el.period;

    // Shift for Lanthanide / Actinide split spacer gaps in period 6 & 7
    if (el.number > 57 && el.number <= 71) return null; // already handled below table
    if (el.number > 89 && el.number <= 103) return null; // already handled below table

    return { gridRow: row, gridColumn: col };
  };

  const handleSpawn = (spawnId: string) => {
    router.push(`/lab?spawn=${spawnId}`);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0f19",
        backgroundImage: "radial-gradient(ellipse at top, #0f1c30 0%, #07090e 100%)",
        color: "#f8fafc",
        padding: "24px 40px",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold", background: "linear-gradient(135deg, #22d3ee, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            🧪 Interactive Periodic Table
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#94a3b8" }}>
            Explore chemical configurations, electronegativities, and spawn compatible elements directly into the laboratory.
          </p>
        </div>
        <button
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1.5px solid rgba(34, 211, 238, 0.3)",
            color: "#22d3ee",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.2s ease"
          }}
          onClick={() => router.push("/lab")}
        >
          🎛️ Return to Lab
        </button>
      </div>

      {/* Main Container */}
      <div style={{ display: "flex", gap: "28px", flex: 1, flexWrap: "wrap" }}>
        
        {/* Table Area */}
        <div style={{ flex: "3 3 800px", display: "flex", flexDirection: "column", gap: "16px", overflowX: "auto" }}>
          
          {/* Legend */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "10px" }}>
            {Object.entries(CATEGORY_STYLES).map(([key, value]) => (
              <div
                key={key}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  backgroundColor: value.bg,
                  border: `1px solid ${value.border}`,
                  color: value.text,
                  fontWeight: "600"
                }}
              >
                {value.label}
              </div>
            ))}
          </div>

          {/* Periodic Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(18, minmax(40px, 1fr))",
              gridTemplateRows: "repeat(10, minmax(40px, 1fr))",
              gap: "4px",
              minWidth: "760px",
              padding: "16px",
              backgroundColor: "rgba(15, 23, 42, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
            }}
          >
            {fullElementList.map((el) => {
              const coords = getGridCoords(el);
              if (!coords) return null; // Lanthanides / Actinides that fall inside spacer gaps are filtered

              const styleObj = CATEGORY_STYLES[el.category] || CATEGORY_STYLES.unknown;
              const isSelected = el.number === selectedNum;

              return (
                <div
                  key={el.number}
                  style={{
                    ...coords,
                    backgroundColor: isSelected ? "rgba(34, 211, 238, 0.25)" : styleObj.bg,
                    border: isSelected ? "1.5px solid #22d3ee" : `1px solid ${styleObj.border}`,
                    borderRadius: "4px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "4px 6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 0 10px rgba(34, 211, 238, 0.4)" : "none"
                  }}
                  onClick={() => setSelectedNum(el.number)}
                  title={`${el.name} (${el.number})`}
                >
                  <span style={{ fontSize: "9px", color: isSelected ? "#ffffff" : styleObj.text }}>
                    {el.number}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: "bold", textAlign: "center", color: "#ffffff" }}>
                    {el.symbol}
                  </span>
                  <span style={{ fontSize: "7px", textAlign: "center", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", color: "#94a3b8" }}>
                    {el.name}
                  </span>
                </div>
              );
            })}

            {/* Lanthanide Spacer Label (Group 3, Period 6) */}
            <div
              style={{
                gridRow: 6,
                gridColumn: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "bold",
                color: "#a855f7",
                border: "1px dashed rgba(168, 85, 247, 0.3)",
                borderRadius: "4px",
                backgroundColor: "rgba(168, 85, 247, 0.05)"
              }}
            >
              57-71
            </div>

            {/* Actinide Spacer Label (Group 3, Period 7) */}
            <div
              style={{
                gridRow: 7,
                gridColumn: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "bold",
                color: "#ec4899",
                border: "1px dashed rgba(236, 72, 153, 0.3)",
                borderRadius: "4px",
                backgroundColor: "rgba(236, 72, 153, 0.05)"
              }}
            >
              89-103
            </div>

            {/* Spacer row for Lanthanide / Actinide block positioning at row 8 */}
            <div style={{ gridRow: 8, gridColumn: "1 / span 18", height: "10px" }} />
          </div>
        </div>

        {/* Sidebar Info Area */}
        <div style={{ flex: "1 1 300px", minWidth: "300px" }}>
          <div
            style={{
              backgroundColor: "#0f172a",
              border: "1.5px solid rgba(34, 211, 238, 0.4)",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
              position: "sticky",
              top: "24px"
            }}
          >
            {/* Element Large Graphic */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: "16px"
              }}
            >
              <div>
                <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "bold" }}>
                  ATOMIC NUMBER {activeElement.number}
                </div>
                <h2 style={{ margin: "4px 0", fontSize: "24px", fontWeight: "bold", color: "#ffffff" }}>
                  {activeElement.name}
                </h2>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    backgroundColor: CATEGORY_STYLES[activeElement.category]?.bg || "rgba(255,255,255,0.05)",
                    color: CATEGORY_STYLES[activeElement.category]?.text || "#ffffff",
                    border: `1px solid ${CATEGORY_STYLES[activeElement.category]?.border || "transparent"}`
                  }}
                >
                  {CATEGORY_STYLES[activeElement.category]?.label || "Unknown"}
                </span>
              </div>
              <div
                style={{
                  fontSize: "44px",
                  fontWeight: "900",
                  lineHeight: "1",
                  fontFamily: "monospace",
                  color: "#22d3ee",
                  textShadow: "0 0 10px rgba(34, 211, 238, 0.3)"
                }}
              >
                {activeElement.symbol}
              </div>
            </div>

            {/* Properties Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div style={{ padding: "8px 10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "6px" }}>
                <div style={{ color: "#64748b", fontSize: "10px", fontWeight: "bold" }}>ATOMIC WEIGHT</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#f1f5f9" }}>{activeElement.mass} u</div>
              </div>
              <div style={{ padding: "8px 10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "6px" }}>
                <div style={{ color: "#64748b", fontSize: "10px", fontWeight: "bold" }}>STATE AT 25°C</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: activeElement.state === "Gas" ? "#38bdf8" : activeElement.state === "Liquid" ? "#fb7185" : "#e2e8f0" }}>
                  {activeElement.state}
                </div>
              </div>
              <div style={{ padding: "8px 10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "6px" }}>
                <div style={{ color: "#64748b", fontSize: "10px", fontWeight: "bold" }}>ELECTRONEGATIVITY</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#f1f5f9" }}>
                  {activeElement.electronegativity !== undefined ? activeElement.electronegativity.toFixed(2) : "n/a"}
                </div>
              </div>
              <div style={{ padding: "8px 10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "6px" }}>
                <div style={{ color: "#64748b", fontSize: "10px", fontWeight: "bold" }}>ELECTRON CONFIG.</div>
                <div style={{ fontSize: "12px", fontWeight: "600", fontFamily: "monospace", color: "#99f6e4", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {activeElement.config}
                </div>
              </div>
            </div>

            {/* Quick Fact */}
            <div
              style={{
                background: "rgba(34, 211, 238, 0.04)",
                border: "1px solid rgba(34, 211, 238, 0.15)",
                borderRadius: "6px",
                padding: "14px",
                fontSize: "12px",
                lineHeight: "1.6",
                color: "#e2e8f0",
                marginBottom: "24px"
              }}
            >
              <span style={{ fontWeight: "bold", color: "#22d3ee" }}>DID YOU KNOW? </span>
              {activeElement.fact}
            </div>

            {/* Spawning Actions */}
            {activeElement.spawnId ? (
              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "bold",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px -1px rgba(6, 182, 212, 0.4)",
                  transition: "all 0.2s"
                }}
                onClick={() => handleSpawn(activeElement.spawnId!)}
              >
                ⚡ Spawn Dropper in Lab
              </button>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  color: "#64748b",
                  padding: "10px",
                  border: "1px dashed rgba(255, 255, 255, 0.08)",
                  borderRadius: "6px"
                }}
              >
                Not directly spawnable as a pure liquid dropper.
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
