"use client";

import { useEffect, useState } from "react";

export default function Settings() {
  const [reminderTimes, setReminderTimes] = useState("07:00,18:00");
  const [timezone, setTimezone] = useState("Europe/London");
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const settings = await response.json();

      if (settings.reminder_times) {
        setReminderTimes(settings.reminder_times);
      }
      if (settings.timezone) {
        setTimezone(settings.timezone);
      }
      if (settings.telegram_enabled !== undefined) {
        setTelegramEnabled(settings.telegram_enabled === "true");
      }
      if (settings.email_enabled !== undefined) {
        setEmailEnabled(settings.email_enabled === "true");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminder_times: reminderTimes,
          timezone,
          telegram_enabled: String(telegramEnabled),
          email_enabled: String(emailEnabled),
        }),
      });

      if (response.ok) {
        setMessage("Settings saved!");
      } else {
        setMessage("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2>Settings</h2>

      <form onSubmit={handleSave} style={{ maxWidth: "600px" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            <strong>Reminder Times</strong>
            <br />
            <small>Comma-separated 24-hour format (e.g., 07:00,18:00)</small>
          </label>
          <input
            type="text"
            value={reminderTimes}
            onChange={(e) => setReminderTimes(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            <strong>Timezone</strong>
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          >
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
            <option value="America/New_York">America/New_York (EST/EDT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
            <option value="UTC">UTC</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={telegramEnabled}
              onChange={(e) => setTelegramEnabled(e.target.checked)}
            />
            <span>Enable Telegram notifications</span>
          </label>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
            />
            <span>Enable Email notifications</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          style={{
            padding: "0.5rem 1rem",
            cursor: isSaving ? "wait" : "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>

        {message && (
          <p style={{ marginTop: "1rem", color: message.includes("saved") ? "green" : "red" }}>
            {message}
          </p>
        )}
      </form>

      <hr style={{ margin: "2rem 0" }} />

      <div style={{ backgroundColor: "#f9f9f9", padding: "1rem", borderRadius: "4px" }}>
        <h3>About</h3>
        <p>
          <strong>Nebula Engine</strong> is a food expiry tracker that prevents waste.
        </p>
        <ul>
          <li>Add items via Telegram, email, or this dashboard</li>
          <li>Receive daily reminders at configured times</li>
          <li>View and manage your inventory here</li>
        </ul>
      </div>
    </div>
  );
}
