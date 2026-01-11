"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Calendar, User, ArrowUpRight, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TaskFormModal } from "@/components/forms/task-form-modal";

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: number;
    dueDate: Date | null;
    createdAt: Date;
    crmRecordId: string;
    crmRecordTitle: string;
    assignedToName: string | null;
    question?: string; // Needed for edit form
    startDate?: Date | null;
    reminderDate?: Date | null;
    assignedToContactId?: string | null;
}

interface LeadTasksClientProps {
    tasks: Task[];
}

export function LeadTasksClient({ tasks }: LeadTasksClientProps) {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const filteredTasks = tasks.filter((task) => {
        if (statusFilter === "ALL") return true;
        return task.status === statusFilter;
    });

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 2: // High
                return "text-red-600 bg-red-50 border-red-100";
            case 1: // Medium
                return "text-orange-600 bg-orange-50 border-orange-100";
            default: // Low
                return "text-blue-600 bg-blue-50 border-blue-100";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "TODO":
                return "bg-[#E9D8C8]/40 text-[#142030] border-[#E9D8C8]";
            case "IN_PROGRESS":
                return "bg-[#85A3B2]/40 text-[#142030] border-[#85A3B2]";
            case "REVIEW":
                return "bg-[#732553]/40 text-[#142030] border-[#732553]";
            case "DONE":
                return "bg-[#85A3B2]/40 text-[#142030] border-[#85A3B2]";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    const getCardBackground = (status: string) => {
        switch (status) {
            case "TODO":
                return "bg-[#E9D8C8]/20 border-[#E9D8C8]/20 hover:border-[#E9D8C8]/50";
            case "IN_PROGRESS":
                return "bg-[#85A3B2]/20 border-[#85A3B2]/20 hover:border-[#85A3B2]/50";
            case "REVIEW":
                return "bg-[#732553]/20 border-[#732553]/20 hover:border-[#732553]/50";
            case "DONE":
                return "bg-[#85A3B2]/20 border-[#85A3B2]/20 hover:border-[#85A3B2]/50";
            default:
                return "bg-white border-border/40 hover:border-border";
        }
    };

    const filters = [
        { label: "All Tasks", value: "ALL" },
        { label: "To Do", value: "TODO" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Review", value: "REVIEW" },
        { label: "Done", value: "DONE" },
    ];

    const handleEditClick = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation(); // Prevent card click
        setEditingTask(task);
        setIsEditModalOpen(true);
    };

    const handleTaskSubmit = async (data: any) => {
        if (!editingTask) return;

        try {
            const response = await fetch(`/api/opportunities/${editingTask.crmRecordId}/tasks/${editingTask.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update task");
            }

            toast.success("Task updated successfully");
            setIsEditModalOpen(false);
            setEditingTask(null);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update task");
            throw error;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-light tracking-tight text-foreground">Lead Tasks</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage and track all tasks associated with your leads.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {filters.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            className={cn(
                                "relative px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                                statusFilter === filter.value
                                    ? "text-white"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {statusFilter === filter.value && (
                                <motion.div
                                    layoutId="activeFilter"
                                    className="absolute inset-0 bg-[#142030] rounded-full"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{filter.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <motion.div
                layout
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
                <AnimatePresence mode="popLayout">
                    {filteredTasks.map((task) => (
                        <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card
                                className={cn(
                                    "h-full transition-all duration-200 cursor-pointer border-border/40 shadow-sm hover:shadow-md bg-gradient-to-br relative group",
                                    getCardBackground(task.status)
                                )}
                                onClick={() => router.push(`/leads/${task.crmRecordId}`)}
                            >
                                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleEditClick(e, task)}
                                        className="p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm border border-black/5 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                </div>

                                <CardHeader className="p-3 pb-2 space-y-2">
                                    <div className="flex items-start gap-2 pr-6">
                                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 border leading-none", getStatusColor(task.status))}>
                                            {task.status.replace("_", " ")}
                                        </Badge>
                                        {task.priority > 0 && (
                                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 border leading-none", getPriorityColor(task.priority))}>
                                                {task.priority === 2 ? "High" : "Medium"}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                                        {task.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-1 space-y-3">
                                    {task.description && (
                                        <div className="text-[11px] text-muted-foreground line-clamp-2">
                                            {task.description}
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-black/5 space-y-1.5">
                                        <div className="flex items-center gap-2 text-[11px] text-foreground/80">
                                            <CheckSquare className="h-3 w-3 text-muted-foreground" />
                                            <span className="truncate flex-1 font-medium">{task.crmRecordTitle}</span>
                                            <ArrowUpRight className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <User className="h-3 w-3 opacity-70" />
                                                <span>{task.assignedToName || "Unassigned"}</span>
                                            </div>
                                            {task.dueDate && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3 opacity-70" />
                                                    <span>{format(new Date(task.dueDate), "MMM d")}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredTasks.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/50 rounded-lg bg-muted/20"
                >
                    <CheckSquare className="h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium text-foreground">No tasks found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        {statusFilter === "ALL"
                            ? "There are no tasks assigned to your leads or opportunities yet."
                            : `No tasks found with status "${statusFilter.replace("_", " ")}".`
                        }
                    </p>
                </motion.div>
            )}

            {editingTask && (
                <TaskFormModal
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    onSubmit={handleTaskSubmit}
                    opportunityId={editingTask.crmRecordId}
                    contacts={[]} // We might need to fetch contacts or assume current assignee only, or just pass empty if not re-assigning often. For now empty is safer than breaking.
                    initialData={{
                        title: editingTask.title,
                        question: editingTask.question || "",
                        description: editingTask.description || "",
                        assignedToContactId: editingTask.assignedToContactId,
                        priority: editingTask.priority,
                        startDate: editingTask.startDate ? new Date(editingTask.startDate).toISOString() : null,
                        dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString() : null,
                        reminderDate: editingTask.reminderDate ? new Date(editingTask.reminderDate).toISOString() : null,
                        id: editingTask.id,
                    }}
                />
            )}
        </div>
    );
}
