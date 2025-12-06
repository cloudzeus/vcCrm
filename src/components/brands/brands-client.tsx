"use client";

import { useState } from "react";
import { Plus, Search, ExternalLink, MapPin, Globe, Instagram, Facebook, Twitter, Linkedin, Youtube, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { BrandFormModal } from "@/components/forms/brand-form-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Brand {
  id: string;
  name: string;
  website: string;
  notes: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  campaignCount: number;
  contactCount?: number;
  productCount?: number;
}

interface BrandsClientProps {
  initialBrands: Brand[];
}

export function BrandsClient({ initialBrands }: BrandsClientProps) {
  const router = useRouter();
  const [brands, setBrands] = useState(initialBrands);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (brand.city && brand.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (brand.country && brand.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = () => {
    setEditingBrand(null);
    setIsModalOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    router.push(`/brands/${brand.id}`);
  };

  const handleBulkAction = async (selectedRows: Brand[], action: string) => {
    if (action === "delete") {
      toast.success(`Deleted ${selectedRows.length} brands`);
      router.refresh();
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const url = editingBrand
        ? `/api/brands/${editingBrand.id}`
        : "/api/brands";
      const method = editingBrand ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save brand");
      }

      toast.success(editingBrand ? "Brand updated" : "Brand created");
      router.refresh();
      setIsModalOpen(false);
      setEditingBrand(null);
    } catch (error) {
      throw error;
    }
  };

  const columns: ColumnDef<Brand>[] = [
    {
      id: "logo",
      header: "Logo",
      cell: ({ row }) => (
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.original.logoUrl || undefined} alt={row.original.name} />
          <AvatarFallback className="text-xs font-light">
            {row.original.name.charAt(0).toUpperCase()}
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
        <span className="font-light text-xs">{row.original.name}</span>
      ),
    },
    {
      id: "website",
      header: "Website",
      accessorKey: "website",
      enableSorting: true,
      cell: ({ row }) => (
        row.original.website ? (
          <a
            href={row.original.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-normal text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Globe className="h-3.5 w-3.5" />
            {row.original.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs font-light">-</span>
        )
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const parts = [row.original.city, row.original.state, row.original.country].filter(Boolean);
        return parts.length > 0 ? (
          <span className="flex items-center gap-1 text-xs font-light">
            <MapPin className="h-3.5 w-3.5" />
            {parts.join(", ")}
          </span>
        ) : (
          <span className="text-xs font-light">-</span>
        );
      },
    },
    {
      id: "instagram",
      header: "Instagram",
      accessorKey: "instagramUrl",
      enableSorting: true,
      cell: ({ row }) => (
        row.original.instagramUrl ? (
          <a
            href={row.original.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-light text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Instagram className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs font-light">-</span>
        )
      ),
    },
    {
      id: "facebook",
      header: "Facebook",
      accessorKey: "facebookUrl",
      enableSorting: true,
      cell: ({ row }) => (
        row.original.facebookUrl ? (
          <a
            href={row.original.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-light text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Facebook className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs font-light">-</span>
        )
      ),
    },
    {
      id: "twitter",
      header: "Twitter",
      accessorKey: "twitterUrl",
      enableSorting: true,
      cell: ({ row }) => (
        row.original.twitterUrl ? (
          <a
            href={row.original.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-light text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Twitter className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs font-light">-</span>
        )
      ),
    },
    {
      id: "linkedin",
      header: "LinkedIn",
      accessorKey: "linkedinUrl",
      enableSorting: true,
      cell: ({ row }) => (
        row.original.linkedinUrl ? (
          <a
            href={row.original.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-light text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Linkedin className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs font-light">-</span>
        )
      ),
    },
    {
      id: "youtube",
      header: "YouTube",
      accessorKey: "youtubeUrl",
      enableSorting: true,
      cell: ({ row }) => (
        row.original.youtubeUrl ? (
          <a
            href={row.original.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-light text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Youtube className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs font-light">-</span>
        )
      ),
    },
    {
      id: "tiktok",
      header: "TikTok",
      accessorKey: "tiktokUrl",
      enableSorting: true,
      cell: ({ row }) => (
        row.original.tiktokUrl ? (
          <a
            href={row.original.tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-light text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Music className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs font-light">-</span>
        )
      ),
    },
    {
      id: "campaigns",
      header: "Campaigns",
      accessorKey: "campaignCount",
      enableSorting: true,
      cell: ({ row }) => <span className="text-sm font-normal">{row.original.campaignCount}</span>,
    },
    {
      id: "contacts",
      header: "Contacts",
      accessorKey: "contactCount",
      enableSorting: true,
      cell: ({ row }) => <span className="text-sm font-normal">{row.original.contactCount || 0}</span>,
    },
    {
      id: "products",
      header: "Products",
      accessorKey: "productCount",
      enableSorting: true,
      cell: ({ row }) => <span className="text-sm font-normal">{row.original.productCount || 0}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="font-light tracking-tight text-sm">Brands</h1>
          <p className="text-xs text-muted-foreground font-light">
            Manage your brand partners
          </p>
        </div>
        <Button onClick={handleCreate} size="default" className="bg-[#142030] hover:bg-[#142030]/90 text-white">
          <Plus className="h-4 w-4" />
          New Brand
        </Button>
      </div>

      <Card className="border-dotted border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-light">All Brands</CardTitle>
              <CardDescription className="text-[10px]">
                {filteredBrands.length} brand{filteredBrands.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                className="pl-10 h-9 w-[350px] text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <DataTable
            data={filteredBrands}
            columns={columns}
            onRowClick={handleEdit}
            onBulkAction={handleBulkAction}
            bulkActions={[
              { label: "Delete Selected", value: "delete", variant: "destructive" },
            ]}
          />
        </CardContent>
      </Card>

      <BrandFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        initialData={editingBrand ? {
          name: editingBrand.name,
          website: editingBrand.website,
          notes: editingBrand.notes,
          logoUrl: editingBrand.logoUrl,
          address: editingBrand.address,
          city: editingBrand.city,
          state: editingBrand.state,
          country: editingBrand.country,
          postalCode: editingBrand.postalCode,
          instagramUrl: editingBrand.instagramUrl,
          facebookUrl: editingBrand.facebookUrl,
          twitterUrl: editingBrand.twitterUrl,
          linkedinUrl: editingBrand.linkedinUrl,
          youtubeUrl: editingBrand.youtubeUrl,
          tiktokUrl: editingBrand.tiktokUrl,
        } : undefined}
      />
    </div>
  );
}
