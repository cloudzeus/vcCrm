// @ts-nocheck
// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  DollarSign,
  Calendar,
  User,
  Edit,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { LeadFormModal } from "@/components/forms/lead-form-modal";
import { ContactFormModal } from "@/components/forms/contact-form-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import type { LeadDetail, LeadFormData, CompanyListItem } from "@/lib/types/crm";
import { OpportunityKanban } from "@/components/opportunities/opportunity-kanban";
import { TaskFormModal } from "@/components/forms/task-form-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/hooks/use-confirm";

interface LeadDetailClientProps {
  lead: LeadDetail;
  allCompanies: CompanyListItem[];
  tasks: Array<{
    id: string;
    title: string;
    question: string;
    description: string | null;
    answer: string | null;
    status: string;
    priority: number;
    startDate?: Date | string | null;
    dueDate: Date | string | null;
    reminderDate?: Date | string | null;
    assignedTo: {
      id: string;
      name: string;
      email: string | null;
    } | null;
    attachments?: Array<{
      id: string;
      filename: string;
      url: string;
      mimeType: string;
      sizeBytes: number;
    }>;
    emailSentAt: Date | string | null;
    answeredAt: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  }>;
  companyContacts: Array<{
    id: string;
    name: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    jobPosition: string | null;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    contacts: Array<{
      id: string;
      name: string;
      lastName: string | null;
      email: string | null;
      phone: string | null;
      jobPosition: string | null;
    }>;
  }>;
  allAvailableContacts?: Array<{
    id: string;
    name: string;
    email: string | null;
  }>;
  taskCount: number;
  completedTaskCount: number;
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

export function LeadDetailClient({
  lead,
  allCompanies,
  tasks = [],
  companyContacts = [],
  suppliers = [],
  allAvailableContacts = [],
  taskCount = 0,
  completedTaskCount = 0,
}: LeadDetailClientProps) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<Array<{ value: string; label: string; group: string }>>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [contactRole, setContactRole] = useState<string>("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    return `€${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleSubmit = async (data: LeadFormData) => {
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update lead");
      }

