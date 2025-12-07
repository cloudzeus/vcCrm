import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 shadow-lg text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="text-muted-foreground">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

