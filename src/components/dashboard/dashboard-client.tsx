"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Megaphone, TrendingUp, ArrowUpRight, Briefcase, Target, CheckSquare, FileText, Users, Building2, User, Truck, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  PolarRadiusAxis,
  Label,
} from "recharts";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { PostScheduleFormModal } from "@/components/forms/post-schedule-form-modal";
import { TaskFormModal } from "@/components/forms/task-form-modal";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

interface DashboardClientProps {
  activeCampaigns: number;
  scheduledPostsThisWeek: number;
  totalRevenue: number;
  topInfluencers: Array<{
    id: string;
    name: string;
    revenue: number;
    campaigns: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    date: Date | string;
    user: {
      name: string;
      email: string | null;
      image: string | null;
    } | null;
  }>;
  tasksPerUserData: Array<{
    user: string;
    tasks: number;
  }>;
  upcomingPosts?: Array<{
    id: string;
    scheduledAt: Date | string;
    platform: string;
    campaign?: {
      name: string;
    };
  }>;
  weekStart?: Date | string;
  weekEnd?: Date | string;
  // New props for leads, opportunities, and tasks
  totalLeads: number;
  totalOpportunities: number;
  totalTasks: number;
  completedTasks: number;
  recentLeads: Array<{
    id: string;
    title: string;
    companyName: string;
    status: string;
    createdAt: Date | string;
  }>;
  recentOpportunities: Array<{
    id: string;
    title: string;
    companyName: string;
    taskCount: number;
    completedTaskCount: number;
    taskStatusBreakdown?: {
      TODO: number;
      IN_PROGRESS: number;
      REVIEW: number;
      DONE: number;
    };
    briefStatus: string | null;
    createdAt: Date | string;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    question: string;
    status: string;
    assignedToName: string | null;
    dueDate: Date | string | null;
    createdAt: Date | string;
    crmRecordId: string;
    priority: number;
    description: string | null;
  }>;
  taskStatusData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentCustomers: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    logoUrl: string | null;
    createdAt: Date | string;
  }>;
  recentSuppliers: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    logoUrl: string | null;
    createdAt: Date | string;
  }>;
  recentContacts: Array<{
    id: string;
    name: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    image: string | null;
    companyName: string | null;
    createdAt: Date | string;
  }>;
}

const KPI_CARD_VARIANTS = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

const chartColors = {
  primary: "#85A3B2", // Grauzone - blue-grey
  secondary: "#732553", // Pico Eggplant - purple
  accent: "#142030", // Hēi Sè Black
  success: "#85A3B2", // Grauzone - blue-grey
  gradientStart: "#85A3B2", // Grauzone
  gradientEnd: "#732553", // Pico Eggplant
};

// Platform colors matching calendar view
const platformColors: Record<string, { border: string; bg: string }> = {
  INSTAGRAM: {
    border: "border-l-[#85A3B2]",
    bg: "bg-[#85A3B2]/30",
  },
  TIKTOK: {
    border: "border-l-[#732553]",
    bg: "bg-[#732553]/30",
  },
  YOUTUBE: {
    border: "border-l-[#85A3B2]",
    bg: "bg-[#85A3B2]/30",
  },
  FACEBOOK: {
    border: "border-l-[#142030]",
    bg: "bg-[#142030]/30",
  },
  TWITTER: {
    border: "border-l-[#E9D8C8]",
    bg: "bg-[#E9D8C8]/30",
  },
  LINKEDIN: {
    border: "border-l-[#85A3B2]",
    bg: "bg-[#85A3B2]/30",
  },
  OTHER: {
    border: "border-l-[#E9D8C8]",
    bg: "bg-[#E9D8C8]/30",
  },
};