      toast.success("Lead updated");
      router.refresh();
      setIsEditModalOpen(false);
    } catch (error) {
      throw error;
    }
  };

  const getStatusIcon = (status: CrmStatusType) => {
    if (status === "WON" || status === "CUSTOMER") {
      return <CheckCircle2 className="h-4 w-4" />;
    }
    if (status === "LOST") {
      return <XCircle className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const handleAddContactClick = async () => {
    try {
      // Fetch ALL contacts from the organization
      const response = await fetch("/api/contacts");
      if (!response.ok) {
        toast.error("Failed to load contacts");
        return;
      }

      const allOrgContacts = await response.json();
      
      // Filter out contacts already in the lead
      const existingContactIds = lead.contacts.map(c => c.id);
      const availableContactsList = allOrgContacts.filter(
        (contact: any) => !existingContactIds.includes(contact.id)
      );

      // Build options grouped by company/supplier
      const contactOptions = availableContactsList.map((contact: any) => {
        const displayName = `${contact.name} ${contact.lastName || ""}`.trim();
        const emailText = contact.email ? ` (${contact.email})` : "";
        const label = `${displayName}${emailText}`;
        
        let group = "Other Contacts";
        if (contact.company) {
          group = `Company - ${contact.company.name}`;
        } else if (contact.supplier) {
          group = `Supplier - ${contact.supplier.name}`;
        }

        return {
          value: contact.id,
          label,
          group,
        };
      });

      // Sort by group name for better organization
      contactOptions.sort((a: any, b: any) => {
        if (a.group === b.group) {
          return a.label.localeCompare(b.label);
        }
        return a.group.localeCompare(b.group);
      });

      setAvailableContacts(contactOptions);
      setIsAddContactDialogOpen(true);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Failed to load contacts");
    }
  };

  const handleAddContactToLead = async () => {
    if (!selectedContactId) {
      toast.error("Please select a contact");
      return;
    }

    try {
      const response = await fetch(`/api/leads/${lead.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContactId,
          role: contactRole || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add contact");
      }

      toast.success("Contact added successfully");
      setIsAddContactDialogOpen(false);
      setSelectedContactId("");
      setContactRole("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add contact");
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    const confirmed = await confirm("Are you sure you want to remove this contact from the lead?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/leads/${lead.id}/contacts?contactId=${contactId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove contact");
      }

      toast.success("Contact removed successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove contact");
    }
  };

  const handleCreateTask = async (data: any) => {
    try {
      const response = await fetch(`/api/opportunities/${lead.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }

      const createdTask = await response.json();
      toast.success("Task created successfully");
      setIsTaskModalOpen(false);
      router.refresh();
      return createdTask; // Return the created task so files can be uploaded
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateTask = async (data: any) => {
    if (!editingTask) return;

    try {
      const response = await fetch(`/api/opportunities/${lead.id}/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update task");
      }

      toast.success("Task updated successfully");
      setIsTaskModalOpen(false);
      setEditingTask(null);
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  const handleTaskSubmit = async (data: any) => {
    if (editingTask) {
      await handleUpdateTask(data);
      return null; // Return null for updates since we don't need the ID
    } else {
      return await handleCreateTask(data); // Return created task for file uploads
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const response = await fetch(`/api/opportunities/${lead.id}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update task");
    }
  };

  const handleTaskDelete = async (task: { id: string } | string) => {
    const confirmed = await confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    // Handle both task object and task ID string
    const taskId = typeof task === "string" ? task : task.id;

    try {
      const response = await fetch(`/api/opportunities/${lead.id}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete task");
      }

      toast.success("Task deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task");
    }
  };

  const handleCreateContact = async (data: any) => {
    try {
      // Create the contact first
      const createResponse = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          companyId: lead.companyId,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create contact");
      }

      const newContact = await createResponse.json();

      // Add the contact to the lead
      const addResponse = await fetch(`/api/leads/${lead.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: newContact.id,
          role: null,
        }),
      });

      if (!addResponse.ok) {
        const error = await addResponse.json();
        throw new Error(error.error || "Failed to add contact to lead");
      }

      toast.success("Contact created and added successfully");
      setIsContactModalOpen(false);
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/leads")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="font-light tracking-tight text-sm">LEAD DETAILS</h1>
            <p className="text-xs text-muted-foreground font-light">
              View and manage lead information
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsEditModalOpen(true)}
          size="default"
          className="bg-[#142030] hover:bg-[#142030]/90 text-white"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Lead
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-5">
          <Card className="border-dotted border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-sm font-light">{lead.title}</CardTitle>
                  {lead.description && (
                    <CardDescription className="text-xs font-light mt-2">
                      {lead.description}
                    </CardDescription>
                  )}
                </div>
                <Badge
                  className={`${statusColors[lead.status] || statusColors.LEAD} border text-[8px] font-light px-2 py-1 flex items-center gap-1.5`}
                  dotColor={lead.status}
                >
                  {getStatusIcon(lead.status)}
                  {lead.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-light">Value Estimate</p>
                  <p className="text-sm font-light">
                    {formatCurrency(lead.valueEstimate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-light">Expected Close</p>
                  <p className="text-sm font-light flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {lead.expectedClose
                      ? format(
                          typeof lead.expectedClose === "string"
                            ? new Date(lead.expectedClose)
                            : lead.expectedClose,
                          "MMM d, yyyy"
                        )
                      : "-"}
                  </p>
                </div>
              </div>

              {lead.outcome && (
                <div className="space-y-1 pt-2 border-t">
                  <p className="text-[10px] text-muted-foreground uppercase font-light">Outcome</p>
                  <p className="text-sm font-light">{lead.outcome}</p>
                </div>
              )}

              {lead.closedAt && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-light">Closed At</p>
                  <p className="text-sm font-light flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {format(
                      typeof lead.closedAt === "string"
                        ? new Date(lead.closedAt)
                        : lead.closedAt,
                      "MMM d, yyyy 'at' HH:mm"
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kanban Board */}
          <Card className="border-dotted border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-light flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks ({taskCount}) {completedTaskCount > 0 && `• ${completedTaskCount} completed`}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <OpportunityKanban
                key={`kanban-${tasks.length}-${tasks.map(t => `${t.id}-${t.priority}`).join('-')}`}
                tasks={tasks}
                opportunityId={lead.id}
                onTaskUpdate={handleTaskUpdate}
                onEditTask={(task) => {
                  setEditingTask(task);
                  setIsTaskModalOpen(true);
                }}
                onDeleteTask={handleTaskDelete}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card className="border-dotted border-gray-200 shadow-sm bg-gradient-to-br from-[#85A3B2]/10 to-[#732553]/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-light">Company</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/companies/${lead.companyId}`}
                className="flex items-center gap-3 p-3 rounded-md border border-[#85A3B2]/30 hover:border-[#85A3B2]/50 transition-colors group bg-white/60"
              >
                <div className="h-10 w-10 rounded-md bg-[#85A3B2]/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-[#85A3B2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-light text-foreground group-hover:text-[#732553] transition-colors truncate">
                    {lead.companyName}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Contacts Card */}
          <Card className="border-dotted border-gray-200 shadow-sm bg-gradient-to-br from-white to-[#85A3B2]/8">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-light flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contacts ({lead.contacts.length})
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddContactClick}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Existing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsContactModalOpen(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create New
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 flex-1 overflow-y-auto scroll-smooth" style={{ maxHeight: 'calc(4 * (3rem + 0.375rem))' }}>
                {lead.contacts.length === 0 ? (
                  <p className="text-xs font-light text-muted-foreground text-center py-4">
                    No contacts
                  </p>
                ) : (
                  lead.contacts.map((contact, index) => {
                    const isCompanyContact = contact.isCompanyContact || !!contact.companyName;
                    const isSupplierContact = contact.isSupplierContact || !!contact.supplierName;
                    const sourceName = contact.companyName || contact.supplierName || null;
                    
                    return (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={cn(
                          "flex items-start justify-between gap-2 p-2 rounded-md border transition-all duration-200",
                          isCompanyContact
                            ? "border-[#85A3B2]/30 hover:border-[#85A3B2] hover:bg-[#85A3B2]/10"
                            : isSupplierContact
                            ? "border-[#732553]/30 hover:border-[#732553] hover:bg-[#732553]/10"
                            : "border-[#85A3B2]/30 hover:border-[#85A3B2] hover:bg-[#85A3B2]/10"
                        )}
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-xs font-light text-foreground truncate">
                            {contact.name} {contact.lastName}
                          </p>
                          {sourceName && (
                            <p className={cn(
                              "text-[10px] leading-tight line-clamp-1",
                              isCompanyContact
                                ? "text-[#85A3B2]"
                                : isSupplierContact
                                ? "text-[#732553]"
                                : "text-muted-foreground"
                            )}>
                              {isCompanyContact ? "Company" : "Supplier"}: {sourceName}
                            </p>
                          )}
                          {(contact.jobPosition || contact.role) && (
                            <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                              {contact.role ? `${contact.role}${contact.jobPosition ? ` • ${contact.jobPosition}` : ""}` : contact.jobPosition}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveContact(contact.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Card */}
          <Card className="border-dotted border-gray-200 shadow-sm bg-gradient-to-br from-white to-[#732553]/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-light flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Suppliers ({suppliers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 flex-1 overflow-y-auto scroll-smooth" style={{ maxHeight: 'calc(4 * (3rem + 0.375rem))' }}>
                {suppliers.length === 0 ? (
                  <p className="text-xs font-light text-muted-foreground text-center py-4">
                    No suppliers
                  </p>
                ) : (
                  suppliers.map((supplier, index) => (
                    <motion.div
                      key={supplier.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="flex items-start justify-between gap-2 p-2 rounded-md border border-[#732553]/30 hover:border-[#732553] hover:bg-[#732553]/10 transition-all duration-200"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-light text-foreground truncate">
                          {supplier.name}
                        </p>
                        {(supplier.city || supplier.email) && (
                          <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                            {supplier.city || supplier.email || "No details"}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-dotted border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-light">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-light">Created</p>
                <p className="text-xs font-light">
                  {format(
                    typeof lead.createdAt === "string"
                      ? new Date(lead.createdAt)
                      : lead.createdAt,
                    "MMM d, yyyy"
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-light">Last Updated</p>
                <p className="text-xs font-light">
                  {format(
                    typeof lead.updatedAt === "string"
                      ? new Date(lead.updatedAt)
                      : lead.updatedAt,
                    "MMM d, yyyy 'at' HH:mm"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LeadFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleSubmit}
        companies={allCompanies}
        initialData={{
          title: lead.title,
          description: lead.description,
          status: lead.status,
          companyId: lead.companyId,
          valueEstimate: lead.valueEstimate,
          expectedClose: lead.expectedClose
            ? (typeof lead.expectedClose === "string"
                ? lead.expectedClose.split("T")[0]
                : lead.expectedClose.toISOString().split("T")[0])
            : undefined,
          outcome: lead.outcome,
        }}
      />

      <ContactFormModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        onSubmit={handleCreateContact}
        companies={allCompanies}
        suppliers={suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
        }))}
      />

      <TaskFormModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onSubmit={handleTaskSubmit}
        opportunityId={lead.id}
        contacts={allAvailableContacts}
        initialData={editingTask ? {
          title: editingTask.title,
          question: editingTask.question,
          description: editingTask.description || "",
          assignedToContactId: editingTask.assignedToContactId || "",
          priority: editingTask.priority,
          startDate: editingTask.startDate
            ? (typeof editingTask.startDate === "string"
                ? editingTask.startDate.split("T")[0]
                : new Date(editingTask.startDate).toISOString().split("T")[0])
            : undefined,
          dueDate: editingTask.dueDate
            ? (typeof editingTask.dueDate === "string"
                ? editingTask.dueDate.split("T")[0]
                : new Date(editingTask.dueDate).toISOString().split("T")[0])
            : undefined,
          reminderDate: editingTask.reminderDate
            ? (typeof editingTask.reminderDate === "string"
                ? editingTask.reminderDate.split("T")[0]
                : new Date(editingTask.reminderDate).toISOString().split("T")[0])
            : undefined,
        } : undefined}
      />

      <Dialog open={isAddContactDialogOpen} onOpenChange={setIsAddContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact to Lead</DialogTitle>
            <DialogDescription>
              Select an existing contact to add to this lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact</label>
              <Combobox
                options={availableContacts}
                value={selectedContactId}
                onValueChange={setSelectedContactId}
                placeholder="Select a contact"
                searchPlaceholder="Search contacts..."
                emptyMessage="No contacts found."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role (Optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                placeholder="e.g., Decision Maker, Purchasing"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddContactToLead}
              className="bg-[#732553] hover:bg-[#732553]/90 text-white"
            >
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}

