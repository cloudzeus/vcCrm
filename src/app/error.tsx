"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-destructive">
          Something went wrong!
        </h1>
        <p className="text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="text-sm text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

