"use client";

// Minimal not-found page that doesn't use any React context or hooks
// This prevents build errors during prerender
export default function NotFound() {
  return (
    <html>
      <body>
        <div style={{ padding: "20px", fontFamily: "system-ui", maxWidth: "600px", margin: "50px auto" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>404 - Page Not Found</h1>
          <p style={{ marginBottom: "20px", color: "#666" }}>The page you are looking for does not exist.</p>
          <a
            href="/"
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Go Home
          </a>
        </div>
      </body>
    </html>
  );
}
