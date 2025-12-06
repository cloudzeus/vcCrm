"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Megaphone,
  Users,
  Building2,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Star,
  Mail,
  Puzzle,
  Grid3x3,
  CheckSquare,
  MoreVertical,
  User,
  LogOut,
  Briefcase,
  TrendingUp,
  UserCog,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ProfileEditModal } from "@/components/forms/profile-edit-modal";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Calendar",
    icon: Calendar,
    href: "/calendar",
  },
  {
    title: "Customers",
    icon: Briefcase,
    href: "/companies",
  },
  {
    title: "Suppliers",
    icon: Building2,
    href: "/suppliers",
  },
  {
    title: "Contacts",
    icon: User,
    href: "/contacts",
  },
  {
    title: "Users",
    icon: UserCog,
    href: "/users",
  },
  {
    title: "Leads",
    icon: TrendingUp,
    href: "/leads",
  },
  {
    title: "Campaigns",
    icon: Megaphone,
    href: "/campaigns",
  },
  {
    title: "Influencers",
    icon: Users,
    href: "/influencers",
  },
  {
    title: "Brands",
    icon: Building2,
    href: "/brands",
  },
  {
    title: "Reports",
    icon: BarChart3,
    href: "/reports",
  },
];

const favoriteItems = [
  { title: "Opportunity Stages", icon: Star },
  { title: "Key Metrics", icon: Star },
  { title: "Product plan", icon: Star },
];

const marketingItems = [
  { title: "Product", icon: Search },
  { title: "Emails", icon: Mail },
  { title: "Integration", icon: Puzzle },
  { title: "Widget", icon: Grid3x3 },
  { title: "Task", icon: CheckSquare },
];

const dataSyncItems = [
  { title: "Video Conference", icon: Video, href: "/data-sync/video-conference" },
];

interface AppSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [marketingOpen, setMarketingOpen] = useState(true);
  const [dataSyncOpen, setDataSyncOpen] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  const handleEditProfile = () => {
    setIsProfileModalOpen(true);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-white">
      <SidebarContent className="p-4 overflow-y-auto">
        {/* Logo/Brand */}
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-md bg-[#142030] flex items-center justify-center">
            <span className="text-white text-sm font-light">V</span>
          </div>
          <span className="text-sm font-light text-foreground group-data-[collapsible=icon]:hidden">VCulture</span>
        </div>

        {/* Search Bar */}
        <div className="mb-4 relative group-data-[collapsible=icon]:hidden">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search here"
            className="pl-8 h-8 text-xs bg-[#f5f5f5] border-0"
          />
        </div>

        {/* Main Navigation */}
        <div className="space-y-1 mb-4">
          {mainMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-md text-xs font-light transition-colors group-data-[collapsible=icon]:justify-center",
                    isActive
                      ? "bg-[#142030] text-white"
                      : "bg-[#f5f5f5] text-foreground hover:bg-[#E9D8C8]/30"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Favorite Section */}
        <div className="mb-4">
          <button
            onClick={() => setFavoritesOpen(!favoritesOpen)}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-light text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:justify-center"
          >
            <span className="group-data-[collapsible=icon]:hidden">Favorite</span>
            {favoritesOpen ? (
              <ChevronDown className="h-3 w-3 group-data-[collapsible=icon]:hidden" />
            ) : (
              <ChevronRight className="h-3 w-3 group-data-[collapsible=icon]:hidden" />
            )}
          </button>
          {favoritesOpen && (
            <div className="space-y-1 mt-1 group-data-[collapsible=icon]:hidden">
              {favoriteItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs font-light text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="h-2 w-2 rounded-sm bg-[#85A3B2] shrink-0" />
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Marketing Section */}
        <div className="mb-4">
          <button
            onClick={() => setMarketingOpen(!marketingOpen)}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-light text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:justify-center"
          >
            <span className="group-data-[collapsible=icon]:hidden">Marketing</span>
            {marketingOpen ? (
              <ChevronDown className="h-3 w-3 group-data-[collapsible=icon]:hidden" />
            ) : (
              <ChevronRight className="h-3 w-3 group-data-[collapsible=icon]:hidden" />
            )}
          </button>
          {marketingOpen && (
            <div className="space-y-1 mt-1 group-data-[collapsible=icon]:hidden">
              {marketingItems.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs font-light text-muted-foreground hover:text-foreground transition-colors"
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Sync Section */}
        <div className="mb-4">
          <button
            onClick={() => setDataSyncOpen(!dataSyncOpen)}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-light text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:justify-center"
          >
            <span className="group-data-[collapsible=icon]:hidden">Data Sync</span>
            {dataSyncOpen ? (
              <ChevronDown className="h-3 w-3 group-data-[collapsible=icon]:hidden" />
            ) : (
              <ChevronRight className="h-3 w-3 group-data-[collapsible=icon]:hidden" />
            )}
          </button>
          {dataSyncOpen && (
            <div className="space-y-1 mt-1 group-data-[collapsible=icon]:hidden">
              {dataSyncItems.map((item) => (
                <Link key={item.title} href={item.href}>
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-light text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </SidebarContent>

      {/* User Profile Footer - Dark Card */}
      <SidebarFooter className="p-2 border-t border-border/60">
        <div className="bg-[#142030] rounded-md p-1.5 shadow-sm">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-7 w-7 border border-white/20 shrink-0">
              <AvatarImage src={user?.image || undefined} />
              <AvatarFallback className="text-[10px] bg-[#85A3B2] text-white font-light">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-xs font-light text-white truncate leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] font-light text-white/70 truncate leading-tight">
                Lead Manager
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0 text-white hover:bg-white/10 hover:text-white p-0"
                  suppressHydrationWarning
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={handleEditProfile}
                  className="text-xs font-light cursor-pointer"
                >
                  <User className="h-3 w-3 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  variant="destructive"
                  className="text-xs font-light cursor-pointer"
                >
                  <LogOut className="h-3 w-3 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SidebarFooter>

      <ProfileEditModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        initialData={user}
      />
    </Sidebar>
  );
}

