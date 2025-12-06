"use client";

import { useState } from "react";
import { Plus, Search, Eye, Edit, DollarSign, Calendar, Building2, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { LeadFormModal } from "@/components/forms/lead-form-modal";
import { AIQuestionsModal } from "@/components/forms/ai-questions-modal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Lead, LeadFormData, CompanyListItem } from "@/lib/types/crm";
import { useConfirm } from "@/hooks/use-confirm";

interface LeadsClientProps {
  initialLeads: Lead[];
  companies: CompanyListItem[];
  currentUserId?: string;
  currentUserName?: string;
}

import type { CrmStatusType } from "@/lib/types/crm";

const statusColors: Record<CrmStatusType, string> = {
  LEAD: "bg-[#E9D8C8]/30 text-[#142030] border-[#E9D8C8]",
  QUALIFIED: "bg-[#85A3B2]/30 text-[#142030] border-[#85A3B2]",
  CONTACTED: "bg-[#85A3B2]/30 text-[#142030] border-[#85A3B2]",
  NEEDS_ANALYSIS: "bg-[#732553]/30 text-[#142030] border-[#732553]",
  OPPORTUNITY: "bg-[#732553]/30 text-[#142030] border-[#732553]",
  NEGOTIATION: "bg-[#142030]/30 text-[#142030] border-[#142030]",
  OFFER_SENT: "bg-[#85A3B2]/30 text-[#142030] border-[#85A3B2]",
  OFFER_ACCEPTED: "bg-[#85A3B2]/30 text-[#142030] border-[#85A3B2]",
  WON: "bg-[#85A3B2]/30 text-[#142030] border-[#85A3B2]",
  LOST: "bg-[#FF5C8D]/30 text-[#142030] border-[#FF5C8D]",
  CUSTOMER: "bg-[#85A3B2]/30 text-[#142030] border-[#85A3B2]",
};

export function LeadsClient({ initialLeads, companies, currentUserId, currentUserName }: LeadsClientProps) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [leads, setLeads] = useState(initialLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isAIQuestionsModalOpen, setIsAIQuestionsModalOpen] = useState(false);
  const [selectedLeadForAI, setSelectedLeadForAI] = useState<Lead | null>(null);
  const [leadContacts, setLeadContacts] = useState<Array<{ id: string; name: string; lastName?: string; email?: string }>>([]);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.description && lead.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const handleViewDetails = (lead: Lead) => {
    router.push(`/leads/${lead.id}`);
  };

  const handleGenerateQuestions = async (lead: Lead) => {
    try {
      // Fetch lead details including contacts
      const response = await fetch(`/api/leads/${lead.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch lead details");
      }
      const leadData = await response.json();
      
      setLeadContacts(
        leadData.contacts?.map((c: any) => ({
          id: c.id,
          name: c.name,
          lastName: c.lastName,
          email: c.email,
        })) || []
      );
      setSelectedLeadForAI(lead);
      setIsAIQuestionsModalOpen(true);
    } catch (error) {
      toast.error("Failed to load lead details");
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleDelete = async (lead: Lead) => {
    const confirmed = await confirm(`Are you sure you want to delete "${lead.title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete lead");
      }

      toast.success("Lead deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete lead");
    }
  };

  const handleBulkAction = async (selectedRows: Lead[], action: string) => {
    if (action === "delete") {
      toast.success(`Deleted ${selectedRows.length} leads`);
      router.refresh();
    }
  };

  const handleSubmit = async (data: LeadFormData) => {
    try {
      const url = editingLead ? `/api/leads/${editingLead.id}` : "/api/leads";
      const method = editingLead ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save lead");
      }

      const result = await response.json();

      // Optimistically update the local state immediately
      if (result) {
        if (editingLead) {
          // Update existing lead in the list
          setLeads((prev) =>
            prev.map((l) => (l.id === editingLead.id ? { ...l, ...result } : l))
          );
        } else {
          // Add new lead at the beginning of the list
          setLeads((prev) => [result, ...prev]);
        }
      }

      toast.success(editingLead ? "Lead updated" : "Lead created");
      
      // If status is OPPORTUNITY, don't close modal yet - let the form handle it
      if (data.status === "OPPORTUNITY") {
        // Return the result so the form can use the ID
        return result;
      }
      
      setIsModalOpen(false);
      setEditingLead(null);
      
      // Refresh to ensure server state is synced
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    return `€${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const columns: ColumnDef<Lead>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      cell: ({ row }) => {
        const lead = row.original;
        const truncatedDescription = lead.description ? truncateText(lead.description, 80) : "";
        const hasFullDescription = lead.description && lead.description.length > 80;
        
        return (
          <div className="space-y-0.5">
            <span className="font-light text-xs text-foreground">{lead.title}</span>
            {truncatedDescription && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 cursor-help">
                    {truncatedDescription}
                  </p>
                </TooltipTrigger>
                {hasFullDescription && (
                  <TooltipContent className="max-w-md">
                    <p className="text-xs whitespace-pre-wrap">{lead.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      id: "company",
      header: "Company",
      accessorKey: "companyName",
      enableSorting: true,
      cell: ({ row }) => {
        const lead = row.original;
        const truncatedCompany = truncateText(lead.companyName, 30);
        const hasFullCompany = lead.companyName.length > 30;
        const companyDetails = (lead as any).companyDetails;
        
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 text-xs font-light cursor-help">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{truncatedCompany}</span>
              </span>
            </TooltipTrigger>
            {(hasFullCompany || companyDetails) && (
              <TooltipContent className="max-w-sm">
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{lead.companyName}</p>
                  {companyDetails && (
                    <div className="text-xs space-y-0.5">
                      {companyDetails.address && (
                        <p><strong>Address:</strong> {companyDetails.address}</p>
                      )}
                      {companyDetails.city && (
                        <p><strong>City:</strong> {companyDetails.city}</p>
                      )}
                      {companyDetails.phone && (
                        <p><strong>Phone:</strong> {companyDetails.phone}</p>
                      )}
                      {companyDetails.email && (
                        <p><strong>Email:</strong> {companyDetails.email}</p>
                      )}
                      {companyDetails.website && (
                        <p><strong>Website:</strong> {companyDetails.website}</p>
                      )}
                    </div>
                  )}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.original.status;
        const colorClass = statusColors[status] || statusColors.LEAD;
        return (
          <Badge
            variant="outline"
            className={`${colorClass} border text-[8px] font-light px-2 py-0.5`}
            dotColor={status}
          >
            {status.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      id: "valueEstimate",
      header: "Value",
      accessorKey: "valueEstimate",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs font-light">
          {formatCurrency(row.original.valueEstimate)}
        </span>
      ),
    },
    {
      id: "expectedClose",
      header: "Expected Close",
      accessorKey: "expectedClose",
      enableSorting: true,
      cell: ({ row }) => {
        if (!row.original.expectedClose) return <span className="text-xs font-light">-</span>;
        const date = typeof row.original.expectedClose === "string"
          ? new Date(row.original.expectedClose)
          : row.original.expectedClose;
        return (
          <span className="flex items-center gap-1 text-xs font-light">
            <Calendar className="h-3.5 w-3.5" />
            {format(date, "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      id: "contacts",
      header: "Contacts",
      accessorKey: "contactCount",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-xs font-light">
          <User className="h-3.5 w-3.5" />
          {row.original.contactCount || 0}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      accessorKey: "createdAt",
      enableSorting: true,
      cell: ({ row }) => {
        const date = typeof row.original.createdAt === "string"
          ? new Date(row.original.createdAt)
          : row.original.createdAt;
        return (
          <span className="text-xs font-light">
            {format(date, "MMM d, yyyy")}
          </span>
        );
      },
    },
  ];

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "LEAD", label: "Lead" },
    { value: "QUALIFIED", label: "Qualified" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "NEEDS_ANALYSIS", label: "Needs Analysis" },
    { value: "OPPORTUNITY", label: "Opportunity" },
    { value: "NEGOTIATION", label: "Negotiation" },
    { value: "OFFER_SENT", label: "Offer Sent" },
    { value: "OFFER_ACCEPTED", label: "Offer Accepted" },
    { value: "WON", label: "Won" },
    { value: "LOST", label: "Lost" },
    { value: "CUSTOMER", label: "Customer" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="font-light tracking-tight text-sm">LEADS</h1>
          <p className="text-xs text-muted-foreground font-light">
            Manage your leads, opportunities, and deals
          </p>
        </div>
        <Button onClick={handleCreate} size="default" className="bg-[#142030] hover:bg-[#142030]/90 text-white">
          <Plus className="h-4 w-4" />
          New Lead
        </Button>
      </div>

      <Card className="border-dotted border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-light">All Leads</CardTitle>
              <CardDescription className="text-[10px]">
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  className="pl-10 h-9 w-[350px] text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <DataTable
            data={filteredLeads}
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
                label: "Generate Questions via AI",
                value: "generate-questions",
                onClick: handleGenerateQuestions,
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

      <LeadFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        companies={companies}
        initialData={editingLead ? {
          title: editingLead.title,
          description: editingLead.description,
          status: editingLead.status,
          companyId: editingLead.companyId,
          valueEstimate: editingLead.valueEstimate,
          expectedClose: editingLead.expectedClose
            ? (typeof editingLead.expectedClose === "string"
                ? editingLead.expectedClose.split("T")[0]
                : editingLead.expectedClose.toISOString().split("T")[0])
            : undefined,
          outcome: editingLead.outcome,
        } : undefined}
      />

      {selectedLeadForAI && (
        <AIQuestionsModal
          open={isAIQuestionsModalOpen}
          onOpenChange={(open) => {
            setIsAIQuestionsModalOpen(open);
            if (!open) {
              setSelectedLeadForAI(null);
              setLeadContacts([]);
            }
          }}
          leadId={selectedLeadForAI.id}
          contacts={leadContacts}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onQuestionsCreated={() => {
            router.refresh();
            setSelectedLeadForAI(null);
            setLeadContacts([]);
          }}
        />
      )}
      <ConfirmDialog />
    </div>
  );
}

