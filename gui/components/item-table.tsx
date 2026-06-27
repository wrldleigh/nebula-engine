"use client";

import { useState } from "react";
import { FoodItem } from "@/lib/db";
import { formatDateUK, isoToHtmlDateInput, htmlDateInputToISO } from "@/lib/dateUtils";

interface ItemTableProps {
  items: FoodItem[];
  onRefresh: () => void;
}

export function ItemTable({ items, onRefresh }: ItemTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [error, setError] = useState("");

  const handleEdit = (item: FoodItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDate(item.expiry_date);
  };

  const handleSave = async (id: number) => {
    setError("");
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, expiryDate: editDate }),
      });

      if (response.ok) {
        setEditingId(null);
        onRefresh();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save item");
      }
    } catch (error) {
      console.error("Error saving item:", error);
      setError("Error saving item");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this item?")) return;

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const getExpiryColor = (expiryDate: string) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    if (expiryDate === today) return "#ff4444";
    if (expiryDate === tomorrow) return "#ffaa00";
    if (expiryDate < today) return "#cc0000";
    return "#44aa44";
  };

  return (
    <div>
      {error && (
        <div
          style={{
            padding: "0.5rem",
            marginBottom: "1rem",
            backgroundColor: "rgba(255, 50, 50, 0.2)",
            color: "#ff9999",
            border: "1px solid #ff6464",
            borderRadius: "4px",
            fontSize: "0.9rem",
          }}
        >
          ❌ {error}
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ backgroundColor: "rgba(255, 215, 0, 0.1)", borderBottom: "2px solid #ffd700" }}>
          <th style={{ padding: "0.5rem", textAlign: "left", color: "#ffed4e" }}>Name</th>
          <th style={{ padding: "0.5rem", textAlign: "left", color: "#ffed4e" }}>Expires</th>
          <th style={{ padding: "0.5rem", textAlign: "left", color: "#ffed4e" }}>Source</th>
          <th style={{ padding: "0.5rem", textAlign: "center", color: "#ffed4e" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} style={{ borderBottom: "1px solid rgba(0, 217, 255, 0.2)", backgroundColor: "rgba(20, 10, 35, 0.3)" }}>
            <td style={{ padding: "0.5rem", color: "#ffffff" }}>
              {editingId === item.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.25rem",
                    backgroundColor: "rgba(40, 20, 60, 0.8)",
                    color: "#ffffff",
                    border: "1px solid #00d9ff",
                    borderRadius: "4px",
                  }}
                />
              ) : (
                item.name
              )}
            </td>
            <td
              style={{
                padding: "0.5rem",
                color: getExpiryColor(item.expiry_date),
                fontWeight: "bold",
              }}
            >
              {editingId === item.id ? (
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{
                    padding: "0.25rem",
                    backgroundColor: "rgba(40, 20, 60, 0.8)",
                    color: "#ffffff",
                    border: "1px solid #00d9ff",
                    borderRadius: "4px",
                  }}
                />
              ) : (
                formatDateUK(item.expiry_date)
              )}
            </td>
            <td style={{ padding: "0.5rem", fontSize: "0.9rem" }}>
              {item.source}
            </td>
            <td style={{ padding: "0.5rem", textAlign: "center" }}>
              {editingId === item.id ? (
                <>
                  <button
                    onClick={() => handleSave(item.id)}
                    style={{
                      marginRight: "0.5rem",
                      cursor: "pointer",
                      backgroundColor: "#00d966",
                      color: "white",
                      border: "none",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#00ff7f")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#00d966")}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "rgba(100, 100, 150, 0.6)",
                      color: "#00d9ff",
                      border: "1px solid #00d9ff",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(item)}
                    style={{
                      marginRight: "0.5rem",
                      cursor: "pointer",
                      backgroundColor: "#ffd700",
                      color: "#000",
                      border: "none",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#ffed4e")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffd700")}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#ff6464",
                      color: "white",
                      border: "none",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#ff3232")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ff6464")}
                  >
                    Delete
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
