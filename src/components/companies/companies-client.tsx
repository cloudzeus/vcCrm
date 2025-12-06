"use client";

import { useState } from "react";
import { Plus, Search, ExternalLink, MapPin, Globe, Phone, Mail, Building2, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { CompanyFormModal } from "@/components/forms/company-form-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { createCompany, updateCompany, deleteCompany } from "@/app/actions/companies";
import { useConfirm } from "@/hooks/use-confirm";

interface Company {
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

interface CompaniesClientProps {
  initialCompanies: Company[];
}

export function CompaniesClient({ initialCompanies }: CompaniesClientProps) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [companies, setCompanies] = useState(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company.city && company.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (company.vatNumber && company.vatNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleViewDetails = (company: Company) => {
    router.push(`/companies/${company.id}`);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleDelete = async (company: Company) => {
    const confirmed = await confirm(`Are you sure you want to delete "${company.name}"?`);
    if (!confirmed) {
      return;
    }

    // Optimistically remove from list
    setCompanies((prev) => prev.filter((c) => c.id !== company.id));

    const result = await deleteCompany(company.id);
    if (result.error) {
      toast.error(result.error);
      // Revert optimistic update on error
      router.refresh();
    } else {
      toast.success("Company deleted successfully");
      router.refresh();
    }
  };

  const handleBulkAction = async (selectedRows: Company[], action: string) => {
    if (action === "delete") {
      toast.success(`Deleted ${selectedRows.length} companies`);
      router.refresh();
    }
  };

  const handleSubmit = async (data: any) => {
    const result = editingCompany
      ? await updateCompany(editingCompany.id, data)
      : await createCompany(data);

    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }

    // Optimistically update the local state immediately
    if (result.company) {
      if (editingCompany) {
        // Update existing company in the list
        setCompanies((prev) =>
          prev.map((c) => (c.id === editingCompany.id ? result.company : c))
        );
      } else {
        // Add new company at the beginning of the list
        setCompanies((prev) => [result.company, ...prev]);
      }
    }

    toast.success(editingCompany ? "Company updated" : "Company created");
    setIsModalOpen(false);
    setEditingCompany(null);

    // Refresh to ensure server state is synced
    router.refresh();
  };

  const getCountryLabel = (countryValue: string | null | undefined) => {
    if (!countryValue) return "-";
    const country = COUNTRY_OPTIONS.find((c) => c.value === countryValue);
    return country ? country.label : countryValue;
  };

  const columns: ColumnDef<Company>[] = [
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
      cell: ({ row }) => {
        const name = row.original.name;
        const truncatedName = name.length > 45 ? `${name.substring(0, 45)}...` : name;
        const hasFullName = name.length > 45;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-light text-xs cursor-help">{truncatedName}</span>
            </TooltipTrigger>
            {hasFullName && (
              <TooltipContent>
                <p className="text-xs">{name}</p>
              </TooltipContent>
            )}
          </Tooltip>
        );
      },
    },
    {
      id: "commercialTitle",
      header: "Commercial Title",
      accessorKey: "commercialTitle",
      enableSorting: true,
      cell: ({ row }) => {
        const commercialTitle = row.original.commercialTitle;
        if (!commercialTitle) {
          return <span className="font-light text-xs">-</span>;
        }
        const truncatedTitle = commercialTitle.length > 45 ? `${commercialTitle.substring(0, 45)}...` : commercialTitle;
        const hasFullTitle = commercialTitle.length > 45;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-light text-xs cursor-help">{truncatedTitle}</span>
            </TooltipTrigger>
            {hasFullTitle && (
              <TooltipContent>
                <p className="text-xs">{commercialTitle}</p>
              </TooltipContent>
            )}
          </Tooltip>
        );
      },
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
          <h1 className="font-light tracking-tight text-sm">CUSTOMERS</h1>
          <p className="text-xs text-muted-foreground font-light">
            Manage your customer companies
          </p>
        </div>
        <Button onClick={handleCreate} size="default" className="bg-[#142030] hover:bg-[#142030]/90 text-white">
          <Plus className="h-4 w-4" />
          New Company
        </Button>
      </div>

      <Card className="border-dotted border-gray-200 shadow-sm bg-gradient-to-br from-white to-[#85A3B2]/8">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-light">All Companies</CardTitle>
              <CardDescription className="text-[10px]">
                {filteredCompanies.length} compan{filteredCompanies.length !== 1 ? "ies" : "y"}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                className="pl-10 h-9 w-[350px] text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <DataTable
            data={filteredCompanies}
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

      <CompanyFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        initialData={editingCompany ? {
          name: editingCompany.name,
          vatNumber: editingCompany.vatNumber,
          commercialTitle: editingCompany.commercialTitle,
          address: editingCompany.address,
          irsOffice: editingCompany.irsOffice,
          city: editingCompany.city,
          country: editingCompany.country as any || undefined,
          zip: editingCompany.zip,
          phone: editingCompany.phone,
          email: editingCompany.email,
          logoUrl: editingCompany.logoUrl,
          website: editingCompany.website,
        } : undefined}
      />
      <ConfirmDialog />
    </div>
  );
}

