// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Building2,
  Users,
  DollarSign,
  Calendar,
  FileText,
  Sparkles,
  Send,
  CheckSquare,
  Edit,
  ArrowLeft,
  Plus,
  Wand2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OpportunityKanban } from "./opportunity-kanban";
import { TaskFormModal } from "@/components/forms/task-form-modal";
import { QuestionnaireEmailModal } from "@/components/forms/questionnaire-email-modal";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "sonner";
import { format } from "date-fns";
import { Paperclip, Download, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";

interface OpportunityDetail {
  id: string;
  title: string;
  description: string | null;
  companyId: string;
  company: {
    id: string;
    name: string;
    contacts: Array<{
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    }>;
  };
  contacts: Array<{
    id: string;
    name: string;
    email: string | null;
    role: string | null;
  }>;
  valueEstimate: number | null;
  expectedClose: Date | string | null;
  briefStatus: string | null;
  needs: string | null;
  productServiceScope: string | null;
  customerInfo: any;
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
  proposals: Array<{
    id: string;
    title: string;
    content: string;
    scope: string | null;
    deliverables: string | null;
    pricing: string | null;
    timeline: string | null;
    terms: string | null;
    status: string;
    version: number;
    generatedAt: Date | string;
    createdAt: Date | string;
  }>;
  taskCount: number;
  completedTaskCount: number;
  proposalCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface OpportunityDetailClientProps {
  opportunity: OpportunityDetail;
}

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

export function OpportunityDetailClient({ opportunity }: OpportunityDetailClientProps) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/generate-questions`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate questions");
      }

      toast.success("Questions generated successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate questions");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleGenerateProposal = async () => {
    setIsGeneratingProposal(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/generate-proposal`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate proposal");
      }

      toast.success("Proposal generated successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate proposal");
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const allTasksCompleted = opportunity.taskCount > 0 && opportunity.completedTaskCount === opportunity.taskCount;

  const loadAttachments = async () => {
    setLoadingAttachments(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/attachments`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data.attachments || []);
      }
    } catch (error) {
      console.error("Failed to load attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    const confirmed = await confirm("Are you sure you want to delete this file?");
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/attachments/${attachmentId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete attachment");
      }
      
      toast.success("File deleted successfully");
      loadAttachments();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete file");
    }
  };

  const handleCreateTask = async (data: any) => {
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }

      toast.success("Task created successfully");
      setIsTaskModalOpen(false);
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateTask = async (data: any) => {
    if (!editingTask) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/tasks/${editingTask.id}`, {
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
    } else {
      await handleCreateTask(data);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/leads?status=OPPORTUNITY")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-light tracking-tight">{opportunity.title}</h1>
            <p className="text-sm text-muted-foreground">{opportunity.company.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {opportunity.briefStatus || "DRAFT"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-[#732553] hover:bg-[#732553]/90 text-white border-[#732553]">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task Manually
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleGenerateQuestions}
                disabled={isGeneratingQuestions || opportunity.briefStatus === "QUESTIONS_GENERATED"}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isGeneratingQuestions ? "Generating..." : "Generate Questions with AI"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          variants={CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Tasks</p>
                  <p className="text-2xl font-light">
                    {opportunity.completedTaskCount}/{opportunity.taskCount}
                  </p>
                </div>
                <CheckSquare className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          variants={CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Proposals</p>
                  <p className="text-2xl font-light">{opportunity.proposalCount}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          variants={CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Value</p>
                  <p className="text-2xl font-light">
                    {opportunity.valueEstimate ? `€${opportunity.valueEstimate.toLocaleString()}` : "—"}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          variants={CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Expected Close</p>
                  <p className="text-sm font-light">
                    {opportunity.expectedClose
                      ? format(new Date(opportunity.expectedClose), "MMM d, yyyy")
                      : "—"}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="brief" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks ({opportunity.taskCount})
          </TabsTrigger>
          <TabsTrigger value="proposals">
            Proposals ({opportunity.proposalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brief" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-light uppercase tracking-wide">
                    Opportunity Brief
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {opportunity.briefStatus !== "QUESTIONS_GENERATED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateQuestions}
                        disabled={isGeneratingQuestions}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {isGeneratingQuestions ? "Generating..." : "Generate Questions"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {opportunity.description || "No description provided"}
                  </p>
                </div>
                {opportunity.needs && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Customer Needs</h3>
                    <p className="text-sm text-muted-foreground">{opportunity.needs}</p>
                  </div>
                )}
                {opportunity.productServiceScope && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Product/Service Scope</h3>
                    <p className="text-sm text-muted-foreground">{opportunity.productServiceScope}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Files Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-light uppercase tracking-wide flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Files
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  uploadUrl={`/api/opportunities/${opportunity.id}/attachments`}
                  onUploadComplete={() => {
                    loadAttachments();
                    router.refresh();
                  }}
                  multiple
                />
                
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-md"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium hover:underline truncate block"
                            >
                              {attachment.filename}
                            </a>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.sizeBytes / 1024).toFixed(1)} KB • {format(new Date(attachment.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(attachment.url, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/leads/${opportunity.id}/questionnaire`);
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || "Failed to fetch questionnaire");
                    }
                    const data = await response.json();
                    setQuestionnaireData(data);
                    setIsQuestionnaireModalOpen(true);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to load questionnaire");
                  }
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Questionnaire
              </Button>
            </div>
            <OpportunityKanban
              key={`kanban-${opportunity.tasks.length}-${opportunity.tasks.map(t => `${t.id}-${t.priority}`).join('-')}`}
              tasks={opportunity.tasks}
              opportunityId={opportunity.id}
              contacts={[...opportunity.company.contacts, ...opportunity.contacts.map(c => ({
                id: c.id,
                name: c.name,
                email: c.email,
              }))]}
              onTaskUpdate={() => {
                router.refresh();
              }}
              onAddTask={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              onEditTask={(task) => {
                setEditingTask({
                  id: task.id,
                  title: task.title,
                  question: task.question,
                  description: task.description,
                  assignedToContactId: task.assignedTo?.id || null,
                  priority: task.priority,
                  startDate: (task as any).startDate ? new Date((task as any).startDate).toISOString() : null,
                  dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
                  reminderDate: (task as any).reminderDate ? new Date((task as any).reminderDate).toISOString() : null,
                });
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={async (task) => {
                const confirmed = await confirm("Are you sure you want to delete this task?");
                if (!confirmed) return;
                try {
                  const response = await fetch(`/api/opportunities/${opportunity.id}/tasks/${task.id}`, {
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
              }}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-light">Proposals</h2>
              {allTasksCompleted && (
                <Button
                  variant="outline"
                  onClick={handleGenerateProposal}
                  disabled={isGeneratingProposal}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingProposal ? "Generating..." : "Generate Proposal"}
                </Button>
              )}
            </div>
            {opportunity.proposals.length === 0 ? (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {allTasksCompleted
                      ? "No proposals yet. Generate one to get started."
                      : "Complete all tasks to generate a proposal."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              opportunity.proposals.map((proposal, index) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-light">{proposal.title}</CardTitle>
                          <CardDescription className="text-xs">
                            Version {proposal.version} • {format(new Date(proposal.createdAt), "MMM d, yyyy")}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">{proposal.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: proposal.content.replace(/\n/g, "<br />") }} />
                      </div>
                      {proposal.scope && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Scope</h4>
                          <p className="text-sm text-muted-foreground">{proposal.scope}</p>
                        </div>
                      )}
                      {proposal.pricing && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Pricing</h4>
                          <p className="text-sm text-muted-foreground">{proposal.pricing}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      <TaskFormModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onSubmit={handleTaskSubmit}
        contacts={[...opportunity.company.contacts, ...opportunity.contacts.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
        }))]}
        initialData={editingTask}
        opportunityId={opportunity.id}
      />

      {questionnaireData && (
        <QuestionnaireEmailModal
          open={isQuestionnaireModalOpen}
          onOpenChange={setIsQuestionnaireModalOpen}
          leadId={opportunity.id}
          opportunityTitle={opportunity.title}
          companyName={opportunity.company.name}
          contacts={questionnaireData.contacts || []}
          onEmailsSent={() => {
            router.refresh();
            setQuestionnaireData(null);
          }}
        />
      )}
      <ConfirmDialog />
    </div>
  );
}

