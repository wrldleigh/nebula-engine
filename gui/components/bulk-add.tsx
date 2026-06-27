"use client";

import { useState } from "react";
import { formatDateISO } from "@/lib/dateUtils";

interface BulkAddProps {
  onAdd: () => void;
}

export function BulkAdd({ onAdd }: BulkAddProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [message_type, setMessageType] = useState<"success" | "error">("success");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const failedItems: string[] = [];

    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 2) {
        failedCount++;
        failedItems.push(line);
        continue;
      }

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
          } else if (data.error) {
            failedCount++;
            failedItems.push(`${name}: ${data.error}`);
          } else {
            addedCount++;
          }
        } else {
          failedCount++;
          failedItems.push(`${name}: invalid format`);
        }
      } catch (error) {
        failedCount++;
        failedItems.push(`${name}: network error`);
      }
    }

    let msg = `✅ Added ${addedCount} items`;
    if (skippedCount > 0) {
      msg += `, skipped ${skippedCount} duplicates`;
    }
    if (failedCount > 0) {
      msg += `, ${failedCount} failed`;
      setMessageType("error");
    } else {
      setMessageType("success");
    }

    setMessage(msg);
    setText("");
    setIsLoading(false);
    onAdd();

    if (addedCount > 0) {
      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "#ffed4e" }}>
          <strong>Bulk Add Items (one per line)</strong>
          <br />
          <small style={{ color: "#00d9ff" }}>Format: item-name DD-MM-YYYY or item-name 3d</small>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="chicken 03-07-2026&#10;milk 3d&#10;eggs july 5"
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "0.5rem",
            fontFamily: "monospace",
            borderRadius: "4px",
            border: "2px solid #00d9ff",
            backgroundColor: "rgba(40, 20, 60, 0.8)",
            color: "#ffffff",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || text.trim().length === 0}
        style={{
          padding: "0.5rem 1rem",
          cursor: isLoading ? "wait" : "pointer",
          backgroundColor: "#ffd700",
          color: "#000",
          border: "none",
          borderRadius: "4px",
          fontWeight: "bold",
          transition: "background-color 0.2s",
          opacity: isLoading || text.trim().length === 0 ? 0.6 : 1,
        }}
        onMouseOver={(e) => !isLoading && text.trim().length > 0 && (e.currentTarget.style.backgroundColor = "#ffed4e")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffd700")}
      >
        {isLoading ? "Adding..." : "Add Items"}
      </button>

      {message && (
        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem",
            borderRadius: "4px",
            backgroundColor: message_type === "success" ? "rgba(0, 217, 100, 0.15)" : "rgba(255, 50, 50, 0.2)",
            color: message_type === "success" ? "#00ff7f" : "#ff9999",
            border: `1px solid ${message_type === "success" ? "#00d966" : "#ff6464"}`,
            fontSize: "0.9rem",
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
}
