"use client";

import { useState } from "react";
import { Plus, Search, ExternalLink, MapPin, Globe, Phone, Mail, Building2, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { SupplierFormModal } from "@/components/forms/supplier-form-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { createSupplier, updateSupplier, deleteSupplier } from "@/app/actions/suppliers";
import { useConfirm } from "@/hooks/use-confirm";

interface Supplier {
  id: string;
  name: string;
  vatNumber?: string;
  commercialTitle?: string;
  address?: string;
  irsOffice?: string;
  city?: string;
  country?: string | null;
  zip?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  website?: string;
  contactCount: number;
}

interface SuppliersClientProps {
  initialSuppliers: Supplier[];
}

export function SuppliersClient({ initialSuppliers }: SuppliersClientProps) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.city && supplier.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (supplier.vatNumber && supplier.vatNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleViewDetails = (supplier: Supplier) => {
    router.push(`/suppliers/${supplier.id}`);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    const confirmed = await confirm(`Are you sure you want to delete "${supplier.name}"?`);
    if (!confirmed) {
      return;
    }

    // Optimistically remove from list
    setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));

    const result = await deleteSupplier(supplier.id);
    if (result.error) {
      toast.error(result.error);
      // Revert optimistic update on error
      router.refresh();
    } else {
      toast.success("Supplier deleted successfully");
      router.refresh();
    }
  };

  const handleBulkAction = async (selectedRows: Supplier[], action: string) => {
    if (action === "delete") {
      toast.success(`Deleted ${selectedRows.length} suppliers`);
      router.refresh();
    }
  };

  const handleSubmit = async (data: any) => {
    const result = editingSupplier
      ? await updateSupplier(editingSupplier.id, data)
      : await createSupplier(data);

    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }

    // Optimistically update the local state immediately
    if (result.supplier) {
      if (editingSupplier) {
        // Update existing supplier in the list
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingSupplier.id ? result.supplier : s))
        );
      } else {
        // Add new supplier at the beginning of the list
        setSuppliers((prev) => [result.supplier, ...prev]);
      }
    }

    toast.success(editingSupplier ? "Supplier updated" : "Supplier created");
    setIsModalOpen(false);
    setEditingSupplier(null);
    
    // Refresh to ensure server state is synced
    router.refresh();
  };

  const getCountryLabel = (countryValue: string | null | undefined) => {
    if (!countryValue) return "-";
    const country = COUNTRY_OPTIONS.find((c) => c.value === countryValue);
    return country ? country.label : countryValue;
  };

  const columns: ColumnDef<Supplier>[] = [
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
      id: "commercialTitle",
      header: "Commercial Title",
      accessorKey: "commercialTitle",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-light text-xs">{row.original.commercialTitle || "-"}</span>
      ),
    },
    {
      id: "vatNumber",
      header: "VAT Number",
      accessorKey: "vatNumber",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-light text-xs">{row.original.vatNumber || "-"}</span>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const parts = [
          row.original.city,
          row.original.zip,
          getCountryLabel(row.original.country),
        ].filter(Boolean);
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
      id: "phone",
      header: "Phone",
      accessorKey: "phone",
      enableSorting: true,
      cell: ({ row }) => (
        row.original.phone ? (
          <span className="flex items-center gap-1 text-xs font-light">
            <Phone className="h-3.5 w-3.5" />
            {row.original.phone}
          </span>
        ) : (
          <span className="text-xs font-light">-</span>
        )
      ),
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      enableSorting: true,
      cell: ({ row }) => (
        row.original.email ? (
          <span className="flex items-center gap-1 text-xs font-light">
            <Mail className="h-3.5 w-3.5" />
            {row.original.email}
          </span>
        ) : (
          <span className="text-xs font-light">-</span>
        )
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
      id: "contacts",
      header: "Contacts",
      accessorKey: "contactCount",
      enableSorting: true,
      cell: ({ row }) => <span className="text-sm font-normal">{row.original.contactCount || 0}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="font-light tracking-tight text-sm">SUPPLIERS & COLLABORATORS</h1>
          <p className="text-xs text-muted-foreground font-light">
            Manage your suppliers and collaborators
          </p>
        </div>
        <Button onClick={handleCreate} size="default" className="bg-[#142030] hover:bg-[#142030]/90 text-white">
          <Plus className="h-4 w-4" />
          New Supplier
        </Button>
      </div>

      <Card className="border-dotted border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-light">All Suppliers</CardTitle>
              <CardDescription className="text-[10px]">
                {filteredSuppliers.length} suppl{filteredSuppliers.length !== 1 ? "iers" : "ier"}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                className="pl-10 h-9 w-[350px] text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <DataTable
            data={filteredSuppliers}
            columns={columns}
            onBulkAction={handleBulkAction}
            bulkActions={[
              { label: "Delete Selected", value: "delete", variant: "destructive" },
            ]}
            rowActions={[
              {
                label: "View Details",
                value: "view",
                onClick: handleViewDetails,
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

      <SupplierFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        initialData={editingSupplier ? {
          name: editingSupplier.name,
          vatNumber: editingSupplier.vatNumber,
          commercialTitle: editingSupplier.commercialTitle,
          address: editingSupplier.address,
          irsOffice: editingSupplier.irsOffice,
          city: editingSupplier.city,
          country: editingSupplier.country || undefined,
          zip: editingSupplier.zip,
          phone: editingSupplier.phone,
          email: editingSupplier.email,
          logoUrl: editingSupplier.logoUrl,
          website: editingSupplier.website,
        } : undefined}
      />
      <ConfirmDialog />
    </div>
  );
}

