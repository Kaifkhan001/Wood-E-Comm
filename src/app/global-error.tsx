"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#e7e8e2", color: "#211f1b", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>We hit a problem.</h1>
          <p style={{ color: "#69655c", lineHeight: 1.6 }}>Please reload the page. If it keeps happening, try again in a few minutes.</p>
          <button onClick={reset} style={{ background: "#1f3a32", color: "#f6f6f2", border: 0, borderRadius: 999, padding: "12px 24px", fontSize: 15, cursor: "pointer" }}>Reload</button>
        </div>
      </body>
    </html>
  );
}
