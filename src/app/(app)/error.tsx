"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <h1 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h1>
        </div>
        <p className="text-muted-foreground">
          We encountered an error while processing your request. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

