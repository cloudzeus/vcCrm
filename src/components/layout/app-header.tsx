"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

interface AppHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" suppressHydrationWarning>
      <div className="container flex h-10 items-center justify-end px-4">
        <SidebarTrigger className="lg:hidden" />
      </div>
    </header>
  );
}

