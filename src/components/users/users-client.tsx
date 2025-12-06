"use client";

import { useState } from "react";
import { Plus, Search, Mail, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { UserFormModal } from "@/components/forms/user-form-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
  organizationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UsersClientProps {
  initialUsers: User[];
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

export function UsersClient({ initialUsers }: UsersClientProps) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roleLabels[user.role]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    const userName = user.name || user.email;
    const confirmed = await confirm(`Are you sure you want to delete "${userName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const handleBulkAction = async (selectedRows: User[], action: string) => {
    if (action === "delete") {
      toast.success(`Deleted ${selectedRows.length} users`);
      router.refresh();
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const url = editingUser
        ? `/api/users/${editingUser.id}`
        : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save user");
      }

      const result = await response.json();

      // Optimistically update the local state immediately
      if (result) {
        if (editingUser) {
          // Update existing user in the list
          setUsers((prev) =>
            prev.map((u) => (u.id === editingUser.id ? { ...u, ...result } : u))
          );
        } else {
          // Add new user at the beginning of the list
          setUsers((prev) => [result, ...prev]);
        }
      }

      toast.success(editingUser ? "User updated" : "User created");
      setIsModalOpen(false);
      setEditingUser(null);
      
      // Refresh to ensure server state is synced
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      id: "image",
      header: "Image",
      cell: ({ row }) => (
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.original.image || undefined} alt={row.original.name || ""} />
          <AvatarFallback className="text-xs font-light">
            {(row.original.name || row.original.email).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <div className="font-light text-xs">
            {row.original.name || "-"}
          </div>
          {row.original.name && (
            <div className="text-[10px] text-muted-foreground font-light">
              {row.original.email}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      enableSorting: true,
      cell: ({ row }) => (
        !row.original.name ? (
          <span className="flex items-center gap-1 text-xs font-light">
            <Mail className="h-3.5 w-3.5" />
            {row.original.email}
          </span>
        ) : (
          <span className="text-xs font-light text-muted-foreground">-</span>
        )
      ),
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge className={`${roleColors[row.original.role] || roleColors.CLIENT} text-xs font-light`}>
          {roleLabels[row.original.role] || row.original.role}
        </Badge>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      accessorKey: "createdAt",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-light text-xs">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="font-light tracking-tight text-sm">USERS</h1>
          <p className="text-xs text-muted-foreground font-light">
            Manage users in your organization
          </p>
        </div>
        <Button onClick={handleCreate} size="default" className="bg-[#142030] hover:bg-[#142030]/90 text-white">
          <Plus className="h-4 w-4" />
          New User
        </Button>
      </div>

      <Card className="border-dotted border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-light">All Users</CardTitle>
              <CardDescription className="text-[10px]">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10 h-9 w-[350px] text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <DataTable
            data={filteredUsers}
            columns={columns}
            onBulkAction={handleBulkAction}
            bulkActions={[
              { label: "Delete Selected", value: "delete", variant: "destructive" },
            ]}
            rowActions={[
              {
                label: "View",
                value: "view",
                onClick: (user) => router.push(`/users/${user.id}`),
              },
              {
                label: "Edit",
                value: "edit",
                onClick: handleEdit,
              },
              {
                label: "Delete",
                value: "delete",
                onClick: handleDelete,
                variant: "destructive",
              },
            ]}
          />
        </CardContent>
      </Card>

      <UserFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        initialData={editingUser ? {
          id: editingUser.id,
          name: editingUser.name || "",
          email: editingUser.email,
          role: editingUser.role as "SUPERADMIN" | "OWNER" | "MANAGER" | "INFLUENCER" | "CLIENT",
          image: editingUser.image || "",
        } : undefined}
      />
      <ConfirmDialog />
    </div>
  );
}

