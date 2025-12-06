"use client";

import { useState, useMemo } from "react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, addDays, addWeeks, subWeeks, startOfDay } from "date-fns";
import { DayColumn } from "./day-column";
import { PostCard } from "./post-card";

interface PostSchedule {
  id: string;
  campaignId: string;
  influencerId: string;
  platform: string;
  contentType: string;
  scheduledAt: Date | string;
  status: string;
  caption?: string;
  campaign?: {
    name: string;
  };
  influencer?: {
    stageName?: string;
  };
}

interface InfluencerCalendarProps {
  posts: PostSchedule[];
  onReschedule?: (postId: string, newDate: Date) => Promise<void>;
  filters?: {
    campaignId?: string;
    influencerId?: string;
    platform?: string;
  };
}


export function InfluencerCalendar({ posts, onReschedule, filters }: InfluencerCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"week" | "month">("week");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const postsByDay = useMemo(() => {
    const grouped: Record<string, PostSchedule[]> = {};
    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      grouped[dayKey] = [];
    });

    posts.forEach((post) => {
      const postDate = typeof post.scheduledAt === "string" 
        ? new Date(post.scheduledAt) 
        : post.scheduledAt;
      const dayKey = format(startOfDay(postDate), "yyyy-MM-dd");
      if (grouped[dayKey]) {
        grouped[dayKey].push(post);
      }
    });

    return grouped;
  }, [posts, weekDays]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const postId = active.id as string;
    
    // Get the target day from the data attribute or id
    let targetDate: string | null = null;
    if (typeof over.id === "string") {
      targetDate = over.id;
    } else {
      // Try to get from data attribute
      const element = document.querySelector(`[data-day="${over.id}"]`);
      if (element) {
        targetDate = element.getAttribute("data-day");
      }
    }

    // Parse target date (format: "yyyy-MM-dd")
    if (targetDate && targetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = targetDate.split("-").map(Number);
      const newDate = new Date(year, month - 1, day);

      // Find the original post to get the time
      const originalPost = posts.find((p) => p.id === postId);
      if (originalPost) {
        const originalDate = typeof originalPost.scheduledAt === "string"
          ? new Date(originalPost.scheduledAt)
          : originalPost.scheduledAt;
        newDate.setHours(originalDate.getHours(), originalDate.getMinutes());
      }

      if (onReschedule) {
        await onReschedule(postId, newDate);
      }
    }
  };

  const activePost = activeId ? posts.find((p) => p.id === activeId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(new Date())}
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "week" ? "default" : "outline"}
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button
            variant={view === "month" ? "default" : "outline"}
            onClick={() => setView("month")}
          >
            Month
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayPosts = postsByDay[dayKey] || [];

            return (
              <DayColumn key={dayKey} day={day} posts={dayPosts} />
            );
          })}
        </div>

        <DragOverlay>
          {activePost ? (
            <div className="opacity-90 rotate-3">
              <PostCard post={activePost} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