const getPlatformColor = (platform: string) => {
  const upperPlatform = platform.toUpperCase();
  return platformColors[upperPlatform] || platformColors.OTHER;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-xl p-2 backdrop-blur-sm">
        <p className="text-xs font-light text-foreground mb-1.5">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-light text-muted-foreground">{entry.name}:</span>
            <span className="text-xs font-light text-foreground">
              €{entry.value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardClient({
  activeCampaigns,
  scheduledPostsThisWeek,
  totalRevenue,
  topInfluencers,
  recentActivity,
  tasksPerUserData,
  upcomingPosts = [],
  weekStart: initialWeekStart,
  weekEnd: initialWeekEnd,
  totalLeads,
  totalOpportunities,
  totalTasks,
  completedTasks,
  recentLeads,
  recentOpportunities,
  recentTasks,
  recentCustomers,
  recentSuppliers,
  recentContacts,
  taskStatusData,
}: DashboardClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensure arrays are defined
  const safeRecentCustomers = recentCustomers || [];
  const safeRecentSuppliers = recentSuppliers || [];
  const safeTaskStatusData = taskStatusData || [];

  // Prevent hydration mismatch by only rendering charts after client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate growth percentages (mock data for now)
  const revenueGrowth = 12.5;
  const campaignsGrowth = 8.3;
  const postsGrowth = 15.2;
  const leadsGrowth = 5.8;
  const opportunitiesGrowth = 10.2;
  const tasksCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calendar navigation state
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(() => {
    if (initialWeekStart) {
      return new Date(initialWeekStart);
    }
    return new Date();
  });
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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

  const getWeekRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return { start, end };
  };

  const getMonthRange = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return { start, end };
  };

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handlePostClick = (post: any) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: any) => {
    if (!editingPost) return;

    try {
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

      setIsEditModalOpen(false);
      setEditingPost(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to update post schedule", error);
      throw error;
    }
  };

  const currentRange = viewMode === "week" ? getWeekRange(currentDate) : getMonthRange(currentDate);

  // Filter and format posts for the current range
  const filteredPosts = upcomingPosts.filter((post) => {
    const postDate = typeof post.scheduledAt === "string"
      ? new Date(post.scheduledAt)
      : post.scheduledAt;
    return postDate >= currentRange.start && postDate <= currentRange.end;
  });

  const renderedPosts = filteredPosts.length === 0 ? (
    <div className="text-xs font-light text-muted-foreground text-center py-4">
      No posts in this {viewMode}
    </div>
  ) : (
    filteredPosts.map((post, index) => {
      const date = typeof post.scheduledAt === "string"
        ? new Date(post.scheduledAt)
        : post.scheduledAt;
      const platformColor = getPlatformColor(post.platform);
      return (
        <div
          key={post.id || `post-${index}`}
          className={`flex items-center justify-between p-1.5 rounded-md border-l-4 ${platformColor.border} ${platformColor.bg} hover:opacity-80 transition-all cursor-pointer`}
          onClick={() => handlePostClick(post)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-light text-foreground truncate">
              {post.campaign?.name || "Post"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {format(date, "MMM d")} • {format(date, "HH:mm")}
            </p>
          </div>
          <Badge variant="default">
            {post.platform}
          </Badge>
        </div>
      );
    })
  );

  return (
    <div className="space-y-2">
      {/* KPI Cards */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <motion.div
          variants={KPI_CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0 * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 group bg-gradient-to-br from-white to-[#85A3B2]/8 p-2">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-xs font-light text-muted-foreground uppercase tracking-wide">
                Active Campaigns
              </CardTitle>
              <div className="h-6 w-6 rounded-md bg-[#85A3B2]/15 flex items-center justify-center group-hover:bg-[#85A3B2]/20 transition-colors">
                <Megaphone className="h-3 w-3 text-[#85A3B2]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="text-lg font-light tracking-tight text-foreground">{activeCampaigns}</div>
              <div className="flex items-center gap-0.5 text-[10px] font-light text-[#85A3B2]">
                <ArrowUpRight className="h-2 w-2" />
                <span>+{campaignsGrowth}%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={KPI_CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1 * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 group bg-gradient-to-br from-white to-[#E9D8C8]/20 p-2">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-xs font-light text-muted-foreground uppercase tracking-wide">
                Posts This Week
              </CardTitle>
              <div className="h-6 w-6 rounded-md bg-[#E9D8C8]/30 flex items-center justify-center group-hover:bg-[#E9D8C8]/40 transition-colors">
                <Calendar className="h-3 w-3 text-[#732553]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="text-lg font-light tracking-tight text-foreground">{scheduledPostsThisWeek}</div>
              <div className="flex items-center gap-0.5 text-[10px] font-light text-[#85A3B2]">
                <ArrowUpRight className="h-2 w-2" />
                <span>+{postsGrowth}%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={KPI_CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 2 * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 group bg-gradient-to-br from-white to-[#732553]/8 p-2">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-xs font-light text-muted-foreground uppercase tracking-wide">
                Total Revenue
              </CardTitle>
              <div className="h-6 w-6 rounded-md bg-[#732553]/15 flex items-center justify-center group-hover:bg-[#732553]/20 transition-colors">
                <DollarSign className="h-3 w-3 text-[#732553]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="text-lg font-light tracking-tight text-foreground">
                €{totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="flex items-center gap-0.5 text-[10px] font-light text-[#85A3B2]">
                <ArrowUpRight className="h-2 w-2" />
                <span>+{revenueGrowth}%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={KPI_CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 3 * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 group bg-gradient-to-br from-white to-[#E9D8C8]/20 p-2">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-xs font-light text-muted-foreground uppercase tracking-wide">
                Top Influencers
              </CardTitle>
              <div className="h-6 w-6 rounded-md bg-[#142030]/10 flex items-center justify-center group-hover:bg-[#142030]/15 transition-colors">
                <TrendingUp className="h-3 w-3 text-[#142030]" />
              </div>
            </div>
            <div className="text-lg font-light tracking-tight text-foreground">{topInfluencers.length}</div>
          </Card>
        </motion.div>

        <motion.div
          variants={KPI_CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 4 * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 group bg-gradient-to-br from-white to-[#85A3B2]/8 p-2 cursor-pointer"
            onClick={() => router.push("/leads")}
          >
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-xs font-light text-muted-foreground uppercase tracking-wide">
                Total Leads
              </CardTitle>
              <div className="h-6 w-6 rounded-md bg-[#85A3B2]/15 flex items-center justify-center group-hover:bg-[#85A3B2]/20 transition-colors">
                <Target className="h-3 w-3 text-[#85A3B2]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="text-lg font-light tracking-tight text-foreground">{totalLeads}</div>
              <div className="flex items-center gap-0.5 text-[10px] font-light text-[#85A3B2]">
                <ArrowUpRight className="h-2 w-2" />
                <span>+{leadsGrowth}%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={KPI_CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 5 * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 group bg-gradient-to-br from-white to-[#732553]/8 p-2 cursor-pointer"
            onClick={() => router.push("/leads?status=OPPORTUNITY")}
          >
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-xs font-light text-muted-foreground uppercase tracking-wide">
                Opportunities
              </CardTitle>
              <div className="h-6 w-6 rounded-md bg-[#732553]/15 flex items-center justify-center group-hover:bg-[#732553]/20 transition-colors">
                <Briefcase className="h-3 w-3 text-[#732553]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="text-lg font-light tracking-tight text-foreground">{totalOpportunities}</div>
              <div className="flex items-center gap-0.5 text-[10px] font-light text-[#85A3B2]">
                <ArrowUpRight className="h-2 w-2" />
                <span>+{opportunitiesGrowth}%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={KPI_CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 6 * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 group bg-gradient-to-br from-white to-[#E9D8C8]/20 p-2">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-xs font-light text-muted-foreground uppercase tracking-wide">
                Tasks
              </CardTitle>
              <div className="h-6 w-6 rounded-md bg-[#142030]/10 flex items-center justify-center group-hover:bg-[#142030]/15 transition-colors">
                <CheckSquare className="h-3 w-3 text-[#142030]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="text-lg font-light tracking-tight text-foreground">{completedTasks}/{totalTasks}</div>
              <div className="text-[10px] font-light text-[#85A3B2]">
                <span>{tasksCompletionRate}%</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Calendar */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-white to-[#E9D8C8]/20 p-2 h-full flex flex-col">
            <div className="mb-2">
              <CardTitle className="text-xs font-light mb-0.5">Tasks Per User</CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground">
                Task distribution by user
              </CardDescription>
            </div>
            <CardContent className="p-0 flex-1">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={tasksPerUserData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="user"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                    {tasksPerUserData.map((entry, index) => {
                      const colors = ["#E9D8C8", "#85A3B2", "#732553", "#85A3B2"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-white to-[#F5EDE5]/20 p-2 h-full flex flex-col">
            <div className="mb-2">
              <CardTitle className="text-xs font-light mb-0.5">Top Influencers</CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground">
                Revenue performance
              </CardDescription>
            </div>
            <CardContent className="p-0 flex-1">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={topInfluencers}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `€${value / 1000}k`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="revenue"
                    radius={[8, 8, 0, 0]}
                  >
                    {topInfluencers.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? chartColors.primary
                            : index === 1
                              ? chartColors.secondary
                              : index === 2
                                ? chartColors.accent
                                : "hsl(var(--muted))"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-white to-[#E9D8C8]/20 p-2 h-full flex flex-col">
            <div className="mb-2">
              <CardTitle className="text-xs font-light mb-0.5">Task Status</CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground">
                All opportunities
              </CardDescription>
            </div>
            <CardContent className="p-0 flex-1">
              {safeTaskStatusData && safeTaskStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={safeTaskStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#142030"
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            className="text-xs font-light"
                            style={{ fontSize: "12px" }}
                          >
                            {`${name}: ${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {safeTaskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-xs font-light text-muted-foreground">
                  <div className="text-center">
                    <p>No task data available</p>
                    <p className="text-[10px] mt-1">Create tasks to see status distribution</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-white to-[#E9D8C8]/20 p-2 h-full flex flex-col">
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-xs font-light flex items-center gap-1.5">
                  <CalendarIcon className="h-3 w-3" />
                  {viewMode === "week"
                    ? `${format(currentRange.start, "MMM d")} - ${format(currentRange.end, "MMM d")}`
                    : format(currentDate, "MMMM yyyy")}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  className="h-5 text-[10px] px-2"
                  onClick={() => setViewMode("week")}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  className="h-5 text-[10px] px-2"
                  onClick={() => setViewMode("month")}
                >
                  Month
                </Button>
              </div>
              <CardDescription className="text-[10px] text-muted-foreground">
                Upcoming posts
              </CardDescription>
            </div>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <div className="space-y-1 flex-1 overflow-y-auto scroll-smooth" style={{ maxHeight: 'calc(4 * (2.5rem + 0.25rem))' }}>
                {renderedPosts}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* CRM Section - Leads, Opportunities, Tasks */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-white to-[#85A3B2]/8 p-2 h-full flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-light mb-0.5 flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  Recent Leads
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">
                  Latest lead entries
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => router.push("/leads")}
              >
                View All
              </Button>
            </div>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[260px] scroll-smooth scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="space-y-1.5">
                {recentLeads.length === 0 ? (
                  <div className="text-xs font-light text-muted-foreground text-center py-4">
                    No leads yet
                  </div>
                ) : (
                  recentLeads.slice(0, 3).map((lead, index) => (
                    <motion.div
                      key={lead.id || `lead-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05, duration: 0.3 }}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-md border border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200 group cursor-pointer"
                      onClick={() => router.push(`/leads/${lead.id}`)}
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-light text-foreground group-hover:text-primary transition-colors truncate">
                          {lead.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                          {lead.companyName}
                        </p>
                      </div>
                      <Badge variant="default" className="text-[10px]">
                        {lead.status}
                      </Badge>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-white to-[#732553]/8 p-2 h-full flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-light mb-0.5 flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3" />
                  Opportunities
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">
                  Active opportunities
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => router.push("/leads?status=OPPORTUNITY")}
              >
                View All
              </Button>
            </div>
            <CardContent className="p-0 flex-1">
              <div className="space-y-1.5">
                {recentOpportunities.length === 0 ? (
                  <div className="text-xs font-light text-muted-foreground text-center py-4">
                    No opportunities yet
                  </div>
                ) : (
                  recentOpportunities.slice(0, 3).map((opp, index) => {
                    const taskStatusBreakdown = opp.taskStatusBreakdown || {
                      TODO: 0,
                      IN_PROGRESS: 0,
                      REVIEW: 0,
                      DONE: 0,
                    };

                    const totalTasks = taskStatusBreakdown.TODO + taskStatusBreakdown.IN_PROGRESS + taskStatusBreakdown.REVIEW + taskStatusBreakdown.DONE;

                    const chartData = totalTasks > 0 ? [
                      { name: "TODO", value: taskStatusBreakdown.TODO, fill: "#D4A574" },
                      { name: "IN_PROGRESS", value: taskStatusBreakdown.IN_PROGRESS, fill: "#6B9FB8" },
                      { name: "REVIEW", value: taskStatusBreakdown.REVIEW, fill: "#8B2D5F" },
                      { name: "DONE", value: taskStatusBreakdown.DONE, fill: "#4A9B8C" },
                    ].filter(item => item.value > 0) : [];

                    const chartConfig: ChartConfig = {
                      TODO: {
                        label: "To Do",
                        color: "#D4A574",
                      },
                      IN_PROGRESS: {
                        label: "In Progress",
                        color: "#6B9FB8",
                      },
                      REVIEW: {
                        label: "Review",
                        color: "#8B2D5F",
                      },
                      DONE: {
                        label: "Done",
                        color: "#4A9B8C",
                      },
                    } satisfies ChartConfig;

                    return (
                      <motion.div
                        key={opp.id || `opp-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + index * 0.05, duration: 0.3 }}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200 group cursor-pointer"
                        onClick={() => router.push(`/leads/${opp.id}`)}
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-xs font-light text-foreground group-hover:text-primary transition-colors truncate">
                            {opp.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                            {opp.companyName} • {opp.completedTaskCount}/{opp.taskCount} tasks
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="default" className="text-[10px]">
                            {opp.briefStatus || "DRAFT"}
                          </Badge>
                          {mounted && totalTasks > 0 && chartData.length > 0 ? (
                            <ChartContainer
                              config={chartConfig}
                              className="h-12 w-12"
                            >
                              <RadialBarChart
                                data={chartData}
                                innerRadius={12}
                                outerRadius={24}
                                startAngle={90}
                                endAngle={-270}
                              >
                                <ChartTooltip
                                  cursor={false}
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length > 0) {
                                      const entry = payload[0];
                                      const statusName = entry.name;
                                      const value = entry.value as number;
                                      const statusLabels: Record<string, string> = {
                                        TODO: "To Do",
                                        IN_PROGRESS: "In Progress",
                                        REVIEW: "Review",
                                        DONE: "Done",
                                      };
                                      return (
                                        <div className="rounded-lg border bg-background px-2 py-1.5 text-xs shadow-xl">
                                          <div className="font-light">
                                            {statusLabels[statusName as keyof typeof statusLabels] || statusName}: {value}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false} />
                                <RadialBar
                                  dataKey="value"
                                  cornerRadius={2}
                                  className="stroke-transparent stroke-2"
                                >
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </RadialBar>
                              </RadialBarChart>
                            </ChartContainer>
                          ) : totalTasks > 0 && chartData.length > 0 ? (
                            <div className="h-12 w-12" />
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-white to-[#E9D8C8]/20 p-2 h-full flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-light mb-0.5 flex items-center gap-1.5">
                  <CheckSquare className="h-3 w-3" />
                  Recent Tasks
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">
                  Pending questions
                </CardDescription>
              </div>
            </div>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[260px] scroll-smooth scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="space-y-1.5">
                {recentTasks.length === 0 ? (
                  <div className="text-xs font-light text-muted-foreground text-center py-4">
                    No tasks yet
                  </div>
                ) : (
                  recentTasks.slice(0, 10).map((task, index) => (
                    <motion.div
                      key={task.id || `task-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 + index * 0.05, duration: 0.3 }}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-md border border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-200 group cursor-pointer"
                      onClick={() => {
                        setEditingTask({
                          id: task.id,
                          title: task.title,
                          question: task.question,
                          description: task.description || "",
                          priority: task.priority,
                          crmRecordId: task.crmRecordId,
                        });
                        setIsTaskModalOpen(true);
                      }}
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-light text-foreground group-hover:text-primary transition-colors truncate">
                          {task.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                          {task.assignedToName || "Unassigned"}
                        </p>
                      </div>
                      <Badge variant="default" className="text-[10px]">
                        {task.status}
                      </Badge>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity, Customers, and Contacts Row */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity - Limited to 3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-white via-[#E9D8C8]/10 to-white p-2 h-full flex flex-col">
            <div className="mb-2">
              <CardTitle className="text-xs font-light mb-0.5 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-[#E9D8C8]" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground">
                Latest updates
              </CardDescription>
            </div>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[260px] scroll-smooth scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="space-y-1.5">
                {recentActivity.length === 0 ? (
                  <div className="text-xs font-light text-muted-foreground text-center py-4">
                    No activity yet
                  </div>
                ) : (
                  recentActivity.slice(0, 10).map((activity, index) => {
                    const getActivityIcon = () => {
                      switch (activity.type) {
                        case "post":
                          return <FileText className="h-3 w-3 text-[#85A3B2]" />;
                        case "contact":
                          return <User className="h-3 w-3 text-[#732553]" />;
                        case "task":
                          return <CheckSquare className="h-3 w-3 text-[#142030]" />;
                        case "user":
                          return <Users className="h-3 w-3 text-[#E9D8C8]" />;
                        default:
                          return <Plus className="h-3 w-3 text-muted-foreground" />;
                      }
                    };

                    const getActivityColors = () => {
                      switch (activity.type) {
                        case "post":
                          return {
                            border: "border-[#85A3B2]/30 hover:border-[#85A3B2]",
                            bg: "bg-[#85A3B2]/10 hover:bg-[#85A3B2]/20",
                            textHover: "group-hover:text-[#85A3B2]",
                          };
                        case "contact":
                          return {
                            border: "border-[#732553]/30 hover:border-[#732553]",
                            bg: "bg-[#732553]/10 hover:bg-[#732553]/20",
                            textHover: "group-hover:text-[#732553]",
                          };
                        case "task":
                          return {
                            border: "border-[#142030]/30 hover:border-[#142030]",
                            bg: "bg-[#142030]/10 hover:bg-[#142030]/20",
                            textHover: "group-hover:text-[#142030]",
                          };
                        case "user":
                          return {
                            border: "border-[#E9D8C8]/30 hover:border-[#E9D8C8]",
                            bg: "bg-[#E9D8C8]/10 hover:bg-[#E9D8C8]/20",
                            textHover: "group-hover:text-[#142030]",
                          };
                        default:
                          return {
                            border: "border-border/50 hover:border-border",
                            bg: "bg-muted/30 hover:bg-muted/40",
                            textHover: "group-hover:text-primary",
                          };
                      }
                    };

                    const colors = getActivityColors();

                    return (
                      <motion.div
                        key={activity.id || `activity-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.1 + index * 0.05, duration: 0.3 }}
                        className={`flex items-start justify-between gap-3 p-2.5 rounded-md border ${colors.border} ${colors.bg} transition-all duration-200 group`}
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            {getActivityIcon()}
                          </div>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <p className={`text-xs font-light text-foreground ${colors.textHover} transition-colors truncate`}>
                              {activity.title}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                                {activity.description}
                              </p>
                              {activity.user && (
                                <div className="flex items-center gap-1">
                                  <Avatar className="h-3 w-3 border border-border">
                                    <AvatarImage src={activity.user.image || undefined} />
                                    <AvatarFallback className="text-[6px] bg-muted text-foreground">
                                      {activity.user.name?.substring(0, 1).toUpperCase() || activity.user.email?.substring(0, 1).toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <Badge
                                    variant="outline"
                                    className="text-[8px] px-1 py-0 h-3.5"
                                  >
                                    {activity.user.name || activity.user.email?.split('@')[0] || "User"}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="default" className="text-[10px] shrink-0">
                          {format(new Date(activity.date), "MMM d")}
                        </Badge>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Customers & Suppliers - Tabbed Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-white to-[#85A3B2]/8 p-2 h-full flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-light mb-0.5 flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-[#85A3B2]" />
                  Customers
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">
                  Latest entries
                </CardDescription>
              </div>
            </div>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-end mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] px-2"
                  onClick={() => router.push("/companies")}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[260px] scroll-smooth scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {safeRecentCustomers.length === 0 ? (
                  <div className="text-xs font-light text-muted-foreground text-center py-4">
                    No customers yet
                  </div>
                ) : (
                  safeRecentCustomers.map((customer, index) => (
                    <motion.div
                      key={customer.id || `customer-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + index * 0.05, duration: 0.3 }}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-md border border-[#85A3B2]/30 hover:border-[#85A3B2] hover:bg-[#85A3B2]/10 transition-all duration-200 group cursor-pointer"
                      onClick={() => router.push(`/companies/${customer.id}`)}
                    >
                      <Avatar className="h-8 w-8 shrink-0 border border-[#85A3B2]/30">
                        <AvatarImage src={customer.logoUrl || undefined} />
                        <AvatarFallback className="text-[10px] bg-[#85A3B2]/20 text-[#85A3B2]">
                          {customer.name ? customer.name.substring(0, 2).toUpperCase() : "CU"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-light text-foreground group-hover:text-[#85A3B2] transition-colors truncate">
                          {customer.name || "Unnamed Customer"}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                          {customer.city || customer.email || "No details"}
                        </p>
                      </div>
                      <Badge variant="default" dotColor="#85A3B2">
                        {customer.createdAt && !isNaN(new Date(customer.createdAt).getTime())
                          ? format(new Date(customer.createdAt), "MMM d")
                          : "—"}
                      </Badge>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-white to-[#732553]/8 p-2 h-full flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-light mb-0.5 flex items-center gap-1.5">
                  <User className="h-3 w-3 text-[#732553]" />
                  Recent Contacts
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">
                  Latest contacts
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => router.push("/contacts")}
              >
                View All
              </Button>
            </div>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <div className="space-y-1.5 flex-1 overflow-y-auto scroll-smooth" style={{ maxHeight: 'calc(10 * (2.5rem + 0.375rem))' }}>
                {recentContacts.length === 0 ? (
                  <div className="text-xs font-light text-muted-foreground text-center py-4">
                    No contacts yet
                  </div>
                ) : (
                  recentContacts.map((contact, index) => (
                    <motion.div
                      key={contact.id || `contact-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.3 + index * 0.05, duration: 0.3 }}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-md border border-[#732553]/30 hover:border-[#732553] hover:bg-[#732553]/10 transition-all duration-200 group cursor-pointer"
                      onClick={() => router.push(`/contacts`)}
                    >
                      <Avatar className="h-8 w-8 shrink-0 border border-[#142030]/30">
                        <AvatarImage src={contact.image || undefined} />
                        <AvatarFallback className="text-[10px] bg-[#142030]/20 text-[#142030]">
                          {contact.name ? contact.name.substring(0, 1).toUpperCase() : ""}{contact.lastName ? contact.lastName.substring(0, 1).toUpperCase() : ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-light text-foreground group-hover:text-[#732553] transition-colors truncate">
                          {contact.name || ""} {contact.lastName || ""}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                          {contact.companyName || contact.email || "No details"}
                        </p>
                      </div>
                      <Badge variant="default" dotColor="#142030">
                        {contact.createdAt && !isNaN(new Date(contact.createdAt).getTime())
                          ? format(new Date(contact.createdAt), "MMM d")
                          : "—"}
                      </Badge>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>


      {isEditModalOpen && (
        <PostScheduleFormModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSubmit={handleEditSubmit}
          initialData={editingPost || undefined}
        />
      )}

      {/* Task Edit Modal */}
      {editingTask && editingTask.crmRecordId && (
        <TaskFormModal
          open={isTaskModalOpen}
          onOpenChange={setIsTaskModalOpen}
          onSubmit={handleTaskSubmit}
          opportunityId={editingTask.crmRecordId}
          initialData={{
            id: editingTask.id,
            title: editingTask.title,
            question: editingTask.question,
            description: editingTask.description,
            priority: editingTask.priority,
            assignedToContactId: null,
            startDate: null,
            dueDate: null,
            reminderDate: null,
          }}
        />
      )}
    </div>
  );
}
