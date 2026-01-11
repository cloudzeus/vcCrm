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
  onTaskUpdate?: (taskId: string, updates: any) => void;
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
    0: "bg-gray-100 text-gray-600 border-gray-200",
    1: "bg-[#85A3B2]/10 text-[#85A3B2] border-[#85A3B2]/20",
    2: "bg-[#732553]/10 text-[#732553] border-[#732553]/20",
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
      className={`mb-2 cursor-move ${isDragging ? "opacity-50" : ""}`}
      suppressHydrationWarning
    >
      <Card className={`${statusColor.bg} ${statusColor.border} border shadow-sm hover:shadow-md transition-all duration-200`}>
        <CardContent className="p-2">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2 relative">
              <h4 className="text-xs font-medium flex-1 line-clamp-2 leading-tight pr-12">{task.title}</h4>
              <div className="absolute top-0 right-0 flex items-center gap-1 shrink-0 z-10">
                {onEdit && (
                  <button
                    className="h-4 w-4 flex items-center justify-center rounded-sm hover:bg-black/5 text-muted-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onEdit(task);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Edit"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                )}
                {onDelete && (
                  <button
                    className="h-4 w-4 flex items-center justify-center rounded-sm hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDelete(task);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            {task.assignedTo && (
              <div className="flex items-center gap-1 mt-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendEmail?.(task);
                  }}
                  title="Send email"
                >
                  <Mail className="h-3 w-3" />
                </Button>
              </div>
            )}
            {task.question && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-1 cursor-help">{task.question}</p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs whitespace-pre-wrap">{task.question}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {task.attachments.length}
                </span>
              </div>
            )}
            {task.answer && (
              <div className="p-1 bg-white/50 rounded text-[10px] mt-1 border border-black/5">
                <div className="flex gap-1">
                  <span className="font-semibold text-[10px] opacity-70">A:</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-muted-foreground text-[10px] leading-tight line-clamp-2 cursor-help">{task.answer}</p>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs whitespace-pre-wrap">{task.answer}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 mt-2">
              <div className="flex items-center gap-2">
                {task.assignedTo && (
                  <div className="flex items-center gap-1" title={task.assignedTo.name}>
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{task.assignedTo.name.split(' ')[0]}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center gap-1" title={`Due: ${format(new Date(task.dueDate), "PPP")}`}>
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(task.dueDate), "MMM d")}
                    </span>
                  </div>
                )}
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 h-4 font-normal gap-1 flex items-center ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors[0]}`}
              >
                {task.priority === 2 ? (
                  <AlertCircle className="h-2.5 w-2.5" />
                ) : task.priority === 1 ? (
                  <AlertTriangle className="h-2.5 w-2.5" />
                ) : (
                  <Info className="h-2.5 w-2.5" />
                )}
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
      <Card className={`${column.bgColor} ${column.borderColor} border shadow-sm h-full flex flex-col transition-all duration-200 ${isOver || overId === column.id ? "border-[#85A3B2] border-2 ring-2 ring-[#85A3B2]/20" : ""
        }`}>
        <CardHeader className="p-2 border-b border-black/5 bg-white/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wide flex items-center gap-2 text-foreground/80">
              <CheckSquare className="h-3 w-3 opacity-70" />
              {column.label}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-[9px] font-medium h-4 px-1 min-w-[1.25rem] justify-center bg-black/5 text-black/70 hover:bg-black/10">
                {tasks.length}
              </Badge>
              {column.id === "TODO" && onAddTask && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-black/5 rounded-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTask();
                  }}
                  title="Add Task"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent
          className={`p-2 flex-1 overflow-y-auto min-h-[400px] transition-all duration-200`}
        >
          <div className="h-full flex flex-col">
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
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-black/30">
                  <div className="rounded-full bg-black/5 p-3 mb-2">
                    <CheckSquare className="h-5 w-5 opacity-50" />
                  </div>
                  <p className="text-[10px] font-medium">No tasks</p>
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
      // Also fallback to createdAt if order is same
      if (aOrder === bOrder) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return aOrder - bOrder;
    }),
    IN_PROGRESS: localTasks.filter((t) => t.status === "IN_PROGRESS").sort((a, b) => {
      const aOrder = (a as any).order || 0;
      const bOrder = (b as any).order || 0;
      if (aOrder === bOrder) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return aOrder - bOrder;
    }),
    REVIEW: localTasks.filter((t) => t.status === "REVIEW").sort((a, b) => {
      const aOrder = (a as any).order || 0;
      const bOrder = (b as any).order || 0;
      if (aOrder === bOrder) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return aOrder - bOrder;
    }),
    DONE: localTasks.filter((t) => t.status === "DONE").sort((a, b) => {
      const aOrder = (a as any).order || 0;
      const bOrder = (b as any).order || 0;
      if (aOrder === bOrder) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return aOrder - bOrder;
    }),
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const task = localTasks.find((t) => t.id === event.active.id);
    setDraggedTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverId(null);
      return;
    }

    setOverId(over.id as string);

    // If we're dragging over a DIFFERENT column, we might want to optimistically move the item in the UI list
    // This is optional but makes it smoother. For now we stick to simple visual feedback.
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
    const task = localTasks.find((t) => t.id === taskId);
    if (!task) return;

    // Get the CRM record ID
    const crmRecordId = opportunityId || task.crmRecordId;
    if (!crmRecordId) {
      toast.error("Unable to determine opportunity ID");
      return;
    }

    let newStatus: TaskStatus | null = null;
    let newOrder = 0;

    const validStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

    // Determining New Status and potentially New Order
    if (validStatuses.includes(over.id as TaskStatus)) {
      // Dropped directly on a column
      newStatus = over.id as TaskStatus;
      // Append to end of list
      newOrder = tasksByStatus[newStatus].length;
    } else {
      // Dropped on another task
      const overTask = localTasks.find((t) => t.id === over.id);
      if (overTask) {
        newStatus = overTask.status;
        // Logic to insert before/after could be complex, for now we just take the status
        // If strict ordering is needed, we'd calculate index. 
        // For simplicity let's assume we just want to change status. 
        // If status is same, we might just be reordering (which we can support later).
      } else {
        // Try to infer status from proximity if DND kit didn't give us a direct hit
        for (const status of validStatuses) {
          // This is a fallback
          const tasksInColumn = tasksByStatus[status];
          // If the over id is the sortable context id of a column? No.
          // Usually DND kit handles this with containers.
        }
      }
    }

    if (!newStatus) return;

    // Optimistically Update Local State
    const previousTasks = [...localTasks];

    // Update the task in local state immediately
    const updatedTask = { ...task, status: newStatus, order: newOrder };
    const newLocalTasks = localTasks.map(t =>
      t.id === taskId ? updatedTask : t
    );
    setLocalTasks(newLocalTasks); // Force re-render with new status immediately

    // Now perform API update
    try {
      // If we provided a callback, use it for parent updates (optional)
      onTaskUpdate?.(taskId, { status: newStatus, order: newOrder });

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
        throw new Error("Failed to update task");
      }

      // Success - no need to do anything as local state is already updated.
      // Ideally router.refresh() will come and sync eventually, but we don't want it to flicker back.
      router.refresh();

    } catch (error) {
      // Revert optimization on error
      setLocalTasks(previousTasks);
      toast.error("Failed to update task status");
    }
  };

  const handleSendEmail = async (task: OpportunityTask) => {
    if (!task.assignedTo?.email) {
      toast.error("Task has no assigned contact with email");
      return;
    }

    const crmRecordId = opportunityId || task.crmRecordId;
    if (!crmRecordId) return;

    try {
      const response = await fetch(`/api/opportunities/${crmRecordId}/tasks/${task.id}/send-email`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to send email");

      toast.success("Email sent successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to send email");
    }
  };

  if (!localTasks || localTasks.length === 0) {
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

