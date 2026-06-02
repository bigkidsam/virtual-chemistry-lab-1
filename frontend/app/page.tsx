"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: "⚗️",
      title: "Real-Time Solver",
      desc: "Simulate advanced thermodynamics, liquid spills, gas releases, and color shifts instantly based on authentic reaction stoichiometry.",
      color: "var(--amber)",
      shadow: "var(--shadow-amber)"
    },
    {
      icon: "🖐️",
      title: "Hand Gesture Control",
      desc: "Interactive MediaPipe integration detects hand movements and finger pinches. Grab, pour, and control equipment without a mouse.",
      color: "var(--teal)",
      shadow: "var(--shadow-teal)"
    },
    {
      icon: "🫰",
      title: "Audio Snap Ignition",
      desc: "Acoustic signal processing detects snaps in real-time. Turn Bunsen burners on with a single snap, and off with a double snap.",
      color: "var(--violet)",
      shadow: "0px 0px 20px rgba(139, 92, 246, 0.25)"
    },
    {
      icon: "📋",
      title: "150+ Chemical Database",
      desc: "Comprehensive database spanning strong acids, bases, metal elements, noble gases, and indicator solutions.",
      color: "var(--blue)",
      shadow: "0px 0px 20px rgba(59, 130, 246, 0.25)"
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top right, rgba(245, 158, 11, 0.03), transparent), radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.03), transparent), var(--bg-void)",
      display: "flex",
      flexDirection: "column",
      color: "var(--text-primary)",
      overflowY: "auto"
    }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 24px 60px",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative"
      }}>
        {/* Glow Badge */}
        <div style={{
          background: "var(--amber-glow)",
          border: "1px solid var(--border-amber)",
          borderRadius: "30px",
          padding: "6px 18px",
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--amber)",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          marginBottom: "24px",
          boxShadow: "0 0 15px rgba(245, 158, 11, 0.1)"
        }}>
          ✨ Next-Gen Science Education
        </div>

        <h1 style={{
          fontSize: "52px",
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          marginBottom: "20px",
          background: "linear-gradient(to right, #ffffff, #e2e8f0, var(--amber-light))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          The Interactive Virtual <br />
          <span style={{
            background: "linear-gradient(135deg, var(--amber) 0%, var(--teal) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Chemistry Laboratory
          </span>
        </h1>

        <p style={{
          fontSize: "18px",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          maxWidth: "680px",
          marginBottom: "40px"
        }}>
          Experience realistic reactions, thermodynamics, and physical state transitions. Control glassware and heat sources using advanced hand tracking gestures or acoustic snap signals.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => {
              if (localStorage.getItem("lab_user")) {
                router.push("/lab");
              } else {
                router.push("/login?redirect=/lab");
              }
            }}
            className="btn btn-amber"
            style={{
              padding: "16px 36px",
              fontSize: "15px",
              borderRadius: "10px",
              boxShadow: "0 0 25px rgba(245, 158, 11, 0.3)"
            }}
          >
            🚀 Launch Sandbox Lab
          </button>
          <button
            onClick={() => {
              if (localStorage.getItem("lab_user")) {
                router.push("/dashboard");
              } else {
                router.push("/login?redirect=/dashboard");
              }
            }}
            className="btn btn-ghost"
            style={{
              padding: "16px 36px",
              fontSize: "15px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.03)"
            }}
          >
            📊 Access Dashboard
          </button>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 24px 80px",
        width: "100%"
      }}>
        <h2 style={{
          textAlign: "center",
          fontSize: "28px",
          fontWeight: 800,
          marginBottom: "48px",
          letterSpacing: "0.02em"
        }}>
          Powered By Cutting-Edge Tech
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px"
        }}>
          {features.map((feat, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(13, 18, 32, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                transition: "all 0.3s ease",
                cursor: "default",
                position: "relative"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.borderColor = feat.color;
                e.currentTarget.style.boxShadow = feat.shadow;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: `rgba(${feat.color === "var(--amber)" ? "245, 158, 11" : feat.color === "var(--teal)" ? "20, 184, 166" : feat.color === "var(--violet)" ? "139, 92, 246" : "59, 130, 246"}, 0.1)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                color: feat.color,
                border: `1px solid ${feat.color}40`
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 750, color: "#fff" }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: "auto",
        borderTop: "1px solid var(--border-subtle)",
        padding: "24px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--text-muted)"
      }}>
        © 2026 Virtual Chemistry Laboratory. Built with Next.js, OpenCV, and MediaPipe.
      </footer>
    </div>
  );
}
