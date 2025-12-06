"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { InfluencerFormModal } from "@/components/forms/influencer-form-modal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Influencer {
  id: string;
  userId: string;
  stageName: string;
  bio: string;
  defaultCurrency: string;
  managerSharePercent: number;
  userName: string;
  userEmail: string;
  userImage: string | null;
  campaignCount: number;
  postCount: number;
}

interface InfluencersClientProps {
  initialInfluencers: Influencer[];
}

export function InfluencersClient({ initialInfluencers }: InfluencersClientProps) {
  const router = useRouter();
  const [influencers, setInfluencers] = useState(initialInfluencers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);

  const filteredInfluencers = influencers.filter(
    (influencer) =>
      influencer.stageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingInfluencer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (influencer: Influencer) => {
    router.push(`/influencers/${influencer.id}`);
  };

  const handleBulkAction = async (selectedRows: Influencer[], action: string) => {
    if (action === "delete") {
      toast.success(`Deleted ${selectedRows.length} influencers`);
      router.refresh();
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const url = editingInfluencer
        ? `/api/influencers/${editingInfluencer.id}`
        : "/api/influencers";
      const method = editingInfluencer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save influencer");
      }

      toast.success(editingInfluencer ? "Influencer updated" : "Influencer created");
      router.refresh();
      setIsModalOpen(false);
      setEditingInfluencer(null);
    } catch (error) {
      throw error;
    }
  };

  const columns: ColumnDef<Influencer>[] = [
    {
      id: "influencer",
      header: "Influencer",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.userImage || undefined} />
            <AvatarFallback className="text-xs font-light">
              {row.original.userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-light text-xs">{row.original.userName}</p>
            <p className="text-[10px] font-light text-muted-foreground">{row.original.userEmail}</p>
          </div>
        </div>
      ),
    },
    {
      id: "stageName",
      header: "Stage Name",
      accessorKey: "stageName",
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs font-light">{row.original.stageName || "-"}</span>,
    },
    {
      id: "currency",
      header: "Currency",
      accessorKey: "defaultCurrency",
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs font-light">{row.original.defaultCurrency}</span>,
    },
    {
      id: "managerShare",
      header: "Manager Share",
      accessorKey: "managerSharePercent",
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs font-light">{row.original.managerSharePercent}%</span>,
    },
    {
      id: "campaigns",
      header: "Campaigns",
      accessorKey: "campaignCount",
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs font-light">{row.original.campaignCount}</span>,
    },
    {
      id: "posts",
      header: "Posts",
      accessorKey: "postCount",
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs font-light">{row.original.postCount}</span>,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="font-light tracking-tight text-sm">Influencers</h1>
          <p className="text-xs text-muted-foreground font-light">
            Manage your influencer profiles
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="bg-[#142030] hover:bg-[#142030]/90 text-white">
          <Plus className="h-3 w-3" />
          New Influencer
        </Button>
      </div>

      <Card className="border-dotted border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-light">All Influencers</CardTitle>
              <CardDescription className="text-[10px]">
                {filteredInfluencers.length} influencer{filteredInfluencers.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search influencers..."
                className="pl-7 h-7 w-[250px] text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <DataTable
            data={filteredInfluencers}
            columns={columns}
            onRowClick={handleEdit}
            onBulkAction={handleBulkAction}
            bulkActions={[
              { label: "Delete Selected", value: "delete", variant: "destructive" },
            ]}
          />
        </CardContent>
      </Card>

      <InfluencerFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        initialData={editingInfluencer ? {
          stageName: editingInfluencer.stageName,
          bio: editingInfluencer.bio,
          defaultCurrency: editingInfluencer.defaultCurrency,
          managerSharePercent: editingInfluencer.managerSharePercent,
        } : undefined}
      />
    </div>
  );
}
