"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Wand2, Calculator } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const proposalSchema = z.object({
    title: z.string().min(1, "Title is required"),
    companyId: z.string().optional(),
    crmRecordId: z.string().optional(),
    shortDescription: z.string().optional(),
    items: z.array(z.object({
        serviceId: z.string().min(1, "Service is required"),
        quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        price: z.coerce.number().min(0, "Price must be positive"),
    })).min(1, "Add at least one item"),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface Service {
    id: string;
    code: string;
    description: string;
    price: number | null;
}

interface Company {
    id: string;
    name: string;
}

interface Lead {
    id: string;
    title: string;
}

interface ProposalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    companyId?: string;
    proposalId?: string; // For editing
    crmRecordId?: string; // Optional
    onSuccess?: () => void;
}

export function ProposalModal({ open, onOpenChange, companyId, proposalId, crmRecordId, onSuccess }: ProposalModalProps) {
    const [services, setServices] = useState<Service[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ProposalFormValues>({
        resolver: zodResolver(proposalSchema) as any,
        defaultValues: {
            title: "",
            companyId: companyId || "",
            crmRecordId: crmRecordId || "",
            shortDescription: "",
            items: [{ serviceId: "", quantity: 1, price: 0 }]
        },
    });

    const watchedCompanyId = form.watch("companyId");

    // Derived effective company ID (either from prop or selected in form)
    // When editing, we should probably stick to what the proposal has, unless changed.
    const effectiveCompanyId = companyId || watchedCompanyId;

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "items",
    });

    useEffect(() => {
        if (open) {
            fetchServices();
            if (!companyId) {
                fetchCompanies();
            }

            if (proposalId) {
                fetchProposalData(proposalId);
            } else {
                form.reset({
                    title: "",
                    companyId: companyId || "",
                    crmRecordId: crmRecordId || "",
                    shortDescription: "",
                    items: [{ serviceId: "", quantity: 1, price: 0 }]
                });
            }
        }
    }, [open, companyId, proposalId]);

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/services");
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            }
        } catch (error) {
            console.error("Failed to fetch services", error);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await fetch("/api/companies");
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } catch (error) {
            console.error("Failed to fetch companies", error);
        }
    };

    const fetchProposalData = async (id: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/proposals/${id}`);
            if (res.ok) {
                const data = await res.json();
                form.reset({
                    title: data.title,
                    companyId: data.companyId,
                    crmRecordId: data.crmRecordId || "",
                    shortDescription: data.shortDescription || "",
                    items: data.items.map((i: any) => ({
                        serviceId: i.serviceId, // Needs to match current service IDs (assuming they are stable)
                        quantity: i.quantity,
                        price: i.price
                    }))
                });
                // Ensure leads are fetched for this company
                if (data.companyId) {
                    fetchLeads(data.companyId);
                }
            }
        } catch (error) {
            console.error("Failed to fetch proposal", error);
            toast.error("Could not load proposal details");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLeads = async (cid: string) => {
        try {
            // Assuming we can filter leads by company via query param or we fetch all and filter client side
            // Ideally: /api/leads?companyId=...
            // Or use existing leads endpoint and filter if it returns companyId
            // For now, let's assume we can fetch leads for a company.
            // If /api/leads doesn't support filtering, we might need to adjust.
            // Let's try fetching from /api/companies/[id] which usually has relations?
            // Or just fetch all leads and filter.
            // Let's try fetching all leads first as it matches existing pattern likely.
            const res = await fetch(`/api/leads`);
            if (res.ok) {
                const data = await res.json();
                // Filter by companyId
                const companyLeads = data.filter((l: any) => l.companyId === cid);
                setLeads(companyLeads);
            }
        } catch (error) {
            console.error("Failed to fetch leads", error);
        }
    };

    const handleServiceChange = (index: number, serviceId: string) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            form.setValue(`items.${index}.price`, service.price || 0);
        }
    };

    const calculateTotal = () => {
        const items = form.getValues("items");
        return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    const onSubmit = async (data: ProposalFormValues) => {
        if (!proposalId && !companyId && !data.companyId) {
            form.setError("companyId", { message: "Please select a company" });
            return;
        }

        setIsGenerating(true);
        try {
            const url = proposalId ? `/api/proposals/${proposalId}` : "/api/proposals";
            const method = proposalId ? "PATCH" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    companyId: companyId || data.companyId,
                    crmRecordId: data.crmRecordId || crmRecordId,
                }),
            });

            if (!response.ok) throw new Error("Failed to save proposal");

            toast.success(proposalId ? "Proposal updated successfully!" : "Proposal created & generated successfully!");
            if (!proposalId) form.reset(); // Only reset on create? Or both? Usually fetching fresh data on edit open anyway.
            onOpenChange(false);
            onSuccess?.();

        } catch (error) {
            toast.error("Failed to save proposal");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] lg:w-[65%] max-w-none max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Proposal</DialogTitle>
                    <DialogDescription>Add services and generate a proposal using AI.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {!companyId && (
                            <FormField
                                control={form.control}
                                name="companyId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a company" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {companies.map((company) => (
                                                    <SelectItem key={company.id} value={company.id}>
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Show Leads selection when Company is selected (either via prop or dropdown) */}
                        {(companyId || form.watch('companyId')) && !crmRecordId && (
                            <FormField
                                control={form.control}
                                name="crmRecordId" // I need to add this to schema/form values if not there
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Related Lead / Opportunity (Optional)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a lead..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {leads.map((lead) => (
                                                    <SelectItem key={lead.id} value={lead.id}>
                                                        {lead.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Proposal Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Website Redesign Proposal" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="shortDescription"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Short Description / Context</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Provide context for the AI (e.g. client goals, specific constraints)..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span>Services</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ serviceId: "", quantity: 1, price: 0 })}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Service
                                </Button>
                            </div>

                            <AnimatePresence initial={false}>
                                {fields.map((field, index) => (
                                    <motion.div
                                        key={field.id}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex gap-2 items-start"
                                    >
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.serviceId`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select
                                                        onValueChange={(val) => {
                                                            field.onChange(val);
                                                            handleServiceChange(index, val);
                                                        }}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Service" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {services.map((s) => (
                                                                <SelectItem key={s.id} value={s.id}>
                                                                    {s.code} - {s.description}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem className="w-20">
                                                    <FormControl>
                                                        <Input type="number" min="1" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.price`}
                                            render={({ field }) => (
                                                <FormItem className="w-28">
                                                    <FormControl>
                                                        <Input type="number" min="0" step="0.01" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive mt-0.5"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <div className="flex justify-end pt-2 border-t mt-4">
                                <div className="text-sm font-medium flex items-center gap-2">
                                    <Calculator className="h-4 w-4" />
                                    Estimated Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculateTotal())}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isGenerating}>
                                {isGenerating ? (
                                    <>
                                        <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Generate Proposal
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
