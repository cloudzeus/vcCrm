"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PostStatus, PlatformType, ContentType } from "@prisma/client";

const postScheduleSchema = z.object({
  platform: z.nativeEnum(PlatformType),
  contentType: z.nativeEnum(ContentType),
  scheduledAt: z.string().min(1, "Scheduled date is required"),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  status: z.nativeEnum(PostStatus),
  caption: z.string().optional(),
  notes: z.string().optional(),
});

type PostScheduleFormValues = z.infer<typeof postScheduleSchema>;

interface PostScheduleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PostScheduleFormValues) => Promise<void>;
  initialData?: {
    platform?: string;
    contentType?: string;
    scheduledAt?: string | Date;
    status?: string;
    caption?: string | null;
    notes?: string | null;
  };
}

export function PostScheduleFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: PostScheduleFormModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<PostScheduleFormValues>({
    resolver: zodResolver(postScheduleSchema),
    defaultValues: {
      platform: initialData?.platform as PlatformType || PlatformType.INSTAGRAM,
      contentType: initialData?.contentType as ContentType || ContentType.POST,
      scheduledAt: initialData?.scheduledAt
        ? new Date(initialData.scheduledAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      scheduledTime: initialData?.scheduledAt
        ? new Date(initialData.scheduledAt).toTimeString().slice(0, 5)
        : "12:00",
      status: (initialData?.status as PostStatus) || PostStatus.PLANNED,
      caption: initialData?.caption || "",
      notes: initialData?.notes || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      const scheduledDate = initialData.scheduledAt
        ? new Date(initialData.scheduledAt)
        : new Date();
      form.reset({
        platform: (initialData.platform as PlatformType) || PlatformType.INSTAGRAM,
        contentType: (initialData.contentType as ContentType) || ContentType.POST,
        scheduledAt: scheduledDate.toISOString().split("T")[0],
        scheduledTime: scheduledDate.toTimeString().slice(0, 5),
        status: (initialData.status as PostStatus) || PostStatus.PLANNED,
        caption: initialData.caption || "",
        notes: initialData.notes || "",
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (values: PostScheduleFormValues) => {
    setLoading(true);
    try {
      // Combine date and time
      const [year, month, day] = values.scheduledAt.split("-").map(Number);
      const [hours, minutes] = values.scheduledTime.split(":").map(Number);
      const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);

      await onSubmit({
        ...values,
        scheduledAt: scheduledDateTime.toISOString(),
        scheduledTime: values.scheduledTime,
      } as any);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save post schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Post Schedule</DialogTitle>
          <DialogDescription>
            Update the post schedule details and timing.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PlatformType).map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ContentType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(PostStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Post caption..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Internal notes..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

