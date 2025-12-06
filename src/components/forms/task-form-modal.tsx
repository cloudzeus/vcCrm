// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
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
import { FileUpload } from "@/components/ui/file-upload";
import { Upload, X, File, Calendar as CalendarIcon, Clock, ExternalLink } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  question: z.string().min(1, "Question is required"),
  description: z.string().optional(),
  assignedToContactId: z.string().optional().nullable(),
  priority: z.number().int().min(0).max(2).default(0),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  reminderDate: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormValues) => Promise<void>;
  contacts?: Array<{ id: string; name: string; email: string | null; type?: "contact" | "user"; role?: string }>;
  initialData?: Partial<TaskFormValues> & { id?: string };
  opportunityId: string;
}

export function TaskFormModal({
  open,
  onOpenChange,
  onSubmit,
  contacts = [],
  initialData,
  opportunityId,
}: TaskFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      question: initialData?.question ?? "",
      description: initialData?.description ?? "",
      assignedToContactId: initialData?.assignedToContactId ?? null,
      priority: initialData?.priority ?? 0,
      startDate: initialData?.startDate ?? null,
      dueDate: initialData?.dueDate ?? null,
      reminderDate: initialData?.reminderDate ?? null,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title ?? "",
        question: initialData.question ?? "",
        description: initialData.description ?? "",
        assignedToContactId: initialData.assignedToContactId ?? null,
        priority: initialData.priority ?? 0,
        startDate: initialData.startDate ?? null,
        dueDate: initialData.dueDate ?? null,
        reminderDate: initialData.reminderDate ?? null,
      });
      setCreatedTaskId(initialData.id || null);
      setPendingFiles([]);
    } else {
      form.reset({
        title: "",
        question: "",
        description: "",
        assignedToContactId: null,
        priority: 0,
        startDate: null,
        dueDate: null,
        reminderDate: null,
      });
      setCreatedTaskId(null);
      setPendingFiles([]);
    }
  }, [initialData, open, form]);

  const uploadFileToTask = async (file: File, taskId: string) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/opportunities/${opportunityId}/tasks/${taskId}/attachments`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return await response.json();
  };

  const handleSubmit = async (data: TaskFormValues) => {
    setLoading(true);
    try {
      // Submit the task data and get the result (which should include the task ID)
      const result = await onSubmit(data);
      
      // If we have pending files and we created a new task, upload them
      if (pendingFiles.length > 0 && !initialData?.id && result) {
        // Get the task ID from the result (the API returns { task: {...} })
        const taskId = (result as any)?.task?.id || (result as any)?.id;
        
        if (taskId) {
          try {
            // Upload all pending files
            await Promise.all(
              pendingFiles.map((file) => uploadFileToTask(file, taskId))
            );
            toast.success(`Task created and ${pendingFiles.length} file(s) uploaded successfully`);
          } catch (uploadError) {
            toast.error("Task created but some files failed to upload");
            console.error("File upload error:", uploadError);
          }
        } else {
          console.warn("Task created but could not get task ID for file upload. Result:", result);
        }
      }

      form.reset();
      setPendingFiles([]);
      setCreatedTaskId(null);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset pending files when closing
      setPendingFiles([]);
      setCreatedTaskId(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle>
              {initialData ? "Edit Task" : "Create New Task"}
            </DialogTitle>
            <DialogDescription>
              {initialData
                ? "Update task details below."
                : "Create a new question or task for this opportunity."}
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
                        <Input placeholder="e.g., Budget Confirmation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the question that needs to be answered..."
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional context or notes..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assignedToContactId"
                    render={({ field }) => {
                      const contactOptions = contacts
                        .filter((c) => !c.type || c.type === "contact")
                        .map((contact) => ({
                          value: contact.id,
                          label: `${contact.name}${contact.email ? ` (${contact.email})` : ""}`,
                          group: "Contacts",
                        }));
                      
                      const userOptions = contacts
                        .filter((c) => c.type === "user")
                        .map((user) => {
                          const roleLabels: Record<string, string> = {
                            SUPERADMIN: "Super Admin",
                            OWNER: "Owner",
                            MANAGER: "Manager",
                            INFLUENCER: "Influencer",
                            CLIENT: "Client",
                          };
                          const roleLabel = user.role ? roleLabels[user.role] || user.role : "";
                          const roleText = roleLabel ? ` [${roleLabel}]` : "";
                          return {
                            value: user.id,
                            label: `${user.name}${roleText}${user.email ? ` (${user.email})` : ""}`,
                            group: "Users",
                          };
                        });

                      const options = [
                        { value: "none", label: "None", group: "default" },
                        ...contactOptions,
                        ...userOptions,
                      ];

                      return (
                        <FormItem>
                          <FormLabel>Assign To</FormLabel>
                          <FormControl>
                            <Combobox
                              options={options}
                              value={field.value || "none"}
                              onValueChange={(value) => {
                                field.onChange(value === "none" || !value ? null : value);
                              }}
                              placeholder="Select contact (optional)"
                              searchPlaceholder="Search contacts..."
                              emptyMessage="No contacts found."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Low</SelectItem>
                            <SelectItem value="1">Medium</SelectItem>
                            <SelectItem value="2">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => {
                      const dateValue = field.value ? new Date(field.value) : null;
                      const selectedDate = dateValue ? new Date(new Date(dateValue).setHours(0, 0, 0, 0)) : undefined;
                      const timeValue = dateValue 
                        ? `${String(dateValue.getHours()).padStart(2, "0")}:${String(dateValue.getMinutes()).padStart(2, "0")}`
                        : "09:00";

                      const updateDateTime = (date: Date | undefined, time: string) => {
                        if (date) {
                          const [hours, minutes] = time.split(":").map(Number);
                          const newDate = new Date(date);
                          newDate.setHours(hours || 9, minutes || 0, 0, 0);
                          field.onChange(newDate.toISOString());
                        } else {
                          field.onChange(null);
                        }
                      };

                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date & Time</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    <div className="flex items-center gap-2 w-full">
                                      <CalendarIcon className="h-4 w-4 opacity-50" />
                                      <span className="flex-1">{format(new Date(field.value), "PPP")}</span>
                                      <Clock className="h-4 w-4 opacity-50" />
                                      <span>{format(new Date(field.value), "HH:mm")}</span>
                                    </div>
                                  ) : (
                                    <span>Pick date and time</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="p-3 space-y-3">
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={(date) => {
                                    if (date) {
                                      updateDateTime(date, timeValue);
                                    }
                                  }}
                                  initialFocus
                                />
                                <div className="border-t pt-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="time"
                                      value={timeValue}
                                      onChange={(e) => {
                                        const newTime = e.target.value || timeValue;
                                        if (selectedDate) {
                                          updateDateTime(selectedDate, newTime);
                                        }
                                      }}
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => {
                      const dateValue = field.value ? new Date(field.value) : null;
                      const selectedDate = dateValue ? new Date(new Date(dateValue).setHours(0, 0, 0, 0)) : undefined;
                      const timeValue = dateValue 
                        ? `${String(dateValue.getHours()).padStart(2, "0")}:${String(dateValue.getMinutes()).padStart(2, "0")}`
                        : "17:00";

                      const updateDateTime = (date: Date | undefined, time: string) => {
                        if (date) {
                          const [hours, minutes] = time.split(":").map(Number);
                          const newDate = new Date(date);
                          newDate.setHours(hours || 17, minutes || 0, 0, 0);
                          field.onChange(newDate.toISOString());
                        } else {
                          field.onChange(null);
                        }
                      };

                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date & Time</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    <div className="flex items-center gap-2 w-full">
                                      <CalendarIcon className="h-4 w-4 opacity-50" />
                                      <span className="flex-1">{format(new Date(field.value), "PPP")}</span>
                                      <Clock className="h-4 w-4 opacity-50" />
                                      <span>{format(new Date(field.value), "HH:mm")}</span>
                                    </div>
                                  ) : (
                                    <span>Pick date and time</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="p-3 space-y-3">
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={(date) => {
                                    if (date) {
                                      updateDateTime(date, timeValue);
                                    }
                                  }}
                                  initialFocus
                                />
                                <div className="border-t pt-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="time"
                                      value={timeValue}
                                      onChange={(e) => {
                                        const newTime = e.target.value || timeValue;
                                        if (selectedDate) {
                                          updateDateTime(selectedDate, newTime);
                                        }
                                      }}
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="reminderDate"
                    render={({ field }) => {
                      const dateValue = field.value ? new Date(field.value) : null;
                      const selectedDate = dateValue ? new Date(new Date(dateValue).setHours(0, 0, 0, 0)) : undefined;
                      const timeValue = dateValue 
                        ? `${String(dateValue.getHours()).padStart(2, "0")}:${String(dateValue.getMinutes()).padStart(2, "0")}`
                        : "10:00";

                      const updateDateTime = (date: Date | undefined, time: string) => {
                        if (date) {
                          const [hours, minutes] = time.split(":").map(Number);
                          const newDate = new Date(date);
                          newDate.setHours(hours || 10, minutes || 0, 0, 0);
                          field.onChange(newDate.toISOString());
                        } else {
                          field.onChange(null);
                        }
                      };

                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Reminder Date & Time</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    <div className="flex items-center gap-2 w-full">
                                      <CalendarIcon className="h-4 w-4 opacity-50" />
                                      <span className="flex-1">{format(new Date(field.value), "PPP")}</span>
                                      <Clock className="h-4 w-4 opacity-50" />
                                      <span>{format(new Date(field.value), "HH:mm")}</span>
                                    </div>
                                  ) : (
                                    <span>Pick date and time</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="p-3 space-y-3">
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={(date) => {
                                    if (date) {
                                      updateDateTime(date, timeValue);
                                    }
                                  }}
                                  initialFocus
                                />
                                <div className="border-t pt-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="time"
                                      value={timeValue}
                                      onChange={(e) => {
                                        const newTime = e.target.value || timeValue;
                                        if (selectedDate) {
                                          updateDateTime(selectedDate, newTime);
                                        }
                                      }}
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <div>
                  <FormLabel>Attachments</FormLabel>
                  {initialData?.id ? (
                    <FileUpload
                      uploadUrl={`/api/opportunities/${opportunityId}/tasks/${initialData.id}/attachments`}
                      onUploadComplete={() => {
                        // Files are uploaded and stored automatically
                      }}
                      multiple
                      className="mt-2"
                    />
                  ) : (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.multiple = true;
                            input.onchange = (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files && files.length > 0) {
                                setPendingFiles((prev) => [...prev, ...Array.from(files)]);
                              }
                            };
                            input.click();
                          }}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Add Files
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Files will be uploaded after task creation
                        </span>
                      </div>
                      {pendingFiles.length > 0 && (
                        <div className="space-y-2">
                          {pendingFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-muted rounded-md"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {file.size < 1024
                                      ? `${file.size} B`
                                      : file.size < 1024 * 1024
                                      ? `${(file.size / 1024).toFixed(1)} KB`
                                      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setPendingFiles((prev) => prev.filter((_, i) => i !== index));
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/leads/${opportunityId}`)}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Lead
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-[#142030] hover:bg-[#142030]/90 text-white">
                    {loading ? "Saving..." : initialData ? "Update Task" : "Create Task"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

