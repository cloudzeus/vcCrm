"use client";

import { useState } from "react";
import { TimelineCalendar } from "./timeline-calendar";
import { PostScheduleFormModal } from "@/components/forms/post-schedule-form-modal";
import { TaskFormModal } from "@/components/forms/task-form-modal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PostSchedule {
  id: string;
  campaignId: string;
  influencerId: string;
  platform: string;
  contentType: string;
  scheduledAt: string | Date;
  status: string;
  caption?: string | null;
  campaign?: {
    name: string;
  };
  influencer?: {
    stageName?: string | null;
  };
}

interface CalendarTask {
  id: string;
  type: "task";
  title: string;
  question: string;
  status: string;
  dueDate: string;
  opportunityId: string;
  opportunityTitle: string;
  companyName: string;
  assignedTo: {
    id: string;
    name: string;
    email: string | null;
  } | null;
}

interface CalendarClientProps {
  initialPosts: PostSchedule[];
  initialTasks?: CalendarTask[];
}

export function CalendarClient({ initialPosts, initialTasks = [] }: CalendarClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [editingPost, setEditingPost] = useState<PostSchedule | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskContacts, setTaskContacts] = useState<Array<{ id: string; name: string; email: string | null; type?: "contact" | "user"; role?: string }>>([]);

  const handleReschedule = async (postId: string, newDate: Date) => {
    try {
      const response = await fetch("/api/postSchedules/reschedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postScheduleId: postId,
          newDateTime: newDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reschedule");
      }

      const updated = await response.json();

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
              ...post,
              scheduledAt: updated.scheduledAt,
            }
            : post
        )
      );

      toast.success("Post rescheduled successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reschedule post");
    }
  };

  const handleEdit = (post: PostSchedule) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: any) => {
    if (!editingPost) return;

    try {
      // Combine date and time if they exist separately
      let scheduledAt = data.scheduledAt;
      if (data.scheduledTime && typeof data.scheduledAt === 'string' && data.scheduledAt.includes('T') === false) {
        const [year, month, day] = data.scheduledAt.split("-").map(Number);
        const [hours, minutes] = data.scheduledTime.split(":").map(Number);
        scheduledAt = new Date(year, month - 1, day, hours, minutes).toISOString();
      }

      const response = await fetch(`/api/postSchedules/${editingPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: data.platform,
          contentType: data.contentType,
          scheduledAt: scheduledAt,
          status: data.status,
          caption: data.caption || null,
          notes: data.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update post schedule");
      }

      const updated = await response.json();

      setPosts((prev) =>
        prev.map((post) => (post.id === editingPost.id ? { ...post, ...updated } : post))
      );

      toast.success("Post schedule updated successfully");
      setIsEditModalOpen(false);
      setEditingPost(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update post schedule");
      throw error;
    }
  };

  const handleTaskClick = async (task: CalendarTask) => {
    try {
      // Fetch the full task data
      const taskResponse = await fetch(`/api/opportunities/${task.opportunityId}/tasks/${task.id}`);

      if (!taskResponse.ok) {
        throw new Error("Failed to fetch task");
      }

      const taskData = await taskResponse.json();

      // Fetch the lead data to get contacts and users
      const leadResponse = await fetch(`/api/leads/${task.opportunityId}`);
      let contacts: Array<{ id: string; name: string; email: string | null; type?: "contact" | "user"; role?: string }> = [];

      if (leadResponse.ok) {
        try {
          const lead = await leadResponse.json();

          // Check if response is an error object or lead is null/undefined
          if (!lead || lead.error) {
            console.error("API returned error or null lead:", lead?.error || "Lead is null/undefined");
            // Continue to fetch users only below
          }
          // Check if lead exists and has contacts property
          else if (lead && typeof lead === 'object' && Array.isArray(lead.contacts)) {
            // Fetch users
            const usersResponse = await fetch('/api/users');
            let users: Array<{ id: string; name: string | null; email: string; role: string }> = [];

            if (usersResponse.ok) {
              const usersData = await usersResponse.json();
              users = Array.isArray(usersData) ? usersData : [];
            }

            // Combine contacts and users similar to lead page
            const leadContacts = Array.isArray(lead.contacts) ? lead.contacts : [];
            contacts = [
              ...leadContacts.map((c: any) => ({
                id: c.id,
                name: c.name,
                email: c.email || null,
                type: "contact" as const,
              })),
              ...users.map((u) => ({
                id: `user-${u.id}`,
                name: u.name || u.email,
                email: u.email || null,
                type: "user" as const,
                role: u.role,
              })),
            ];
          }
        } catch (error) {
          console.error("Error parsing lead response:", error);
        }
      }

      // If no contacts loaded from lead, at least fetch users
      if (contacts.length === 0) {
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const users = Array.isArray(usersData) ? usersData : [];
          contacts = users.map((u) => ({
            id: `user-${u.id}`,
            name: u.name || u.email,
            email: u.email || null,
            type: "user" as const,
            role: u.role,
          }));
        }
      }

      setTaskContacts(contacts);

      // Map task data to form format
      setEditingTask({
        id: taskData.task.id,
        crmRecordId: task.opportunityId,
        title: taskData.task.title,
        question: taskData.task.question,
        description: taskData.task.description || "",
        assignedToContactId: taskData.task.assignedToContactId || taskData.task.assignedToUserId ?
          (taskData.task.assignedToUserId ? `user-${taskData.task.assignedToUserId}` : taskData.task.assignedToContactId) : null,
        priority: taskData.task.priority || 0,
        startDate: taskData.task.startDate ? new Date(taskData.task.startDate).toISOString().split('T')[0] : null,
        dueDate: taskData.task.dueDate ? new Date(taskData.task.dueDate).toISOString().split('T')[0] : null,
        reminderDate: taskData.task.reminderDate ? new Date(taskData.task.reminderDate).toISOString().split('T')[0] : null,
      });

      setIsTaskModalOpen(true);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Failed to load task. Opening lead page instead.");
      router.push(`/leads/${task.opportunityId}`);
    }
  };

  const handleTaskSubmit = async (data: any) => {
    if (!editingTask || !editingTask.crmRecordId) {
      toast.error("Unable to update task: missing opportunity ID");
      return;
    }

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
      setIsTaskModalOpen(false);
      setEditingTask(null);
      router.refresh();
    } catch (error) {
      throw error;
    }
  };

  const handleTaskReschedule = async (taskId: string, newDate: Date) => {
    try {
      // Find the task to get opportunity ID
      const task = initialTasks.find((t) => t.id === taskId);
      if (!task) return;

      const response = await fetch(`/api/opportunities/${task.opportunityId}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dueDate: newDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reschedule task");
      }

      toast.success("Task rescheduled successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reschedule task");
    }
  };

  const handleViewLead = () => {
    if (editingTask && editingTask.crmRecordId) {
      setIsTaskModalOpen(false);
      router.push(`/leads/${editingTask.crmRecordId}`);
    }
  };

  return (
    <>
      <TimelineCalendar
        posts={posts}
        tasks={initialTasks}
        onReschedule={handleReschedule}
        onTaskReschedule={handleTaskReschedule}
        onEdit={handleEdit}
        onTaskClick={handleTaskClick}
      />
      <PostScheduleFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleEditSubmit}
        initialData={editingPost || undefined}
      />
      {editingTask && (
        <TaskFormModal
          open={isTaskModalOpen}
          onOpenChange={setIsTaskModalOpen}
          onSubmit={handleTaskSubmit}
          contacts={taskContacts}
          initialData={editingTask}
          opportunityId={editingTask.crmRecordId}
        />
      )}
    </>
  );
}

