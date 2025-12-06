"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  startOfDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  getDay,
} from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, badgeDotColors } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  Grid3x3,
  Pencil,
  MoreVertical,
  CheckSquare,
  Briefcase,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostStatus, PlatformType, ContentType } from "@prisma/client";

interface PostSchedule {
  id: string;
  campaignId: string;
  influencerId: string;
  platform: PlatformType | string;
  contentType: ContentType | string;
  scheduledAt: Date | string;
  status: PostStatus | string;
  caption?: string | null;
  notes?: string | null;
  campaign?: {
    name: string;
  };
  influencer?: {
    stageName?: string | null;
    userId?: string;
    user?: {
      name?: string | null;
      image?: string | null;
    };
  };
  influencers?: Array<{
    stageName?: string | null;
    userId?: string;
    user?: {
      name?: string | null;
      image?: string | null;
    };
  }>;
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

interface TimelineCalendarProps {
  posts: PostSchedule[];
  tasks?: CalendarTask[];
  onReschedule?: (postId: string, newDate: Date) => Promise<void>;
  onEdit?: (post: PostSchedule) => void;
  onTaskClick?: (task: CalendarTask) => void;
  onTaskReschedule?: (taskId: string, newDate: Date) => Promise<void>;
}

// New color palette
const platformColors: Record<string, { border: string; bg: string; text: string }> = {
  INSTAGRAM: {
    border: "border-l-[#85A3B2]", // Grauzone - blue-grey
    bg: "bg-[#85A3B2]/30",
    text: "text-[#142030]",
  },
  TIKTOK: {
    border: "border-l-[#732553]", // Pico Eggplant - purple
    bg: "bg-[#732553]/30",
    text: "text-[#142030]",
  },
  YOUTUBE: {
    border: "border-l-[#85A3B2]", // Grauzone - blue-grey
    bg: "bg-[#85A3B2]/30",
    text: "text-[#142030]",
  },
  OTHER: {
    border: "border-l-[#E9D8C8]", // Siesta Tan - beige
    bg: "bg-[#E9D8C8]/30",
    text: "text-[#142030]",
  },
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  PLANNED: { bg: "bg-[#85A3B2]/40", text: "text-[#142030]", border: "border-[#85A3B2]" }, // Grauzone
  DRAFT: { bg: "bg-[#E9D8C8]/40", text: "text-[#142030]", border: "border-[#E9D8C8]" }, // Siesta Tan
  APPROVED: { bg: "bg-[#85A3B2]/40", text: "text-[#142030]", border: "border-[#85A3B2]" }, // Grauzone
  POSTED: { bg: "bg-[#732553]/40", text: "text-[#142030]", border: "border-[#732553]" }, // Pico Eggplant
};

function TimelinePostCard({
  post,
  isDragging = false,
  onEdit,
}: {
  post: PostSchedule;
  isDragging?: boolean;
  onEdit?: (post: PostSchedule) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const platformColor = platformColors[post.platform as string] || platformColors.OTHER;
  const statusColor = statusColors[post.status as string] || statusColors.PLANNED;
  const time = typeof post.scheduledAt === "string" ? parseISO(post.scheduledAt) : post.scheduledAt;
  
  // Get influencers for this event - support multiple influencers
  const influencers = post.influencers || (post.influencer ? [post.influencer] : []);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="mb-1.5 cursor-move"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className={`${platformColor.border} border-l-4 ${platformColor.bg} shadow-sm hover:shadow-md transition-all duration-200 group border-0 rounded-md`}
      >
        <CardContent className="p-2">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-light text-xs text-foreground truncate">
                  {post.campaign?.name || "Untitled Campaign"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{format(time, "HH:mm")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge
                  variant="default"
                  dotColor={badgeDotColors[post.platform as string] || badgeDotColors.OTHER}
                >
                  {post.platform}
                </Badge>
                <Badge
                  variant="default"
                  className="shrink-0"
                >
                  {post.status}
                </Badge>
              </div>
            </div>
            {influencers.length > 0 && (
              <div className="flex items-center -space-x-1.5">
                {influencers.slice(0, 3).map((influencer, index) => (
                  <TooltipProvider key={influencer.userId || index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-5 w-5 border-2 border-white">
                          <AvatarImage src={influencer.user?.image || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {influencer.user?.name?.charAt(0).toUpperCase() || 
                             influencer.stageName?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{influencer.stageName || influencer.user?.name || "Influencer"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {influencers.length > 3 && (
                  <div className="h-5 w-5 rounded-full bg-muted border-2 border-white flex items-center justify-center">
                    <span className="text-[8px] text-muted-foreground font-light">
                      +{influencers.length - 3}
                    </span>
                  </div>
                )}
              </div>
            )}
            {onEdit && (
              <div className="flex justify-end pt-0.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(post);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DayColumn({
  day,
  posts,
  tasks = [],
  isToday,
  isCurrentMonth,
  onEdit,
  onTaskClick,
}: {
  day: Date;
  posts: PostSchedule[];
  tasks?: CalendarTask[];
  isToday: boolean;
  isCurrentMonth: boolean;
  onEdit?: (post: PostSchedule) => void;
  onTaskClick?: (task: CalendarTask) => void;
}) {
  const dayKey = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({
    id: dayKey,
  });

  const dayPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const postDate = typeof post.scheduledAt === "string" ? parseISO(post.scheduledAt) : post.scheduledAt;
        return isSameDay(postDate, day);
      })
      .sort((a, b) => {
        const timeA = typeof a.scheduledAt === "string" ? parseISO(a.scheduledAt) : a.scheduledAt;
        const timeB = typeof b.scheduledAt === "string" ? parseISO(b.scheduledAt) : b.scheduledAt;
        return timeA.getTime() - timeB.getTime();
      });
  }, [posts, day]);

  return (
    <div
      ref={setNodeRef}
      data-day={dayKey}
      className={`flex-1 min-w-[180px] border-r border-border bg-background relative transition-all duration-200 ${
        isToday ? "bg-purple-50" : ""
      } ${isOver ? "bg-purple-100 ring-2 ring-purple-200" : ""} ${
        !isCurrentMonth ? "opacity-40" : ""
      }`}
    >
      {isToday && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400 rounded-r" />
      )}

      <div
        className={`sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-3 py-2 ${
          isToday ? "bg-purple-50" : ""
        }`}
      >
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
          {format(day, "EEE")}
        </p>
        <div className="flex items-center gap-2">
          <p
            className={`text-lg font-light ${
              isToday ? "text-purple-600" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {format(day, "d")}
          </p>
          {dayPosts.length > 0 && (
            <Badge variant="default">
              {dayPosts.length}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-2 min-h-[500px]">
        <SortableContext
          items={[...dayPosts.map((p) => p.id), ...tasks.map((t) => t.id)]}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence>
            {dayPosts.map((post) => (
              <TimelinePostCard
                key={post.id}
                post={post}
                isDragging={false}
                onEdit={onEdit}
              />
            ))}
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
            ))}
          </AnimatePresence>
        </SortableContext>

        {dayPosts.length === 0 && tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground/40">
            <p className="text-xs">No items</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthView({
  currentMonth,
  posts,
  tasks = [],
  onReschedule,
  onTaskReschedule,
  onEdit,
  onTaskClick,
}: {
  currentMonth: Date;
  posts: PostSchedule[];
  tasks?: CalendarTask[];
  onReschedule?: (postId: string, newDate: Date) => Promise<void>;
  onTaskReschedule?: (taskId: string, newDate: Date) => Promise<void>;
  onEdit?: (post: PostSchedule) => void;
  onTaskClick?: (task: CalendarTask) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = startOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center border-r border-border last:border-r-0">
            <p className="text-xs font-light text-muted-foreground uppercase tracking-wide">{day}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayPosts = posts.filter((post) => {
            const postDate = typeof post.scheduledAt === "string" ? parseISO(post.scheduledAt) : post.scheduledAt;
            return isSameDay(postDate, day);
          });
          const dayTasks = tasks.filter((task) => {
            const taskDate = parseISO(task.dueDate);
            return isSameDay(taskDate, day);
          });
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <MonthCell
              key={dayKey}
              day={day}
              posts={dayPosts}
              tasks={dayTasks}
              isToday={isTodayDate}
              isCurrentMonth={isCurrentMonth}
              onEdit={onEdit}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  isDragging = false,
  onTaskClick,
}: {
  task: CalendarTask;
  isDragging?: boolean;
  onTaskClick?: (task: CalendarTask) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: isDragging ? 0.8 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`${statusColor.bg} ${statusColor.border} border-l-4 rounded-md p-2 mb-1.5 cursor-move hover:opacity-80 transition-all group/task ${
        isDragging ? "opacity-50" : ""
      }`}
      onClick={() => onTaskClick?.(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckSquare className="h-3 w-3 text-[#732553]" />
            <p className="text-xs font-medium truncate">{task.title}</p>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1">
            {task.question}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Briefcase className="h-2.5 w-2.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground truncate">{task.companyName}</p>
          </div>
        </div>
        <Badge variant="outline" className={`${statusColor.border} text-[9px] shrink-0`}>
          {task.status}
        </Badge>
      </div>
    </motion.div>
  );
}

// Make month view cells droppable
function MonthCell({
  day,
  posts,
  tasks = [],
  isToday,
  isCurrentMonth,
  onEdit,
  onTaskClick,
}: {
  day: Date;
  posts: PostSchedule[];
  tasks?: CalendarTask[];
  isToday: boolean;
  isCurrentMonth: boolean;
  onEdit?: (post: PostSchedule) => void;
  onTaskClick?: (task: CalendarTask) => void;
}) {
  const dayKey = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({
    id: dayKey,
  });

  const dayPosts = posts.filter((post) => {
    const postDate = typeof post.scheduledAt === "string" ? parseISO(post.scheduledAt) : post.scheduledAt;
    return isSameDay(postDate, day);
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] border-r border-b border-border p-2 transition-colors flex flex-col ${
        isToday ? "bg-primary/5" : ""
      } ${!isCurrentMonth ? "bg-muted/20 opacity-50" : "bg-background"} ${
        isOver ? "bg-primary/10 ring-2 ring-primary/20" : ""
      } hover:bg-muted/30`}
    >
      <div className="flex items-center justify-between mb-1 shrink-0">
                <p
                  className={`text-sm font-light ${
                    isToday
                      ? "text-purple-600"
                      : isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </p>
                {(dayPosts.length > 0 || tasks.length > 0) && (
                  <Badge variant="default">
                    {dayPosts.length + tasks.length}
                  </Badge>
                )}
      </div>
              <SortableContext items={[...dayPosts.map(p => p.id), ...tasks.map(t => t.id)]} strategy={verticalListSortingStrategy}>
                <div className="space-y-1 flex-1 overflow-y-auto">
                  {dayPosts.slice(0, 2).map((post) => {
                  const platformColor = platformColors[post.platform as string] || platformColors.OTHER;
                  const { attributes, listeners, setNodeRef: setPostRef, transform, transition } = useSortable({
                    id: post.id,
                  });
                  const style = {
                    transform: CSS.Transform.toString(transform),
                    transition,
                  };
                  return (
                    <div
                      key={post.id}
                      ref={setPostRef}
                      style={style}
                      {...attributes}
                      {...listeners}
                      data-post-id={post.id}
                      className={`${platformColor.bg} ${platformColor.border} border-l-2 rounded px-1.5 py-0.5 text-[10px] truncate cursor-move hover:opacity-80 transition-opacity group/item relative flex items-center gap-1.5`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEdit) onEdit(post);
                      }}
                    >
                      {post.influencer && (
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarImage
                            src={post.influencer.user?.image || undefined}
                            alt={post.influencer.stageName || "Influencer"}
                          />
                          <AvatarFallback className="text-[8px] font-semibold">
                            {(post.influencer.stageName || post.influencer.user?.name || "I")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <p className="font-medium truncate flex-1">{post.campaign?.name || "Campaign"}</p>
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 opacity-0 group-hover/item:opacity-100 transition-opacity p-0 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(post);
                          }}
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
                  ))}
                  {dayPosts.length > 2 && (
                    <p className="text-[10px] text-muted-foreground">
                      +{dayPosts.length - 2} more posts
                    </p>
                  )}
                </div>
              </SortableContext>
    </div>
  );
}

// Day View Component with Time Slots
function DayView({
  day,
  posts,
  tasks = [],
  onReschedule,
  onTaskReschedule,
  onEdit,
  onTaskClick,
}: {
  day: Date;
  posts: PostSchedule[];
  tasks?: CalendarTask[];
  onReschedule?: (postId: string, newDate: Date) => Promise<void>;
  onTaskReschedule?: (taskId: string, newDate: Date) => Promise<void>;
  onEdit?: (post: PostSchedule) => void;
  onTaskClick?: (task: CalendarTask) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const itemsByHour = useMemo(() => {
    const items: Record<number, { posts: PostSchedule[]; tasks: CalendarTask[] }> = {};
    hours.forEach((hour) => {
      items[hour] = { posts: [], tasks: [] };
    });

    posts.forEach((post) => {
      const postDate = typeof post.scheduledAt === "string" ? parseISO(post.scheduledAt) : post.scheduledAt;
      if (isSameDay(postDate, day)) {
        const hour = postDate.getHours();
        items[hour].posts.push(post);
      }
    });

    tasks.forEach((task) => {
      const taskDate = parseISO(task.dueDate);
      if (isSameDay(taskDate, day)) {
        const hour = taskDate.getHours();
        items[hour].tasks.push(task);
      }
    });

    return items;
  }, [posts, tasks, day]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={async (event) => {
        const { active, over } = event;
        if (!over || (!onReschedule && !onTaskReschedule)) return;

        const itemId = active.id as string;
        const targetHour = parseInt(over.id as string);

        const post = posts.find((p) => p.id === itemId);
        const task = tasks.find((t) => t.id === itemId);

        if (post && onReschedule) {
          const originalDate = typeof post.scheduledAt === "string" ? parseISO(post.scheduledAt) : post.scheduledAt;
          const newDate = new Date(day);
          newDate.setHours(targetHour, originalDate.getMinutes(), 0, 0);
          await onReschedule(itemId, newDate);
        } else if (task && onTaskReschedule) {
          const originalDate = parseISO(task.dueDate);
          const newDate = new Date(day);
          newDate.setHours(targetHour, originalDate.getMinutes(), 0, 0);
          await onTaskReschedule(itemId, newDate);
        }
      }}
    >
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-light">{format(day, "EEEE, MMMM d, yyyy")}</h3>
            <Badge variant="default">{posts.length + tasks.length} items</Badge>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          {hours.map((hour) => {
            const hourItems = itemsByHour[hour];
            const hasItems = hourItems.posts.length > 0 || hourItems.tasks.length > 0;
            return (
              <HourSlot
                key={hour}
                hour={hour}
                posts={hourItems.posts}
                tasks={hourItems.tasks}
                hasItems={hasItems}
                onEdit={onEdit}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

// Hour Slot Component for Day View
function HourSlot({
  hour,
  posts,
  tasks,
  hasItems,
  onEdit,
  onTaskClick,
}: {
  hour: number;
  posts: PostSchedule[];
  tasks: CalendarTask[];
  hasItems: boolean;
  onEdit?: (post: PostSchedule) => void;
  onTaskClick?: (task: CalendarTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: hour.toString(),
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-b border-border/50 p-3 min-h-[80px] transition-colors ${
        isOver ? "bg-primary/10" : ""
      } ${hasItems ? "bg-background" : "bg-muted/20"}`}
    >
      <div className="flex gap-4">
        <div className="w-16 shrink-0">
          <p className="text-xs font-light text-muted-foreground">
            {String(hour).padStart(2, "0")}:00
          </p>
        </div>
        <div className="flex-1 space-y-2">
          <SortableContext
            items={[...posts.map((p) => p.id), ...tasks.map((t) => t.id)]}
            strategy={verticalListSortingStrategy}
          >
            {posts.map((post) => (
              <TimelinePostCard key={post.id} post={post} onEdit={onEdit} />
            ))}
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
            ))}
          </SortableContext>
          {!hasItems && (
            <p className="text-xs text-muted-foreground/50 italic">No items scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TimelineCalendar({ 
  posts, 
  tasks = [], 
  onReschedule, 
  onEdit, 
  onTaskClick,
  onTaskReschedule 
}: TimelineCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [currentDay, setCurrentDay] = useState(new Date());
  const [view, setView] = useState<"week" | "month" | "day">("week");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedPost, setDraggedPost] = useState<PostSchedule | null>(null);
  const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  }, [currentWeek]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const post = posts.find((p) => p.id === event.active.id);
    const task = tasks.find((t) => t.id === event.active.id);
    setDraggedPost(post || null);
    setDraggedTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedPost(null);
    setDraggedTask(null);

    if (!over) return;

    const itemId = active.id as string;
    const targetDayKey = over.id as string;

    try {
      const targetDate = parseISO(targetDayKey);
      
      // Check if it's a post or task
      const post = posts.find((p) => p.id === itemId);
      const task = tasks.find((t) => t.id === itemId);

      if (post && onReschedule) {
        const originalDate = typeof post.scheduledAt === "string" ? parseISO(post.scheduledAt) : post.scheduledAt;
        const newDate = new Date(targetDate);
        newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);
        await onReschedule(itemId, newDate);
      } else if (task && onTaskReschedule) {
        const originalDate = parseISO(task.dueDate);
        const newDate = new Date(targetDate);
        newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);
        await onTaskReschedule(itemId, newDate);
      }
    } catch (error) {
      console.error("Failed to reschedule:", error);
    }
  };

  const goToPrevious = () => {
    if (view === "week") {
      setCurrentWeek(addDays(currentWeek, -7));
    } else if (view === "month") {
      setCurrentMonth(addDays(currentMonth, -1));
      setCurrentMonth(startOfMonth(currentMonth));
    } else {
      setCurrentDay(addDays(currentDay, -1));
    }
  };

  const goToNext = () => {
    if (view === "week") {
      setCurrentWeek(addDays(currentWeek, 7));
    } else if (view === "month") {
      const nextMonth = addDays(currentMonth, 32);
      setCurrentMonth(startOfMonth(nextMonth));
    } else {
      setCurrentDay(addDays(currentDay, 1));
    }
  };

  const goToToday = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setCurrentMonth(startOfMonth(new Date()));
    setCurrentDay(new Date());
  };

  return (
    <div className="w-full space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-9">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-4">
            <h2 className="text-lg font-light">
              {view === "week"
                ? `${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`
                : view === "month"
                ? format(currentMonth, "MMMM yyyy")
                : format(currentDay, "EEEE, MMMM d, yyyy")}
            </h2>
          </div>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-2 border border-border rounded-lg p-1 bg-muted/30">
          <Button
            variant={view === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("day")}
            className="h-8 gap-2"
          >
            <Clock className="h-4 w-4" />
            Day
          </Button>
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("week")}
            className="h-8 gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            Week
          </Button>
          <Button
            variant={view === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("month")}
            className="h-8 gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Month
          </Button>
        </div>
      </div>

      {/* Calendar content */}
      <AnimatePresence mode="wait">
        {view === "day" ? (
          <motion.div
            key="day"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <DayView
              day={currentDay}
              posts={posts}
              tasks={tasks}
              onReschedule={onReschedule}
              onTaskReschedule={onTaskReschedule}
              onEdit={onEdit}
              onTaskClick={onTaskClick}
            />
          </motion.div>
        ) : view === "week" ? (
          <motion.div
            key="week"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="border border-border rounded-lg bg-card overflow-hidden">
                <div className="flex overflow-x-auto">
                  {weekDays.map((day) => (
                    <DayColumn
                      key={format(day, "yyyy-MM-dd")}
                      day={day}
                      posts={posts}
                      tasks={tasks.filter((task) => {
                        const taskDate = parseISO(task.dueDate);
                        return isSameDay(taskDate, day);
                      })}
                      isToday={isToday(day)}
                      isCurrentMonth={true}
                      onEdit={onEdit}
                      onTaskClick={onTaskClick}
                    />
                  ))}
                </div>

                <DragOverlay>
                  {draggedPost && (
                    <div className="opacity-90 rotate-2 scale-105">
                      <TimelinePostCard post={draggedPost} isDragging={true} onEdit={onEdit} />
                    </div>
                  )}
                  {draggedTask && (
                    <div className="opacity-90 rotate-2 scale-105">
                      <TaskCard task={draggedTask} isDragging={true} onTaskClick={onTaskClick} />
                    </div>
                  )}
                </DragOverlay>
              </div>
            </DndContext>
          </motion.div>
        ) : (
          <motion.div
            key="month"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <MonthView
                currentMonth={currentMonth}
                posts={posts}
                tasks={tasks}
                onReschedule={onReschedule}
                onTaskReschedule={onTaskReschedule}
                onEdit={onEdit}
                onTaskClick={onTaskClick}
              />
              <DragOverlay>
                {draggedPost && (
                  <div className="opacity-90 rotate-2 scale-105">
                    <TimelinePostCard post={draggedPost} isDragging={true} onEdit={onEdit} />
                  </div>
                )}
                {draggedTask && (
                  <div className="opacity-90 rotate-2 scale-105">
                    <TaskCard task={draggedTask} isDragging={true} onTaskClick={onTaskClick} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
