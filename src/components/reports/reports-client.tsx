"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#00f2fe"];

export function ReportsClient() {
  const [reportType, setReportType] = useState<string>("brandRevenue");
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reports/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          dateRange: {
            start: dateRange.start?.toISOString(),
            end: dateRange.end?.toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const data = await response.json();
      setReportData(data);
      toast.success("Report generated successfully");
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    const csv = convertToCSV(reportData.data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] || "")).join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-light tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and analyze performance reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brandRevenue">Brand Revenue</SelectItem>
                  <SelectItem value="influencerRevenue">Influencer Revenue</SelectItem>
                  <SelectItem value="platformEngagement">Platform Engagement</SelectItem>
                  <SelectItem value="campaignSummary">Campaign Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.start ? (
                      format(dateRange.start, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.start}
                    onSelect={(date: Date | undefined) =>
                      setDateRange((prev: { start?: Date; end?: Date }) => ({ ...prev, start: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.end && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.end ? (
                      format(dateRange.end, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.end}
                    onSelect={(date: Date | undefined) =>
                      setDateRange((prev: { start?: Date; end?: Date }) => ({ ...prev, end: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
            </Button>
            {reportData && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === "brandRevenue" && "Brand Revenue Report"}
                {reportType === "influencerRevenue" && "Influencer Revenue Report"}
                {reportType === "platformEngagement" && "Platform Engagement Report"}
                {reportType === "campaignSummary" && "Campaign Summary Report"}
              </CardTitle>
              <CardDescription>
                {dateRange.start && dateRange.end && (
                  <>
                    {format(dateRange.start, "PPP")} - {format(dateRange.end, "PPP")}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportType === "brandRevenue" && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="brandName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#667eea" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {reportType === "influencerRevenue" && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="influencerName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#764ba2" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {reportType === "platformEngagement" && (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={reportData.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ platform, postCount }: { platform: string; postCount: number }) =>
                        `${platform}: ${postCount}`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="postCount"
                    >
                      {reportData.data.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {reportType === "campaignSummary" && (
                <div className="space-y-4">
                  {reportData.data.map((campaign: any, index: number) => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4"
                    >
                      <h3 className="font-light text-lg">{campaign.name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Brand</p>
                          <p className="font-medium">{campaign.brandName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-medium">{campaign.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Fee</p>
                          <p className="font-medium">
                            ${campaign.totalFee.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Posts</p>
                          <p className="font-medium">
                            {campaign.postedCount} / {campaign.postCount}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

