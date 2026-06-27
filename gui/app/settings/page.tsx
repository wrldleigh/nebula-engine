"use client";

import { useEffect, useState } from "react";

export default function Settings() {
  const [reminderTimes, setReminderTimes] = useState("07:00,18:00");
  const [timezone, setTimezone] = useState("Europe/London");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [timeError, setTimeError] = useState("");

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
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const validateReminderTimes = (times: string): boolean => {
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    return times.split(",").every(time => timeRegex.test(time.trim()));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimeError("");
    setMessage("");

    if (!validateReminderTimes(reminderTimes)) {
      setTimeError("Invalid time format. Use HH:MM (24-hour), comma-separated (e.g., 07:00,18:00)");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminder_times: reminderTimes,
          timezone,
        }),
      });

      if (response.ok) {
        setMessage("✅ Settings saved!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("❌ Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ color: "#ffed4e" }}>Settings</h2>

      <form onSubmit={handleSave} style={{ maxWidth: "600px" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#ffed4e" }}>
            <strong>Reminder Times</strong>
            <br />
            <small style={{ color: "#00d9ff" }}>Comma-separated 24-hour format (e.g., 07:00,18:00)</small>
          </label>
          <input
            type="text"
            value={reminderTimes}
            onChange={(e) => {
              setReminderTimes(e.target.value);
              setTimeError("");
            }}
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: "rgba(40, 20, 60, 0.8)",
              color: "#ffffff",
              borderColor: timeError ? "#ff6464" : "#00d9ff",
              borderWidth: "2px",
              borderStyle: "solid",
              borderRadius: "4px",
            }}
          />
          {timeError && (
            <small style={{ color: "red", display: "block", marginTop: "0.25rem" }}>
              {timeError}
            </small>
          )}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#ffed4e" }}>
            <strong>Timezone</strong>
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: "rgba(40, 20, 60, 0.8)",
              color: "#ffffff",
              border: "2px solid #00d9ff",
              borderRadius: "4px",
            }}
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


        <button
          type="submit"
          disabled={isSaving}
          style={{
            padding: "0.5rem 1rem",
            cursor: isSaving ? "wait" : "pointer",
            backgroundColor: "#ffd700",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            transition: "background-color 0.2s",
            opacity: isSaving ? 0.6 : 1,
          }}
          onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = "#ffed4e")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffd700")}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>

        {message && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.5rem",
              borderRadius: "4px",
              backgroundColor: message.includes("saved") ? "rgba(0, 217, 100, 0.15)" : "rgba(255, 50, 50, 0.2)",
              color: message.includes("saved") ? "#00ff7f" : "#ff9999",
              border: `1px solid ${message.includes("saved") ? "#00d966" : "#ff6464"}`,
            }}
          >
            {message}
          </div>
        )}
      </form>

      <hr style={{ margin: "2rem 0", borderColor: "rgba(0, 217, 255, 0.2)" }} />

      <div style={{ backgroundColor: "rgba(255, 215, 0, 0.08)", padding: "1rem", borderRadius: "8px", border: "1px solid #ffd700" }}>
        <h3 style={{ color: "#ffed4e" }}>About</h3>
        <p style={{ color: "#ffffff" }}>
          <strong>Nebula Engine</strong> is a cosmic food expiry tracker that prevents waste.
        </p>
        <ul style={{ color: "#00d9ff" }}>
          <li>Add items via Telegram or this dashboard</li>
          <li>Receive daily Telegram reminders at configured times</li>
          <li>View and manage your inventory here</li>
        </ul>
      </div>
    </div>
  );
}
