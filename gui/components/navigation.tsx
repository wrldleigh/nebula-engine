"use client";

import { useState } from "react";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      style={{
        padding: "1rem",
        backgroundColor: "rgba(20, 10, 35, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "2px solid rgba(255, 215, 0, 0.3)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              fontSize: "2.5rem",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s",
              transform: isOpen ? "scale(1.1)" : "scale(1)",
              filter: isOpen ? "drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))" : "none",
              lineHeight: 1,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.filter = "drop-shadow(0 0 10px rgba(255, 237, 74, 0.8))";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.filter = isOpen ? "drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))" : "none";
            }}
          >
            🍔
          </button>
          <h1 style={{ margin: 0, color: "#ffd700", fontSize: "1.5rem" }}>
            Nebula Engine
          </h1>
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid rgba(0, 217, 255, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            animation: "slideDown 0.3s ease-out",
          }}
        >
          <a
            href="/"
            onClick={() => setIsOpen(false)}
            style={{
              color: "#00d9ff",
              textDecoration: "none",
              fontWeight: 500,
              padding: "0.5rem 0",
              transition: "color 0.2s",
              display: "block",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#ffed4e")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#00d9ff")}
          >
            📊 Dashboard
          </a>
          <a
            href="/settings"
            onClick={() => setIsOpen(false)}
            style={{
              color: "#00d9ff",
              textDecoration: "none",
              fontWeight: 500,
              padding: "0.5rem 0",
              transition: "color 0.2s",
              display: "block",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#ffed4e")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#00d9ff")}
          >
            ⚙️ Settings
          </a>
        </div>
      )}
    </nav>
  );
}
