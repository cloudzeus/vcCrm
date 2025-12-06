"use client";

import { useState } from "react";
import { Plus, Search, MapPin, Phone, Mail, User, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { ContactFormModal } from "@/components/forms/contact-form-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { useConfirm } from "@/hooks/use-confirm";

interface Contact {
  id: string;
  name: string;
  lastName?: string;
  companyId?: string;
  supplierId?: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    website?: string;
  } | null;
  jobPosition?: string;
  notes?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string | null;
  image?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  workPhone?: string;
  gender?: string | null;
  birthday?: string | null;
}

interface ContactsClientProps {
  initialContacts: Contact[];
  companies: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
}

export function ContactsClient({ initialContacts, companies, suppliers }: ContactsClientProps) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [contacts, setContacts] = useState(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.lastName && contact.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (contact.company?.name && contact.company.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleDelete = async (contact: Contact) => {
    const contactName = `${contact.name} ${contact.lastName || ""}`.trim();
    const confirmed = await confirm(`Are you sure you want to delete "${contactName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete contact");
      }

      toast.success("Contact deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete contact");
    }
  };

  const handleBulkAction = async (selectedRows: Contact[], action: string) => {
    if (action === "delete") {
      toast.success(`Deleted ${selectedRows.length} contacts`);
      router.refresh();
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const url = editingContact
        ? `/api/contacts/${editingContact.id}`
        : "/api/contacts";
      const method = editingContact ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save contact");
      }

      const result = await response.json();

      // Optimistically update the local state immediately
      if (result) {
        if (editingContact) {
          // Update existing contact in the list
          setContacts((prev) =>
            prev.map((c) => (c.id === editingContact.id ? { ...c, ...result } : c))
          );
        } else {
          // Add new contact at the beginning of the list
          setContacts((prev) => [result, ...prev]);
        }
      }

      toast.success(editingContact ? "Contact updated" : "Contact created");
      setIsModalOpen(false);
      setEditingContact(null);
      
      // Refresh to ensure server state is synced
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  const getCountryLabel = (countryValue: string | null | undefined) => {
    if (!countryValue) return "-";
    const country = COUNTRY_OPTIONS.find((c) => c.value === countryValue);
    return country ? country.label : countryValue;
  };

  const getGenderLabel = (gender: string | null | undefined) => {
    if (!gender) return "-";
    const labels: Record<string, string> = {
      MALE: "Male",
      FEMALE: "Female",
      OTHER: "Other",
      PREFER_NOT_TO_SAY: "Prefer not to say",
    };
    return labels[gender] || gender;
  };

  const columns: ColumnDef<Contact>[] = [
    {
      id: "image",
      header: "Image",
      cell: ({ row }) => (
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.original.image || undefined} alt={row.original.name} />
          <AvatarFallback className="text-xs font-light">
            {row.original.name.charAt(0).toUpperCase()}
            {row.original.lastName?.charAt(0).toUpperCase()}
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
        <span className="font-light text-xs">
          {row.original.name} {row.original.lastName || ""}
        </span>
      ),
    },
    {
      id: "company",
      header: "Company",
      cell: ({ row }) => {
        if (!row.original.company) {
          return <span className="text-xs font-light">-</span>;
        }

        const company = row.original.company;
        const displayName = company.name.length > 40 
          ? `${company.name.substring(0, 40)}...` 
          : company.name;

        const companyDetails = [
          company.name,
          company.address && `Address: ${company.address}`,
          company.city && `City: ${company.city}`,
          company.phone && `Phone: ${company.phone}`,
          company.email && `Email: ${company.email}`,
          company.website && `Website: ${company.website}`,
        ].filter(Boolean).join('\n');

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                {company.logoUrl && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={company.logoUrl} />
                    <AvatarFallback className="text-[10px]">
                      {company.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="font-light text-xs truncate max-w-[200px]">{displayName}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <pre className="text-xs whitespace-pre-wrap font-sans">{companyDetails}</pre>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "jobPosition",
      header: "Job Position",
      accessorKey: "jobPosition",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-light text-xs">{row.original.jobPosition || "-"}</span>
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
      id: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.original.phone || row.original.mobile || row.original.workPhone;
        return phone ? (
          <span className="flex items-center gap-1 text-xs font-light">
            <Phone className="h-3.5 w-3.5" />
            {phone}
          </span>
        ) : (
          <span className="text-xs font-light">-</span>
        );
      },
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
      id: "gender",
      header: "Gender",
      accessorKey: "gender",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-light text-xs">{getGenderLabel(row.original.gender)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="font-light tracking-tight text-sm">CONTACTS</h1>
          <p className="text-xs text-muted-foreground font-light">
            Manage your contacts
          </p>
        </div>
        <Button onClick={handleCreate} size="default" className="bg-[#142030] hover:bg-[#142030]/90 text-white">
          <Plus className="h-4 w-4" />
          New Contact
        </Button>
      </div>

      <Card className="border-dotted border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-light">All Contacts</CardTitle>
              <CardDescription className="text-[10px]">
                {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-10 h-9 w-[350px] text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <DataTable
            data={filteredContacts}
            columns={columns}
            onBulkAction={handleBulkAction}
            bulkActions={[
              { label: "Delete Selected", value: "delete", variant: "destructive" },
            ]}
            rowActions={[
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

      <ContactFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        initialData={editingContact ? {
          name: editingContact.name,
          lastName: editingContact.lastName,
          companyId: editingContact.companyId,
          supplierId: editingContact.supplierId,
          jobPosition: editingContact.jobPosition,
          notes: editingContact.notes,
          address: editingContact.address,
          city: editingContact.city,
          zip: editingContact.zip,
          country: editingContact.country || undefined,
          image: editingContact.image,
          email: editingContact.email,
          phone: editingContact.phone,
          mobile: editingContact.mobile,
          workPhone: editingContact.workPhone,
          gender: editingContact.gender || undefined,
          birthday: editingContact.birthday || undefined,
        } : undefined}
        companies={companies}
        suppliers={suppliers}
      />
      <ConfirmDialog />
    </div>
  );
}

