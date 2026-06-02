"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; exp: number } | null>(null);

  useEffect(() => {
    // Check simulated auth status on mount
    const storedUser = localStorage.getItem("lab_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Ignore parsing errors
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("lab_user");
    setUser(null);
    router.push("/");
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/dashboard", protected: true },
    { label: "Periodic Table", path: "/periodic-table" },
    { label: "Safety Quiz", path: "/quiz" },
    { label: "Lab Guide", path: "/about" },
  ];

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 24px",
      background: "rgba(13, 18, 32, 0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border-amber)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)",
      position: "sticky",
      top: 0,
      zIndex: 1000
    }}>
      {/* Brand Logo */}
      <div 
        onClick={() => router.push("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer"
        }}
      >
        <div style={{
          width: "32px",
          height: "32px",
          background: "linear-gradient(135deg, var(--amber), var(--amber-dark))",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          boxShadow: "0 0 15px rgba(245, 158, 11, 0.4)"
        }}>
          ⚗️
        </div>
        <span style={{
          fontSize: "18px",
          fontWeight: 800,
          letterSpacing: "0.05em",
          background: "linear-gradient(135deg, #fff 0%, var(--amber-light) 60%, var(--amber) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          Virtual Lab
        </span>
      </div>

      {/* Nav Navigation */}
      <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                if (item.protected && !localStorage.getItem("lab_user")) {
                  router.push("/login?redirect=" + item.path);
                } else {
                  router.push(item.path);
                }
              }}
              style={{
                background: "none",
                border: "none",
                fontFamily: "inherit",
                fontSize: "14px",
                fontWeight: 600,
                color: isActive ? "var(--amber)" : "var(--text-secondary)",
                cursor: "pointer",
                padding: "6px 4px",
                borderBottom: isActive ? "2px solid var(--amber)" : "2px solid transparent",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          className="btn btn-amber"
          onClick={() => {
            if (!localStorage.getItem("lab_user")) {
              router.push("/login?redirect=/lab");
            } else {
              router.push("/lab");
            }
          }}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            boxShadow: "0 0 15px rgba(245, 158, 11, 0.25)"
          }}
        >
          🚀 Launch Lab
        </button>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderLeft: "1px solid var(--border-subtle)", paddingLeft: "16px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                {user.name}
              </div>
              <div style={{ fontSize: "10px", color: "var(--teal)", fontWeight: 600 }}>
                EXP: {user.exp}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(244, 63, 94, 0.15)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                color: "var(--rose)",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(244, 63, 94, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(244, 63, 94, 0.15)";
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="btn btn-ghost"
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
