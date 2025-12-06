"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: "20px", fontFamily: "system-ui", maxWidth: "600px", margin: "50px auto" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Something went wrong!</h1>
          <p style={{ marginBottom: "20px", color: "#666" }}>An unexpected error occurred.</p>
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
