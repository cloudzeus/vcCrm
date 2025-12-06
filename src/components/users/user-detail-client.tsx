"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Edit,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { UserFormModal } from "@/components/forms/user-form-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
  organizationId?: string | null;
  emailVerified?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserListItem {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

interface UserDetailClientProps {
  user: UserDetail;
  allUsers: UserListItem[];
}

const roleLabels: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  INFLUENCER: "Influencer",
  CLIENT: "Client",
};

const roleColors: Record<string, string> = {
  SUPERADMIN: "bg-purple-100 text-purple-800",
  OWNER: "bg-blue-100 text-blue-800",
  MANAGER: "bg-green-100 text-green-800",
  INFLUENCER: "bg-orange-100 text-orange-800",
  CLIENT: "bg-gray-100 text-gray-800",
};

// Color palette for avatars matching the AvatarFallback component
const getAvatarColor = (initial: string, isActive: boolean = false) => {
  const colors = [
    { bg: "bg-[#85A3B2]", text: "text-white", activeBg: "bg-[#85A3B2]/80" }, // Grauzone - blue-grey
    { bg: "bg-[#732553]", text: "text-white", activeBg: "bg-[#732553]/80" }, // Pico Eggplant - purple
    { bg: "bg-[#142030]", text: "text-white", activeBg: "bg-[#142030]/80" }, // Hēi Sè Black
    { bg: "bg-[#E9D8C8]", text: "text-[#142030]", activeBg: "bg-[#E9D8C8]/80" }, // Siesta Tan - beige
  ];
  const index = (initial.charCodeAt(0) || 0) % colors.length;
  const color = colors[index];
  // For active items in dark sidebar, use white/20 for better visibility
  return isActive ? "bg-white/20" : color.bg;
};

const getAvatarTextColor = (initial: string) => {
  const colors = [
    { text: "text-white" }, // Grauzone
    { text: "text-white" }, // Pico Eggplant
    { text: "text-white" }, // Hēi Sè Black
    { text: "text-[#142030]" }, // Siesta Tan
  ];
  const index = (initial.charCodeAt(0) || 0) % colors.length;
  return colors[index].text;
};

export function UserDetailClient({ user, allUsers }: UserDetailClientProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      const result = await response.json();
      setCurrentUser(result);
      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
      throw error;
    }
  };

  const displayName = currentUser.name || currentUser.email;
  const initials = displayName.charAt(0).toUpperCase();
  const mainAvatarBgColor = getAvatarColor(initials);
  const mainAvatarTextColor = getAvatarTextColor(initials);

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left Sidebar - User List */}
      <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-light">USERS</CardTitle>
                <CardDescription className="text-xs">
                  Users in your organization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {allUsers.map((item) => {
              const isActive = item.id === currentUser.id;
              const itemDisplayName = item.name || item.email;
              const itemInitials = itemDisplayName.charAt(0).toUpperCase();
              const avatarBgColor = getAvatarColor(itemInitials, isActive);
              const avatarTextColor = getAvatarTextColor(itemInitials);

              return (
                <Link key={item.id} href={`/users/${item.id}`}>
                  <Card
                    className={cn(
                      "p-3 cursor-pointer transition-all hover:shadow-sm",
                      isActive
                        ? "bg-[#142030] text-white border-[#142030]"
                        : "bg-white border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={item.image || undefined} />
                        <AvatarFallback
                          className={cn(
                            "text-xs font-light",
                            isActive ? "bg-white/20 text-white" : [avatarBgColor, avatarTextColor]
                          )}
                        >
                          {itemInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-xs font-light truncate",
                            isActive ? "text-white" : "text-foreground"
                          )}
                        >
                          {itemDisplayName}
                        </p>
                        {item.name && (
                          <p
                            className={cn(
                              "text-[10px] truncate",
                              isActive ? "text-white/70" : "text-muted-foreground"
                            )}
                          >
                            {item.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* User Header */}
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={currentUser.image || undefined} />
                  <AvatarFallback className={cn("text-lg font-light", mainAvatarBgColor, mainAvatarTextColor)}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-light">{displayName}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {currentUser.email}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/users")}
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                  Back
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-light mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <a
                    href={`mailto:${currentUser.email}`}
                    className="text-xs font-light text-primary hover:underline"
                  >
                    {currentUser.email}
                  </a>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-light mb-1">Role</p>
                <Badge
                  className={`${
                    roleColors[currentUser.role] || roleColors.CLIENT
                  } text-xs font-light`}
                >
                  {roleLabels[currentUser.role] || currentUser.role}
                </Badge>
              </div>

              {currentUser.emailVerified && (
                <div>
                  <p className="text-xs text-muted-foreground font-light mb-1">
                    Email Verified
                  </p>
                  <p className="text-xs font-light">
                    {format(new Date(currentUser.emailVerified), "PPp")}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground font-light mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created At
                </p>
                <p className="text-xs font-light">
                  {format(new Date(currentUser.createdAt), "PPp")}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-light mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last Updated
                </p>
                <p className="text-xs font-light">
                  {format(new Date(currentUser.updatedAt), "PPp")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <UserFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleSubmit}
        initialData={{
          id: currentUser.id,
          name: currentUser.name || "",
          email: currentUser.email,
          role: currentUser.role as
            | "SUPERADMIN"
            | "OWNER"
            | "MANAGER"
            | "INFLUENCER"
            | "CLIENT",
          image: currentUser.image || "",
        }}
      />
    </div>
  );
}

