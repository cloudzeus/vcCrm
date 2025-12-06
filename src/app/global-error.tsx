"use client";

// Force dynamic rendering to skip static generation and prevent build errors
export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Error</title>
      </head>
      <body>
        <div
          style={{
            padding: "20px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            maxWidth: "600px",
            margin: "0 auto",
            marginTop: "50px",
          }}
        >
          <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Something went wrong!</h1>
          <p style={{ marginBottom: "20px", color: "#666" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
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

