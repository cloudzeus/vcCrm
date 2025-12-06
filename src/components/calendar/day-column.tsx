"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameDay } from "date-fns";
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

interface DayColumnProps {
  day: Date;
  posts: PostSchedule[];
}

export function DayColumn({ day, posts }: DayColumnProps) {
  const dayKey = format(day, "yyyy-MM-dd");
  const isToday = isSameDay(day, new Date());

  const { setNodeRef, isOver } = useDroppable({
    id: dayKey,
  });

  return (
    <div
      ref={setNodeRef}
      data-day={dayKey}
      className={`min-h-[400px] p-2 rounded-lg border-2 transition-colors ${
        isToday ? "border-primary bg-primary/5" : "border-border bg-card"
      } ${isOver ? "bg-primary/10 border-primary/50" : ""}`}
    >
      <div className="mb-2">
        <p className="text-sm font-semibold">{format(day, "EEE")}</p>
        <p className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
          {format(day, "d")}
        </p>
      </div>
      <SortableContext
        items={posts.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <AnimatePresence>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </AnimatePresence>
      </SortableContext>
    </div>
  );
}

