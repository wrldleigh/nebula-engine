"use client";

import { useState } from "react";

interface BulkAddProps {
  onAdd: () => void;
}

export function BulkAdd({ onAdd }: BulkAddProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let addedCount = 0;
    let skippedCount = 0;

    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const expiryDate = parts[parts.length - 1];
        const name = parts.slice(0, -1).join(" ");

        try {
          const response = await fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, expiryDate }),
          });

          if (response.ok) {
            const data = (await response.json()) as any;
            if (data.duplicate) {
              skippedCount++;
            } else {
              addedCount++;
            }
          }
        } catch (error) {
          console.error("Error adding item:", error);
        }
      }
    }

    let msg = `Added ${addedCount} items`;
    if (skippedCount > 0) {
      msg += ` (${skippedCount} duplicates skipped)`;
    }
    setMessage(msg);
    setText("");
    setIsLoading(false);
    onAdd();
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          <strong>Bulk Add Items (one per line)</strong>
          <br />
          <small>Format: item-name YYYY-MM-DD or item-name 3d</small>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="chicken 2026-07-03&#10;milk 3d&#10;eggs july 5"
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "0.5rem",
            fontFamily: "monospace",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || text.trim().length === 0}
        style={{
          padding: "0.5rem 1rem",
          cursor: isLoading ? "wait" : "pointer",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        {isLoading ? "Adding..." : "Add Items"}
      </button>

      {message && (
        <p style={{ marginTop: "0.5rem", color: "green" }}>{message}</p>
      )}
    </form>
  );
}
