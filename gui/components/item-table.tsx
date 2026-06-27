"use client";

import { useState } from "react";
import { FoodItem } from "@/lib/db";

interface ItemTableProps {
  items: FoodItem[];
  onRefresh: () => void;
}

export function ItemTable({ items, onRefresh }: ItemTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");

  const handleEdit = (item: FoodItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDate(item.expiry_date);
  };

  const handleSave = async (id: number) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, expiryDate: editDate }),
      });

      if (response.ok) {
        setEditingId(null);
        onRefresh();
      }
    } catch (error) {
      console.error("Error saving item:", error);
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
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ backgroundColor: "#e0e0e0" }}>
          <th style={{ padding: "0.5rem", textAlign: "left" }}>Name</th>
          <th style={{ padding: "0.5rem", textAlign: "left" }}>Expires</th>
          <th style={{ padding: "0.5rem", textAlign: "left" }}>Source</th>
          <th style={{ padding: "0.5rem", textAlign: "center" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} style={{ borderBottom: "1px solid #ddd" }}>
            <td style={{ padding: "0.5rem" }}>
              {editingId === item.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "0.25rem" }}
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
                  value={item.expiry_date}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{ padding: "0.25rem" }}
                />
              ) : (
                item.expiry_date
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
                    style={{ marginRight: "0.5rem", cursor: "pointer" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(item)}
                    style={{ marginRight: "0.5rem", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ cursor: "pointer", color: "red" }}
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
  );
}
