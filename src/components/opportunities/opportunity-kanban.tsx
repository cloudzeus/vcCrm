"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckSquare, Plus, Mail, Edit, Trash2, Clock, User, Paperclip, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OpportunityTask {
  id: string;
  title: string;
  question: string;
  description: string | null;
  answer: string | null;
  status: TaskStatus;
  priority: number;
  startDate?: Date | string | null;
  dueDate: Date | string | null;
  reminderDate?: Date | string | null;
  assignedTo: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  emailSentAt: Date | string | null;
  answeredAt: Date | string | null;
  crmRecordId?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface OpportunityKanbanProps {
  tasks: OpportunityTask[];
  opportunityId?: string;
  contacts?: Array<{ id: string; name: string; email: string | null }>;
  onTaskUpdate?: () => void;
  onAddTask?: () => void;
  onEditTask?: (task: OpportunityTask) => void;
  onDeleteTask?: (task: OpportunityTask) => void;
}

const statusColumns: Array<{ id: TaskStatus; label: string; color: string; bgColor: string; borderColor: string }> = [
  { id: "TODO", label: "To Do", color: "bg-[#E9D8C8]/40 border-[#E9D8C8]", bgColor: "bg-[#E9D8C8]/20", borderColor: "border-[#E9D8C8]" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-[#85A3B2]/40 border-[#85A3B2]", bgColor: "bg-[#85A3B2]/20", borderColor: "border-[#85A3B2]" },
  { id: "REVIEW", label: "Review", color: "bg-[#732553]/40 border-[#732553]", bgColor: "bg-[#732553]/20", borderColor: "border-[#732553]" },
  { id: "DONE", label: "Done", color: "bg-[#85A3B2]/40 border-[#85A3B2]", bgColor: "bg-[#85A3B2]/20", borderColor: "border-[#85A3B2]" },
];

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

function TaskCard({
  task,
  isDragging = false,
  onEdit,
  onDelete,
  onSendEmail,
}: {
  task: OpportunityTask;
  isDragging?: boolean;
  onEdit?: (task: OpportunityTask) => void;
  onDelete?: (task: OpportunityTask) => void;
  onSendEmail?: (task: OpportunityTask) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const priorityColors = {
    0: "text-muted-foreground",
    1: "text-[#85A3B2]",
    2: "text-[#732553]",
  };

  const taskStatusColors: Record<string, { bg: string; border: string; text: string }> = {
    TODO: { bg: "bg-[#E9D8C8]/40", text: "text-[#142030]", border: "border-[#E9D8C8]" },
    IN_PROGRESS: { bg: "bg-[#85A3B2]/40", text: "text-[#142030]", border: "border-[#85A3B2]" },
    REVIEW: { bg: "bg-[#732553]/40", text: "text-[#142030]", border: "border-[#732553]" },
    DONE: { bg: "bg-[#85A3B2]/40", text: "text-[#142030]", border: "border-[#85A3B2]" },
  };

  const statusColor = taskStatusColors[task.status] || taskStatusColors.TODO;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      variants={CARD_VARIANTS}
      initial="hidden"
      animate="visible"
      className={`mb-0.5 cursor-move ${isDragging ? "opacity-50" : ""}`}
      suppressHydrationWarning
    >
      <Card className={`${statusColor.bg} ${statusColor.border} border shadow-sm hover:shadow-md transition-all duration-200`}>
        <CardContent className="p-0.5">
          <div className="space-y-0">
            <div className="flex items-start justify-between gap-0.5 relative">
              <h4 className="text-xs font-light flex-1 line-clamp-1 leading-tight pr-14">{task.title}</h4>
              <div className="absolute top-0 right-0 flex items-center gap-0.5 shrink-0 z-10">
                {onEdit && (
                  <Badge
                    variant="outline"
                    className="h-3.5 px-1 py-0 cursor-pointer hover:bg-[#85A3B2]/20 border-[#85A3B2]/30 text-[8px] font-light"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onEdit(task);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Edit"
                    asChild={false}
                  >
                    <Edit className="h-2 w-2" />
                  </Badge>
                )}
                {onDelete && (
                  <Badge
                    variant="outline"
                    className="h-3.5 px-1 py-0 cursor-pointer hover:bg-[#FF5C8D]/20 border-[#FF5C8D]/30 text-[8px] font-light"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDelete(task);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Delete"
                    asChild={false}
                  >
                    <Trash2 className="h-2 w-2" />
                  </Badge>
                )}
              </div>
            </div>
            {task.assignedTo && (
              <div className="flex items-center gap-0.5 mt-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-2.5 w-2.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendEmail?.(task);
                  }}
                  title="Send email"
                >
                  <Mail className="h-1.5 w-1.5" />
                </Button>
              </div>
            )}
            {task.question && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-[8px] text-muted-foreground line-clamp-1 leading-tight mt-0.5 cursor-help">{task.question}</p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs whitespace-pre-wrap">{task.question}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center gap-0.5 mt-0.5">
                <Paperclip className="h-1.5 w-1.5 text-muted-foreground" />
                <span className="text-[7px] text-muted-foreground">
                  {task.attachments.length}
                </span>
              </div>
            )}
            {task.answer && (
              <div className="p-0.5 bg-muted/30 rounded text-[7px] mt-0.5">
                <p className="font-light text-[7px]">A:</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-muted-foreground text-[7px] leading-tight line-clamp-1 cursor-help">{task.answer}</p>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs whitespace-pre-wrap">{task.answer}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            <div className="flex items-center justify-between pt-0.5 border-t border-border/50 mt-0.5">
              <div className="flex items-center gap-0.5">
                {task.assignedTo && (
                  <div className="flex items-center gap-0.5">
                    <User className="h-1.5 w-1.5 text-muted-foreground" />
                    <span className="text-[8px] text-muted-foreground truncate max-w-[50px]">{task.assignedTo.name}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center gap-0.5">
                    <Clock className="h-1.5 w-1.5 text-muted-foreground" />
                    <span className="text-[8px] text-muted-foreground">
                      {format(new Date(task.dueDate), "MMM d")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-0.5">
              <Badge
                variant="outline"
                className={`text-[7px] font-light px-0.5 py-0 h-3 ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                icon={
                  task.priority === 2 ? (
                    <AlertCircle className="h-2 w-2" />
                  ) : task.priority === 1 ? (
                    <AlertTriangle className="h-2 w-2" />
                  ) : (
                    <Info className="h-2 w-2" />
                  )
                }
              >
                {task.priority === 2 ? "High" : task.priority === 1 ? "Medium" : "Low"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KanbanColumn({
  column,
  tasks,
  overId,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onSendEmail,
}: {
  column: typeof statusColumns[0];
  tasks: OpportunityTask[];
  overId: string | null;
  onAddTask?: () => void;
  onEditTask?: (task: OpportunityTask) => void;
  onDeleteTask?: (task: OpportunityTask) => void;
  onSendEmail?: (task: OpportunityTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <motion.div
      key={column.id}
      ref={setNodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className={`${column.bgColor} ${column.borderColor} border shadow-sm h-full flex flex-col transition-all duration-200 ${
            isOver || overId === column.id ? "border-[#85A3B2] border-2" : ""
          }`}>
        <CardHeader className="p-1.5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[10px] font-light uppercase tracking-wide flex items-center gap-1">
              <CheckSquare className="h-2.5 w-2.5" />
              {column.label}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[9px] font-light h-4 px-1">
                {tasks.length}
              </Badge>
              {column.id === "TODO" && onAddTask && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTask();
                  }}
                  title="Add Task"
                >
                  <Plus className="h-2 w-2" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent 
          className={`p-1 flex-1 overflow-y-auto min-h-[400px] transition-all duration-200 ${
            isOver || overId === column.id 
              ? "ring-4 ring-[#85A3B2] ring-offset-2 bg-[#85A3B2]/20 border-2 border-[#85A3B2] scale-[1.02] shadow-lg" 
              : ""
          }`}
        >
          <div className="h-full">
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
            <AnimatePresence>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSendEmail={onSendEmail}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </AnimatePresence>
            {tasks.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-[9px] font-light">
                No tasks
              </div>
            )}
            </SortableContext>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function OpportunityKanban({
  tasks,
  opportunityId,
  contacts = [],
  onTaskUpdate,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: OpportunityKanbanProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<OpportunityTask | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<OpportunityTask[]>(tasks);

  // Update local tasks when tasks prop changes (e.g., after router.refresh())
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const tasksByStatus = {
    TODO: localTasks.filter((t) => t.status === "TODO").sort((a, b) => {
      const aOrder = (a as any).order || 0;
      const bOrder = (b as any).order || 0;
      return aOrder - bOrder;
    }),
    IN_PROGRESS: localTasks.filter((t) => t.status === "IN_PROGRESS").sort((a, b) => {
      const aOrder = (a as any).order || 0;
      const bOrder = (b as any).order || 0;
      return aOrder - bOrder;
    }),
    REVIEW: localTasks.filter((t) => t.status === "REVIEW").sort((a, b) => {
      const aOrder = (a as any).order || 0;
      const bOrder = (b as any).order || 0;
      return aOrder - bOrder;
    }),
    DONE: localTasks.filter((t) => t.status === "DONE").sort((a, b) => {
      const aOrder = (a as any).order || 0;
      const bOrder = (b as any).order || 0;
      return aOrder - bOrder;
    }),
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const task = localTasks.find((t) => t.id === event.active.id);
    setDraggedTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (event.over) {
      setOverId(event.over.id as string);
    } else {
      setOverId(null);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDraggedTask(null);
    setOverId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedTask(null);
    setOverId(null);

    if (!over || !active) return;

    const taskId = String(active.id);
    if (!taskId || taskId === "undefined") {
      console.error("Invalid task ID:", active.id);
      toast.error("Invalid task ID");
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      console.error("Task not found:", taskId);
      toast.error("Task not found");
      return;
    }

    // Get the CRM record ID - use opportunityId prop if provided, otherwise get from task
    const crmRecordId = opportunityId || task.crmRecordId;
    if (!crmRecordId || crmRecordId === "undefined") {
      console.error("Invalid CRM record ID:", { opportunityId, crmRecordId: task.crmRecordId });
      toast.error("Unable to determine opportunity ID");
      return;
    }

    let newStatus: TaskStatus | null = null;

    // Check if over.id is a valid TaskStatus (column) - this is the primary case
    const validStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
    if (validStatuses.includes(over.id as TaskStatus)) {
      // Dropped directly on a column
      newStatus = over.id as TaskStatus;
    } else {
      // If over.id is a task ID, we need to find which column contains it
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        // Dropped on another task - use that task's status
        newStatus = overTask.status;
      } else {
        // Unknown drop target - try to find the column from the droppable context
        // Check all columns to see which one contains this drop
        for (const status of validStatuses) {
          const tasksInColumn = tasksByStatus[status];
          if (tasksInColumn.some(t => t.id === over.id)) {
            newStatus = status;
            break;
          }
        }
        if (!newStatus) return;
      }
    }

    if (!newStatus || task.status === newStatus) return;

    // Final validation before API call
    if (!taskId || !crmRecordId || taskId === "undefined" || crmRecordId === "undefined") {
      console.error("Invalid IDs for API call:", { taskId, crmRecordId });
      toast.error("Invalid task or opportunity ID");
      return;
    }

    try {
      // Get all tasks in the new status to calculate order
      const tasksInNewStatus = tasksByStatus[newStatus] || [];
      const newOrder = tasksInNewStatus.length;

      const response = await fetch(`/api/opportunities/${crmRecordId}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          order: newOrder,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update task");
      }

      toast.success("Task updated successfully");
      router.refresh();
      onTaskUpdate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update task");
    }
  };

  const handleSendEmail = async (task: OpportunityTask) => {
    if (!task.assignedTo?.email) {
      toast.error("Task has no assigned contact with email");
      return;
    }

    // Get the CRM record ID - use opportunityId prop if provided, otherwise get from task
    const crmRecordId = opportunityId || task.crmRecordId;
    if (!crmRecordId) {
      toast.error("Unable to determine opportunity ID");
      return;
    }

    try {
      const response = await fetch(`/api/opportunities/${crmRecordId}/tasks/${task.id}/send-email`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      toast.success("Email sent successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-xs font-light text-muted-foreground mb-3">No tasks yet</p>
        {onAddTask && (
          <Button variant="outline" size="sm" className="text-xs font-light h-7" onClick={onAddTask}>
            <Plus className="h-3 w-3 mr-1.5" />
            Add Your First Task
          </Button>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => {
          const columnTasks = tasksByStatus[column.id];
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              overId={overId}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onSendEmail={handleSendEmail}
            />
          );
        })}
      </div>

      <DragOverlay>
        {draggedTask && (
          <div className="opacity-90 rotate-2 scale-105">
            <TaskCard task={draggedTask} isDragging={true} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

