import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-2 p-3 md:p-4 bg-[#f5f5f5]" suppressHydrationWarning>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

