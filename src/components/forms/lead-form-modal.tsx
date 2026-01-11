// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LeadFormData, CompanyListItem } from "@/lib/types/crm";
import { CrmStatus } from "@prisma/client";

const leadSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  status: z.nativeEnum(CrmStatus),
  companyId: z.string().min(1, "Company is required"),
  valueEstimate: z.number().optional().or(z.literal("")),
  expectedClose: z.string().optional(),
  outcome: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LeadFormData) => Promise<any>;
  companies: CompanyListItem[];
  initialData?: Partial<LeadFormData> & { id?: string };
}

export function LeadFormModal({
  open,
  onOpenChange,
  onSubmit,
  companies,
  initialData,
}: LeadFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [showQuestionGeneration, setShowQuestionGeneration] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      status: initialData?.status ?? "LEAD",
      companyId: initialData?.companyId ?? "",
      valueEstimate: initialData?.valueEstimate ?? undefined,
      expectedClose: initialData?.expectedClose ?? "",
      outcome: initialData?.outcome ?? "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title ?? "",
        description: initialData.description ?? "",
        status: initialData.status ?? "LEAD",
        companyId: initialData.companyId ?? "",
        valueEstimate: initialData.valueEstimate ?? undefined,
        expectedClose: initialData.expectedClose ?? "",
        outcome: initialData.outcome ?? "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        status: "LEAD",
        companyId: "",
        valueEstimate: undefined,
        expectedClose: "",
        outcome: "",
      });
    }
  }, [initialData, open, form]);

  const handleSubmit = async (data: LeadFormValues) => {
    setLoading(true);
    try {
      const submitData: LeadFormData = {
        title: data.title,
        description: data.description,
        status: data.status,
        companyId: data.companyId,
        valueEstimate: typeof data.valueEstimate === "number" ? data.valueEstimate : undefined,
        expectedClose: data.expectedClose === "" ? undefined : data.expectedClose,
        outcome: data.outcome === "" ? undefined : data.outcome,
      };
      const result = await onSubmit(submitData);

      // If status is OPPORTUNITY, show question generation option
      if (data.status === "OPPORTUNITY" && result) {
        setSavedLeadId(result.id);
        setShowQuestionGeneration(true);
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save lead");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!savedLeadId && !initialData?.id) {
      toast.error("Please save the opportunity first");
      return;
    }

    const opportunityId = savedLeadId || initialData?.id;
    if (!opportunityId) return;

    setIsGeneratingQuestions(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/generate-questions`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate questions");
      }

      const result = await response.json();
      toast.success(`Generated ${result.count} questions successfully`);

      // Close modal and redirect to lead detail page
      onOpenChange(false);
      router.push(`/leads/${opportunityId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate questions");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleViewOpportunity = () => {
    const opportunityId = savedLeadId || initialData?.id;
    if (opportunityId) {
      onOpenChange(false);
      router.push(`/leads/${opportunityId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle>
              {initialData ? "Edit Lead" : "Create New Lead"}
            </DialogTitle>
            <DialogDescription>
              {initialData
                ? "Update lead details below."
                : "Fill in the details to create a new lead, opportunity, or deal."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hotel PBX Renewal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add details about this lead or opportunity..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={companies.map((c) => ({
                            value: c.id,
                            label: c.name.length > 40 ? c.name.substring(0, 40) + "..." : c.name,
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select company"
                          searchPlaceholder="Search companies..."
                          emptyMessage="No company found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LEAD">Lead</SelectItem>
                            <SelectItem value="QUALIFIED">Qualified</SelectItem>
                            <SelectItem value="CONTACTED">Contacted</SelectItem>
                            <SelectItem value="NEEDS_ANALYSIS">Needs Analysis</SelectItem>
                            <SelectItem value="OPPORTUNITY">Opportunity</SelectItem>
                            <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                            <SelectItem value="OFFER_SENT">Offer Sent</SelectItem>
                            <SelectItem value="OFFER_ACCEPTED">Offer Accepted</SelectItem>
                            <SelectItem value="WON">Won</SelectItem>
                            <SelectItem value="LOST">Lost</SelectItem>
                            <SelectItem value="CUSTOMER">Customer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valueEstimate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value Estimate (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? "" : parseFloat(value) || 0);
                            }}
                            value={field.value === undefined ? "" : field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expectedClose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Close Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("status") === "LOST" || form.watch("status") === "WON" ? (
                  <FormField
                    control={form.control}
                    name="outcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outcome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Won - Contract signed, Lost - Budget constraints"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                {form.watch("status") === "OPPORTUNITY" && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-[#732553] mt-0.5 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <h4 className="text-sm font-medium">AI Question Generation</h4>
                        <p className="text-xs text-muted-foreground">
                          After saving this opportunity, you can generate AI-powered questions to clarify requirements and prepare a proposal. These questions will be converted into tasks that you can manage in a Kanban board.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {showQuestionGeneration && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Opportunity Saved Successfully!</h4>
                        <p className="text-xs text-muted-foreground">
                          Generate AI-powered questions to clarify requirements and create tasks for this opportunity.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={handleGenerateQuestions}
                          disabled={isGeneratingQuestions}
                          className="bg-[#732553] hover:bg-[#732553]/90 text-white"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isGeneratingQuestions ? "Generating..." : "Generate Questions"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleViewOpportunity}
                        >
                          View Opportunity
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setShowQuestionGeneration(false);
                            onOpenChange(false);
                          }}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || showQuestionGeneration}
                  className="bg-[#142030] hover:bg-[#142030]/90 text-white"
                >
                  {loading ? "Saving..." : initialData ? "Update Lead" : "Create Lead"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

