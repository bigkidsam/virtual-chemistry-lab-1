"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { synth } from "../audio/audioSynth";

interface Question {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    q: "What is the correct procedure when diluting a concentrated acid with water?",
    options: [
      "Pour water directly into the acid quickly to minimize fumes.",
      "Add the acid slowly to water while stirring continuously.",
      "Mix both components simultaneously in a closed container.",
      "Heat the acid first to reduce density before pouring water."
    ],
    correct: 1,
    explanation: "Always add acid to water (A.A.W. - Add Acid to Water). Diluting concentrated acid is highly exothermic. Adding water to acid can cause the mixture to flash boil and splash corrosive droplets. Adding acid slowly to a larger volume of water dissipates heat safely."
  },
  {
    q: "What is the significance of the blue segment in the NFPA 704 Safety Diamond?",
    options: [
      "Flammability hazards and auto-ignition temperatures.",
      "Special hazard precautions (like reactivity with water or oxidizers).",
      "Reactivity and mechanical instability under fire conditions.",
      "Health hazards and toxicity ratings from 0 (stable) to 4 (highly lethal)."
    ],
    correct: 3,
    explanation: "In the NFPA 704 Diamond, Blue represents Health hazards, Red represents Flammability, Yellow represents Instability/Reactivity, and White is reserved for Special Hazards."
  },
  {
    q: "If a slot or container exceeds 220°C in our laboratory simulation, what thermal safety event occurs?",
    options: [
      "The glassware turns solid black and slows the reaction.",
      "The liquid level remains stable but changes to pH 7.",
      "The glassware bursts/explodes due to thermal stress, clearing the slot.",
      "The temperature scales down automatically with no visual changes."
    ],
    correct: 2,
    explanation: "When temperature exceeds the 220°C safety threshold, thermal stress triggers a glassware explosion. The slot is reset, chemicals are lost, and the synthesizer plays an explosion effect."
  },
  {
    q: "What does the 'W' with a slash line through it signify in the white segment of the NFPA 704 Diamond?",
    options: [
      "Wash with plenty of water in case of contact.",
      "Reacts violently or explosively with water.",
      "Weak acid, requiring minimal protective equipment.",
      "Waste material that must be neutralized immediately."
    ],
    correct: 1,
    explanation: "A 'W' with a horizontal slash represents reactivity with water, indicating that the substance can react violently or explosively when in contact with moisture."
  },
  {
    q: "How does using the Stirring Rod tool affect active chemical reactions in the slots?",
    options: [
      "It lowers the liquid temperature and acts as a coolant.",
      "It doubles the reaction speed (2x rate) and spawns swirling particles.",
      "It neutralizes the pH level of the solution to exactly 7.0.",
      "It adds spectator chemicals to the beaker."
    ],
    correct: 1,
    explanation: "Stirring adds kinetic energy and increases contact between reactants. In the simulation, bringing the rod close to a container applies a 2.0x reaction speed multiplier and spawns swirling vortex particles."
  }
];

