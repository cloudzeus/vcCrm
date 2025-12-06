"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Eye, Briefcase, Calendar, Building2, CheckSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  companyId: string;
  companyName: string;
  valueEstimate: number | null;
  expectedClose: Date | string | null;
  briefStatus: string | null;
  needs: string | null;
  productServiceScope: string | null;
  customerInfo: any;
  contacts: Array<{
    id: string;
    name: string;
    email: string | null;
    role: string | null;
  }>;
  taskCount: number;
  completedTaskCount: number;
  proposalCount: number;
  taskStatusBreakdown?: {
    TODO: number;
    IN_PROGRESS: number;
    REVIEW: number;
    DONE: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface CompanyListItem {
  id: string;
  name: string;
}

interface OpportunitiesClientProps {
  initialOpportunities: Opportunity[];
  companies: CompanyListItem[];
}

const briefStatusColors: Record<string, string> = {
  DRAFT: "bg-[#E9D8C8]/30 text-[#142030] border-[#E9D8C8]",
  QUESTIONS_GENERATED: "bg-[#85A3B2]/30 text-[#142030] border-[#85A3B2]",
  IN_REVIEW: "bg-[#732553]/30 text-[#142030] border-[#732553]",
  COMPLETED: "bg-[#85A3B2]/30 text-[#142030] border-[#85A3B2]",
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

export function OpportunitiesClient({ initialOpportunities, companies }: OpportunitiesClientProps) {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.description && opp.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || opp.briefStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (opp: Opportunity) => {
    router.push(`/leads/${opp.id}`);
  };

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "QUESTIONS_GENERATED", label: "Questions Generated" },
    { value: "IN_REVIEW", label: "In Review" },
    { value: "COMPLETED", label: "Completed" },
  ];

  const columns: ColumnDef<Opportunity>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.title}</span>
          <span className="text-xs text-muted-foreground">{row.original.companyName}</span>
        </div>
      ),
    },
    {
      id: "tasks",
      header: "Tasks",
      accessorKey: "taskCount",
      cell: ({ row }) => {
        const opp = row.original;
        const taskCount = opp.taskCount || 0;
        const completedCount = opp.completedTaskCount || 0;
        const remainingCount = taskCount - completedCount;
        const completionPercent = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
        
        const taskData = opp.taskStatusBreakdown ? [
          { name: "Done", value: opp.taskStatusBreakdown.DONE, color: "#85A3B2" },
          { name: "Review", value: opp.taskStatusBreakdown.REVIEW, color: "#732553" },
          { name: "In Progress", value: opp.taskStatusBreakdown.IN_PROGRESS, color: "#85A3B2" },
          { name: "To Do", value: opp.taskStatusBreakdown.TODO, color: "#E9D8C8" },
        ].filter(item => item.value > 0) : [
          { name: "Done", value: completedCount, color: "#85A3B2" },
          { name: "Remaining", value: remainingCount, color: "#E9D8C8" },
        ].filter(item => item.value > 0);

        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <CheckSquare className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-light whitespace-nowrap">
                {completedCount}/{taskCount}
              </span>
            </div>
            {taskCount > 0 && (
              <div className="relative w-10 h-10 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={6}
                      outerRadius={12}
                      paddingAngle={1}
                      dataKey="value"
                    >
                      {taskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ fontSize: "10px", padding: "4px 6px" }}
                      formatter={(value: any) => [value, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "proposals",
      header: "Proposals",
      accessorKey: "proposalCount",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.proposalCount}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "briefStatus",
      cell: ({ row }) => {
        const status = row.original.briefStatus || "DRAFT";
        const colorClass = briefStatusColors[status] || briefStatusColors.DRAFT;
        return (
          <Badge variant="outline" className={colorClass}>
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "value",
      header: "Value",
      accessorKey: "valueEstimate",
      cell: ({ row }) => (
        row.original.valueEstimate ? (
          <span className="text-sm">€{row.original.valueEstimate.toLocaleString()}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      ),
    },
    {
      id: "expectedClose",
      header: "Expected Close",
      accessorKey: "expectedClose",
      cell: ({ row }) => (
        row.original.expectedClose ? (
          <span className="text-sm">{format(new Date(row.original.expectedClose), "MMM d, yyyy")}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      ),
    },
    {
      id: "updatedAt",
      header: "Updated",
      accessorKey: "updatedAt",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.updatedAt), "MMM d, yyyy")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-light uppercase tracking-wide">Opportunities</CardTitle>
                <CardDescription className="text-xs">
                  Manage and track sales opportunities
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search opportunities..."
                  className="pl-10 h-9 w-[350px] text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <DataTable
              data={filteredOpportunities}
              columns={columns}
              rowActions={[
                {
                  label: "View Details",
                  value: "view",
                  onClick: handleViewDetails,
                },
              ]}
              onRowClick={handleViewDetails}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}





