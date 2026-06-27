import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nebula Engine",
  description: "Food expiry tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: "1rem", backgroundColor: "#f0f0f0" }}>
          <h1 style={{ margin: 0, marginBottom: "0.5rem" }}>🍔 Nebula Engine</h1>
          <div style={{ display: "flex", gap: "1rem" }}>
            <a href="/">Dashboard</a>
            <a href="/settings">Settings</a>
          </div>
        </nav>
        <main style={{ padding: "1rem" }}>{children}</main>
      </body>
    </html>
  );
}