export default function SafetyQuizPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [expAwarded, setExpAwarded] = useState(false);

  const [userProfile, setUserProfile] = useState<{ name: string; role: string; exp: number } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lab_user");
    if (stored) {
      try {
        setUserProfile(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const handleStart = () => {
    setStarted(true);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setSubmitted(false);
    setScore(0);
    setQuizFinished(false);
    setExpAwarded(false);
  };

  const handleOptionSelect = (optIdx: number) => {
    if (submitted) return;
    setSelectedOpt(optIdx);
  };

  const handleSubmit = () => {
    if (selectedOpt === null || submitted) return;
    setSubmitted(true);
    if (selectedOpt === QUESTIONS[currentIdx].correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setSubmitted(false);
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  useEffect(() => {
    if (quizFinished && score === QUESTIONS.length && !expAwarded) {
      synth?.playSuccess();
      setExpAwarded(true);

      // Award EXP and badge
      const stored = localStorage.getItem("lab_user");
      let user = stored ? JSON.parse(stored) : { name: "Guest Researcher", role: "Student Researcher", exp: 0 };
      
      // Gain 150 EXP
      user.exp = Math.min(1000, (user.exp || 0) + 150);
      localStorage.setItem("lab_user", JSON.stringify(user));
      setUserProfile(user);

      // Unlock Safety Officer badge
      let unlocked: string[] = [];
      const storedAch = localStorage.getItem("lab_achievements");
      if (storedAch) {
        try {
          unlocked = JSON.parse(storedAch);
        } catch {}
      }
      if (!unlocked.includes("safety_quiz")) {
        unlocked.push("safety_quiz");
        localStorage.setItem("lab_achievements", JSON.stringify(unlocked));
      }
    }
  }, [quizFinished, score, expAwarded]);

  const activeQuestion = QUESTIONS[currentIdx];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050810",
        backgroundImage: "radial-gradient(circle at top right, rgba(6, 182, 212, 0.05), transparent), radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.05), transparent)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <Navbar />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        
        {/* Main Quiz Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            border: "1.5px solid rgba(34, 211, 238, 0.35)",
            borderRadius: "16px",
            padding: "36px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(34, 211, 238, 0.15)",
            backdropFilter: "blur(12px)",
            position: "relative",
          }}
        >
          {/* Welcome/Start Screen */}
          {!started && (
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "56px", display: "block", marginBottom: "16px" }}>🛡️</span>
              <h2 style={{ fontSize: "26px", fontWeight: "bold", color: "#ffffff", marginBottom: "12px" }}>
                Lab Safety & Quiz Portal
              </h2>
              <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.6", marginBottom: "28px" }}>
                Pass the laboratory safety examination with a perfect score (5/5) to earn the prestigious <strong style={{ color: "#22d3ee" }}>Safety Officer 🛡️</strong> badge and gain <strong style={{ color: "#22d3ee" }}>+150 EXP</strong>!
              </p>
              <button
                style={{
                  padding: "12px 32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "15px",
                  boxShadow: "0 4px 14px rgba(6, 182, 212, 0.4)",
                  transition: "all 0.2s"
                }}
                onClick={handleStart}
              >
                📝 Begin Assessment
              </button>
            </div>
          )}

          {/* Active Question Screen */}
          {started && !quizFinished && (
            <div>
              {/* Progress and Score */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", fontWeight: "bold", marginBottom: "16px" }}>
                <span>QUESTION {currentIdx + 1} OF {QUESTIONS.length}</span>
                <span style={{ color: "#22d3ee" }}>SCORE: {score}</span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden", marginBottom: "28px" }}>
                <div style={{ height: "100%", width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%`, backgroundColor: "#22d3ee", transition: "width 0.3s ease" }} />
              </div>

              {/* Question Text */}
              <h3 style={{ fontSize: "18px", fontWeight: "700", lineHeight: "1.5", color: "#ffffff", marginBottom: "24px" }}>
                {activeQuestion.q}
              </h3>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                {activeQuestion.options.map((opt, i) => {
                  let optStyle: React.CSSProperties = {
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: "8px",
                    textAlign: "left",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    color: "#cbd5e1",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  };

                  if (selectedOpt === i) {
                    optStyle.border = "1.5px solid #22d3ee";
                    optStyle.background = "rgba(34, 211, 238, 0.08)";
                    optStyle.color = "#ffffff";
                  }

                  if (submitted) {
                    optStyle.cursor = "default";
                    if (i === activeQuestion.correct) {
                      optStyle.border = "1.5px solid #10b981";
                      optStyle.background = "rgba(16, 185, 129, 0.12)";
                      optStyle.color = "#34d399";
                    } else if (selectedOpt === i) {
                      optStyle.border = "1.5px solid #ef4444";
                      optStyle.background = "rgba(239, 68, 68, 0.12)";
                      optStyle.color = "#fca5a5";
                    }
                  }

                  return (
                    <button key={i} style={optStyle} onClick={() => handleOptionSelect(i)}>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Block */}
              {submitted && (
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    padding: "16px",
                    fontSize: "12.5px",
                    lineHeight: "1.5",
                    color: "#94a3b8",
                    marginBottom: "24px"
                  }}
                >
                  <strong style={{ color: selectedOpt === activeQuestion.correct ? "#10b981" : "#ef4444" }}>
                    {selectedOpt === activeQuestion.correct ? "✓ Correct! " : "✗ Incorrect. "}
                  </strong>
                  {activeQuestion.explanation}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {!submitted ? (
                  <button
                    disabled={selectedOpt === null}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "6px",
                      background: selectedOpt === null ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #06b6d4, #0891b2)",
                      color: selectedOpt === null ? "#64748b" : "#ffffff",
                      border: "none",
                      fontWeight: "bold",
                      cursor: selectedOpt === null ? "not-allowed" : "pointer",
                      boxShadow: selectedOpt === null ? "none" : "0 4px 10px rgba(6, 182, 212, 0.25)"
                    }}
                    onClick={handleSubmit}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    style={{
                      padding: "10px 28px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1.5px solid rgba(34, 211, 238, 0.3)",
                      color: "#22d3ee",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                    onClick={handleNext}
                  >
                    {currentIdx + 1 === QUESTIONS.length ? "Finish Quiz" : "Next Question →"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Finished Quiz Screen */}
          {quizFinished && (
            <div style={{ textAlign: "center" }}>
              {score === QUESTIONS.length ? (
                <div>
                  <span style={{ fontSize: "64px", display: "block", marginBottom: "16px", filter: "drop-shadow(0 0 10px rgba(34, 211, 238, 0.5))" }}>🏆</span>
                  <h2 style={{ fontSize: "26px", fontWeight: "bold", color: "#10b981", marginBottom: "12px" }}>
                    Perfect Score! (5/5)
                  </h2>
                  <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6", marginBottom: "28px" }}>
                    Congratulations! You have completed the safety examination. You are now officially certified as a laboratory safety officer.
                  </p>

                  {/* Rewards Card */}
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1.5px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "10px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      alignItems: "center",
                      marginBottom: "32px"
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#34d399" }}>
                      🛡️ UNLOCKED BADGE: Safety Officer 🛡️
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ffd700" }}>
                      ⭐ AWARDED: +150 EXP (New total: {userProfile?.exp ?? 0} EXP)
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: "56px", display: "block", marginBottom: "16px" }}>⚠️</span>
                  <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b", marginBottom: "12px" }}>
                    Assessment Incomplete ({score}/5)
                  </h2>
                  <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.6", marginBottom: "32px" }}>
                    A perfect score of 5/5 is required to obtain the Safety Officer certification. Review the explanations and retry the quiz!
                  </p>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                <button
                  style={{
                    padding: "10px 24px",
                    borderRadius: "6px",
                    background: "rgba(255, 255, 255, 0.04)",
                    color: "#cbd5e1",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                  onClick={() => router.push("/dashboard")}
                >
                  🚪 Return to Dashboard
                </button>
                <button
                  style={{
                    padding: "10px 28px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: "bold",
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(6, 182, 212, 0.3)"
                  }}
                  onClick={handleStart}
                >
                  {score === QUESTIONS.length ? "Retake Quiz" : "🔄 Try Again"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
