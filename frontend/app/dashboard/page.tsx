"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

interface UserState {
  name: string;
  role: string;
  exp: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserState | null>(null);
  const [unlockedKeys, setUnlockedKeys] = useState<string[]>([]);

  useEffect(() => {
    // Client-side authentication check
    const storedUser = localStorage.getItem("lab_user");
    if (!storedUser) {
      router.push("/login?redirect=/dashboard");
      return;
    }
    
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      router.push("/login?redirect=/dashboard");
      return;
    }

    // Load unlocked achievements from localStorage
    const storedAch = localStorage.getItem("lab_achievements");
    if (storedAch) {
      try {
        setUnlockedKeys(JSON.parse(storedAch));
      } catch {
        // Ignore
      }
    }
  }, [router]);

  const achievements = useMemo(() => {
    return [
      { 
        id: "combustion",
        name: "Combustion Master", 
        icon: "🔥", 
        desc: "Ignited a Bunsen Burner", 
        unlocked: true, // Unlocked as introductory credential
        color: "var(--amber)" 
      },
      { 
        id: "neutralization",
        name: "Neutralization Sage", 
        icon: "⚖️", 
        desc: "Mixed HCl & NaOH to reach pH 7", 
        unlocked: unlockedKeys.includes("neutralization"), 
        color: "var(--teal)" 
      },
      { 
        id: "water",
        name: "Water Architect", 
        icon: "💧", 
        desc: "Synthesized Water from H₂ and O₂", 
        unlocked: unlockedKeys.includes("water"), 
        color: "var(--blue)" 
      },
      { 
        id: "precipitation",
        name: "Precipitation Guru", 
        icon: "⚪", 
        desc: "Created AgCl precipitate", 
        unlocked: unlockedKeys.includes("precipitation"), 
        color: "var(--text-secondary)" 
      },
    ];
  }, [unlockedKeys]);

  const experiments = [
    {
      id: "neutralization",
      title: "Acid-Base Neutralization",
      difficulty: "Beginner",
      desc: "Observe an exothermic neutralization reaction by mixing Hydrochloric Acid (HCl) and Sodium Hydroxide (NaOH). Verify the creation of saltwater and check the temperature change.",
      color: "var(--teal)",
      badge: "pH 7"
    },
    {
      id: "water",
      title: "Water Synthesis",
      difficulty: "Intermediate",
      desc: "Mix Hydrogen gas (H₂) and Oxygen gas (O₂) inside a sealed flask and apply intense Bunsen Burner heat. Observe the molecular fusion into liquid water.",
      color: "var(--amber)",
      badge: "Heat required"
    },
    {
      id: "precipitation",
      title: "Precipitation Reactions",
      difficulty: "Advanced",
      desc: "Perform a double displacement reaction. Combine Silver Nitrate (AgNO₃) and Sodium Chloride (NaCl) solutions to form a visible white Silver Chloride precipitate.",
      color: "var(--violet)",
      badge: "Double displacement"
    },
    {
      id: "sandbox",
      title: "Sandbox Laboratory",
      difficulty: "Expert",
      desc: "Access the full virtual lab space with no boundaries. Choose from our complete library of over 150 chemical elements and run custom equations.",
      color: "var(--blue)",
      badge: "Open exploration"
    }
  ];

  if (!user) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#050810", color: "#f59e0b" }}>
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 10% 20%, rgba(20, 184, 166, 0.02), transparent 40%), var(--bg-void)",
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
        padding: "36px 24px"
      }}>
        {/* Welcome Profile Bar */}
        <section style={{
          background: "rgba(13, 18, 32, 0.7)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          padding: "24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "36px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
        }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#fff", marginBottom: "6px" }}>
              Welcome back, {user.name}!
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Role: <strong style={{ color: "var(--amber)" }}>{user.role}</strong> &nbsp;·&nbsp; Logged in successfully
            </p>
          </div>

          {/* Exp progress bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "260px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              <span>Lab Experience (EXP)</span>
              <span style={{ color: "var(--teal)" }}>{user.exp} / 500 EXP</span>
            </div>
            <div style={{ height: "8px", background: "var(--bg-input)", borderRadius: "4px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ height: "100%", width: `${(user.exp / 500) * 100}%`, background: "linear-gradient(90deg, var(--teal), var(--amber))", borderRadius: "4px", transition: "width 0.4s ease" }}></div>
            </div>
          </div>
        </section>

        <div style={{
          display: "grid",
          gridTemplateColumns: "3fr 1fr",
          gap: "36px",
          alignItems: "start"
        }}>
          {/* Main Experiments Grid */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
              Available Lab Modules
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {experiments.map((exp) => {
                const isCompleted = unlockedKeys.includes(exp.id);
                return (
                  <div
                    key={exp.id}
                    style={{
                      background: "rgba(13, 18, 32, 0.65)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      borderLeft: `4px solid ${exp.color}`,
                      borderRadius: "12px",
                      padding: "24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "24px",
                      transition: "all 0.25s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(13, 18, 32, 0.9)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(13, 18, 32, 0.65)";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 750, color: "#fff" }}>
                          {exp.title}
                        </h3>
                        {isCompleted && (
                          <span style={{ 
                            fontSize: "9px", 
                            fontWeight: 700, 
                            padding: "2px 8px", 
                            borderRadius: "10px", 
                            background: "rgba(20, 184, 166, 0.15)", 
                            color: "var(--teal)",
                            border: "1px solid rgba(20, 184, 166, 0.3)"
                          }}>
                            ✓ Completed
                          </span>
                        )}
                        <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.05)", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                          {exp.difficulty}
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: exp.color }}>
                          {exp.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        {exp.desc}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (exp.id === "sandbox") {
                          router.push("/lab");
                        } else {
                          router.push(`/lab?experiment=${exp.id}`);
                        }
                      }}
                      className="btn btn-amber"
                      style={{
                        padding: "12px 24px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        background: exp.id === "sandbox" ? "linear-gradient(135deg, var(--blue) 0%, #1e40af 100%)" : "linear-gradient(135deg, var(--amber) 0%, var(--amber-dark) 100%)",
                        color: exp.id === "sandbox" ? "#fff" : "#000"
                      }}
                    >
                      {isCompleted ? "Redo Lab 🚀" : "Launch Lab 🚀"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sidebar Achievements */}
          <aside style={{
            background: "rgba(13, 18, 32, 0.75)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
            padding: "24px"
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px", color: "#fff" }}>
              Lab Achievements
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {achievements.map((ach, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (ach.id === "combustion") {
                      router.push("/lab");
                    } else {
                      router.push(`/lab?experiment=${ach.id}`);
                    }
                  }}
                  title={`Launch the ${ach.name} lab`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    opacity: ach.unlocked ? 1 : 0.5,
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                    e.currentTarget.style.borderColor = ach.color + "50";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.04)";
                  }}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: ach.unlocked ? `${ach.color}15` : "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    border: ach.unlocked ? `1px solid ${ach.color}35` : "1px solid transparent"
                  }}>
                    {ach.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: ach.unlocked ? "#fff" : "var(--text-secondary)" }}>
                      {ach.name}
                    </h4>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {ach.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
