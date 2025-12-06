"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Toaster only on client side to avoid SSR/build issues
const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((mod) => ({ default: mod.Toaster })),
  {
    ssr: false,
  }
);

export function ClientToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <Toaster />;
}
