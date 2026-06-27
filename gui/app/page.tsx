"use client";

import { useEffect, useState } from "react";
import { FoodItem } from "@/lib/db";
import { ItemTable } from "@/components/item-table";
import { BulkAdd } from "@/components/bulk-add";

export default function Dashboard() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = async () => {
    try {
      const response = await fetch("/api/items");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const expiringToday = items.filter(
    (item) => item.expiry_date === new Date().toISOString().split("T")[0]
  );

  const expiredItems = items.filter(
    (item) => item.expiry_date < new Date().toISOString().split("T")[0]
  );

  return (
    <div>
      <h2>Food Inventory</h2>

      {expiringToday.length > 0 && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#ffe0e0",
            marginBottom: "1rem",
            borderRadius: "4px",
          }}
        >
          <strong>🔴 {expiringToday.length} items expiring TODAY!</strong>
          <ul>
            {expiringToday.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </div>
      )}

      {expiredItems.length > 0 && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#ff9999",
            marginBottom: "1rem",
            borderRadius: "4px",
            color: "white",
          }}
        >
          <strong>⚠️ {expiredItems.length} items have expired</strong>
        </div>
      )}

      <BulkAdd onAdd={loadItems} />

      {isLoading ? (
        <p>Loading items...</p>
      ) : items.length === 0 ? (
        <p>No items tracked yet. Add some using the form above!</p>
      ) : (
        <>
          <p>Total items: {items.length}</p>
          <ItemTable items={items} onRefresh={loadItems} />
        </>
      )}
    </div>
  );
}
