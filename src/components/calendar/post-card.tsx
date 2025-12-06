"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface PostCardProps {
  post: PostSchedule;
  isDragging?: boolean;
}

export function PostCard({ post, isDragging }: PostCardProps) {
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

  const platformColors: Record<string, string> = {
    INSTAGRAM: "bg-primary/10 text-primary border-primary/30",
    TIKTOK: "bg-foreground text-background border-border",
    YOUTUBE: "bg-destructive/10 text-destructive border-destructive/30",
    OTHER: "bg-muted text-muted-foreground border-border",
  };

  const statusColors: Record<string, string> = {
    PLANNED: "bg-primary/20 text-primary-foreground",
    DRAFT: "bg-yellow-500/20 text-yellow-900",
    APPROVED: "bg-success/20 text-success-foreground",
    POSTED: "bg-muted text-muted-foreground",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-move mb-2"
    >
      <Card className={`border-2 ${platformColors[post.platform] || platformColors.OTHER}`}>
        <CardContent className="p-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {post.campaign?.name || "Untitled Campaign"}
              </p>
              <p className="text-xs opacity-80 truncate">
                {post.influencer?.stageName || "Influencer"}
              </p>
              <div className="flex gap-1 mt-1">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {post.contentType}
                </Badge>
                <Badge className={`text-xs px-1 py-0 ${statusColors[post.status] || statusColors.PLANNED}`}>
                  {post.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

