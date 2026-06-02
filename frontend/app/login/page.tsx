"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);

    // Simulate authenticating for 800ms
    setTimeout(() => {
      setLoading(false);
      // Let's accept any non-empty login, but suggest 'admin' / 'admin123'
      const mockUser = {
        name: username.charAt(0).toUpperCase() + username.slice(1),
        role: username.toLowerCase() === "admin" ? "Lab Instructor" : "Student Researcher",
        exp: 320,
      };
      
      localStorage.setItem("lab_user", JSON.stringify(mockUser));
      router.push(redirect);
    }, 800);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at center, rgba(245, 158, 11, 0.02), transparent 70%), var(--bg-void)",
      display: "flex",
      flexDirection: "column",
      color: "var(--text-primary)"
    }}>
      <Navbar />

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative"
      }}>
        {/* Glassmorphic Login Card */}
        <div style={{
          background: "rgba(13, 18, 32, 0.75)",
          border: "1px solid var(--border-amber)",
          borderRadius: "16px",
          padding: "36px 32px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px var(--amber-glow)",
          backdropFilter: "blur(16px)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>🧪</span>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>
              Sign In to Lab Portal
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
              Access your chemistry workspace and saved achievements
            </p>
          </div>

          {error && (
            <div style={{
              background: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "var(--rose)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "20px"
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Username Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#fff",
                  outline: "none",
                  transition: "all 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--amber-border)"}
                onBlur={(e) => e.target.style.borderColor = "var(--glass-border)"}
              />
            </div>

            {/* Password Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    padding: "10px 40px 10px 14px",
                    fontSize: "13px",
                    color: "#fff",
                    outline: "none",
                    width: "100%",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--amber-border)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--glass-border)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-amber"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "14px",
                borderRadius: "8px",
                justifyContent: "center",
                marginTop: "10px"
              }}
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>

          {/* Simulated Login Helper */}
          <div style={{
            marginTop: "24px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "11px",
            color: "var(--text-secondary)"
          }}>
            💡 <strong>Sandbox Mode Hint:</strong> Use username <code style={{ color: "var(--amber)", fontFamily: "monospace" }}>admin</code> and password <code style={{ color: "var(--amber)", fontFamily: "monospace" }}>admin123</code> to login as an instructor, or type any user credentials to sign in.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#050810", color: "#f59e0b" }}>
        <h2>Loading Login Portal...</h2>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
