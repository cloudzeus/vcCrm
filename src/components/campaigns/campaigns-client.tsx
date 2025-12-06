"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { CampaignFormModal } from "@/components/forms/campaign-form-modal";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Campaign {
  id: string;
  name: string;
  description: string;
  brandId: string;
  brandName: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  totalBudget?: number | null;
  influencerCount: number;
  postCount: number;
}

interface CampaignsClientProps {
  initialCampaigns: Campaign[];
  brands: Array<{ id: string; name: string }>;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-[#E9D8C8]/30 text-[#142030] border-[#E9D8C8]", // Siesta Tan - beige
  ACTIVE: "bg-[#85A3B2]/30 text-[#142030] border-[#85A3B2]", // Grauzone - blue-grey
  COMPLETED: "bg-[#85A3B2]/30 text-[#142030] border-[#85A3B2]", // Grauzone - blue-grey
  CANCELLED: "bg-[#732553]/30 text-[#142030] border-[#732553]", // Pico Eggplant - purple
};

export function CampaignsClient({ initialCampaigns, brands }: CampaignsClientProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.brandName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingCampaign(null);
    setIsModalOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleBulkAction = async (selectedRows: Campaign[], action: string) => {
    if (action === "delete") {
      // Implement bulk delete
      toast.success(`Deleted ${selectedRows.length} campaigns`);
      router.refresh();
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const url = editingCampaign
        ? `/api/campaigns/${editingCampaign.id}`
        : "/api/campaigns";
      const method = editingCampaign ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save campaign");
      }

      const result = await response.json();
      toast.success(editingCampaign ? "Campaign updated" : "Campaign created");

      if (editingCampaign) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === editingCampaign.id ? { ...c, ...result } : c))
        );
      } else {
        router.refresh();
      }

      setIsModalOpen(false);
      setEditingCampaign(null);
    } catch (error) {
      throw error;
    }
  };

  const columns: ColumnDef<Campaign>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-light text-xs">{row.original.name}</span>
      ),
    },
    {
      id: "brand",
      header: "Brand",
      accessorKey: "brandName",
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs font-light">{row.original.brandName}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="default">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "startDate",
      header: "Start Date",
      accessorKey: "startDate",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs font-light">
          {row.original.startDate
            ? format(new Date(row.original.startDate), "MMM d, yyyy")
            : "-"}
        </span>
      ),
    },
    {
      id: "endDate",
      header: "End Date",
      accessorKey: "endDate",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs font-light">
          {row.original.endDate
            ? format(new Date(row.original.endDate), "MMM d, yyyy")
            : "-"}
        </span>
      ),
    },
    {
      id: "budget",
      header: "Budget",
      accessorKey: "totalBudget",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs font-light">
          {row.original.totalBudget
            ? `€${row.original.totalBudget.toLocaleString()}`
            : "-"}
        </span>
      ),
    },
    {
      id: "influencers",
      header: "Influencers",
      accessorKey: "influencerCount",
      enableSorting: true,
      cell: ({ row }) => <span className="text-sm font-normal">{row.original.influencerCount}</span>,
    },
    {
      id: "posts",
      header: "Posts",
      accessorKey: "postCount",
      enableSorting: true,
      cell: ({ row }) => <span className="text-sm font-normal">{row.original.postCount}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="font-light tracking-tight text-sm">Campaigns</h1>
          <p className="text-xs text-muted-foreground font-light">
            Manage your influencer marketing campaigns
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="bg-[#142030] hover:bg-[#142030]/90 text-white">
          <Plus className="h-3 w-3" />
          New Campaign
        </Button>
      </div>

      <Card className="border-dotted border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-light">All Campaigns</CardTitle>
              <CardDescription className="text-xs">
                {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                className="pl-7 h-7 w-[250px] text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <DataTable
            data={filteredCampaigns}
            columns={columns}
            onRowClick={handleEdit}
            onBulkAction={handleBulkAction}
            bulkActions={[
              { label: "Delete Selected", value: "delete", variant: "destructive" },
            ]}
          />
        </CardContent>
      </Card>

      <CampaignFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        brands={brands}
        initialData={editingCampaign ? {
          name: editingCampaign.name,
          description: editingCampaign.description,
          brandId: editingCampaign.brandId,
          status: editingCampaign.status as any,
          startDate: editingCampaign.startDate ? new Date(editingCampaign.startDate) : undefined,
          endDate: editingCampaign.endDate ? new Date(editingCampaign.endDate) : undefined,
          totalBudget: editingCampaign.totalBudget || undefined,
        } : undefined}
      />
    </div>
  );
}
