"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  Users,
  Trash2,
  Edit,
  ExternalLink,
  Calendar,
  FileText,
  Plus,
  TrendingUp,
  Briefcase,
  Paperclip,
  Download,
  Upload,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { CompanyFormModal } from "@/components/forms/company-form-modal";
import { ContactFormModal } from "@/components/forms/contact-form-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { updateCompany } from "@/app/actions/companies";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { RadialBarChart, RadialBar, PolarRadiusAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { useConfirm } from "@/hooks/use-confirm";

interface CompanyDetail {
  id: string;
  name: string;
  vatNumber?: string;
  commercialTitle?: string;
  address?: string;
  irsOffice?: string;
  city?: string;
  country?: string | null;
  zip?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  website?: string;
  contactCount: number;
  contacts: Array<{
    id: string;
    name: string;
    lastName?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    workPhone?: string;
    jobPosition?: string;
    image?: string;
  }>;
}

interface CompanyListItem {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface Lead {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Opportunity {
  id: string;
  title: string;
  briefStatus: string | null;
  valueEstimate: number | null;
  taskCount: number;
  proposalCount: number;
  taskStatusBreakdown?: {
    TODO: number;
    IN_PROGRESS: number;
    REVIEW: number;
    DONE: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Proposal {
  id: string;
  title: string | null;
  version: number;
  status: string;
  crmRecordId: string;
  crmRecordTitle: string;
  createdAt: string;
  updatedAt: string;
}

interface FileAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  taskId: string | null;
  taskTitle: string | null;
  crmRecordId: string;
  crmRecordTitle: string;
  uploaderName: string | null;
  description: string | null;
  createdAt: string;
}

interface CompanyDetailClientProps {
  company: CompanyDetail;
  allCompanies: CompanyListItem[];
  leads?: Lead[];
  opportunities?: Opportunity[];
  proposals?: Proposal[];
  files?: FileAttachment[];
}

export function CompanyDetailClient({
  company,
  allCompanies,
  leads = [],
  opportunities = [],
  proposals = [],
  files = [],
}: CompanyDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { confirm, ConfirmDialog } = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(company);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [currentContacts, setCurrentContacts] = useState(company.contacts);
  const [mounted, setMounted] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>("");
  const [fileDescription, setFileDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent hydration mismatch by only rendering Tabs after client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update current company when company prop changes (route change triggers new data from server)
  useEffect(() => {
    setCurrentCompany(company);
    setCurrentContacts(company.contacts);
  }, [company.id, company.name, company.contacts]);

  const filteredCompanies = allCompanies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCountryLabel = (countryValue: string | null | undefined) => {
    if (!countryValue) return null;
    const country = COUNTRY_OPTIONS.find((c) => c.value === countryValue);
    return country ? country.label : countryValue;
  };


  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left Sidebar - Company List */}
      <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-light">COMPANIES</CardTitle>
                <CardDescription className="text-xs">
                  Companies in your organization
                </CardDescription>
              </div>
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                className="pl-7 h-7 text-xs bg-[#f5f5f5] border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredCompanies.map((item) => {
              const isActive = item.id === currentCompany.id;
              const initials = item.name.charAt(0).toUpperCase();

              return (
                <Link key={item.id} href={`/companies/${item.id}`}>
                  <Card
                    className={cn(
                      "p-3 cursor-pointer transition-all hover:shadow-sm",
                      isActive
                        ? "bg-[#142030] text-white border-[#142030]"
                        : "bg-white border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={item.logoUrl || undefined} />
                        <AvatarFallback className={cn(
                          "text-xs font-light",
                          isActive ? "bg-white text-[#142030]" : "bg-gray-100 text-gray-600"
                        )}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-light truncate",
                          isActive ? "text-white" : "text-foreground"
                        )}>
                          {item.name}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Company Header */}
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={currentCompany.logoUrl || undefined} />
                  <AvatarFallback className="text-lg font-light bg-gray-100">
                    {currentCompany.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-light">{currentCompany.name}</CardTitle>
                  {currentCompany.commercialTitle && (
                    <CardDescription className="text-xs mt-1">
                      {currentCompany.commercialTitle}
                    </CardDescription>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentCompany.vatNumber && (
                <div>
                  <p className="text-xs text-muted-foreground font-light mb-1">VAT Number</p>
                  <p className="text-xs font-light">{currentCompany.vatNumber}</p>
                </div>
              )}
              {currentCompany.irsOffice && (
                <div>
                  <p className="text-xs text-muted-foreground font-light mb-1">IRS Office</p>
                  <p className="text-xs font-light">{currentCompany.irsOffice}</p>
                </div>
              )}
              {(() => {
                const locationParts = [
                  currentCompany.city,
                  currentCompany.zip,
                  getCountryLabel(currentCompany.country),
                ].filter(Boolean);
                const currentLocation = locationParts.join(", ") || currentCompany.address || "-";
                return currentLocation !== "-" && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground font-light mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Address
                    </p>
                    <p className="text-xs font-light">{currentLocation}</p>
                    {currentCompany.address && (
                      <p className="text-xs font-light text-muted-foreground mt-1">{currentCompany.address}</p>
                    )}
                  </div>
                );
              })()}
              {currentCompany.phone && (
                <div>
                  <p className="text-xs text-muted-foreground font-light mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </p>
                  <p className="text-xs font-light">{currentCompany.phone}</p>
                </div>
              )}
              {currentCompany.email && (
                <div>
                  <p className="text-xs text-muted-foreground font-light mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <a
                    href={`mailto:${currentCompany.email}`}
                    className="text-xs font-light text-primary hover:underline"
                  >
                    {currentCompany.email}
                  </a>
                </div>
              )}
              {currentCompany.website && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground font-light mb-1 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Website
                  </p>
                  <a
                    href={currentCompany.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-light text-primary hover:underline flex items-center gap-1"
                  >
                    {currentCompany.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          {mounted ? (
            <Tabs defaultValue="contacts" className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="contacts">
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      Contacts ({currentContacts.length})
                    </TabsTrigger>
                    <TabsTrigger value="leads">
                      <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                      Leads ({leads.length})
                    </TabsTrigger>
                    <TabsTrigger value="opportunities">
                      <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                      Opportunities ({opportunities.length})
                    </TabsTrigger>
                    <TabsTrigger value="proposals">
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Proposals ({proposals.length})
                    </TabsTrigger>
                    <TabsTrigger value="files">
                      <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                      Files ({files.length})
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="contacts" className="mt-0">
                  <div className="flex items-center justify-between mb-3">
                    <CardDescription className="text-xs">
                      People associated with this company
                    </CardDescription>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingContact(null);
                        setIsContactModalOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Contact
                    </Button>
                  </div>
                  {currentContacts.length > 0 ? (
                    <div className="space-y-3">
                      {currentContacts.map((contact) => (
                        <Card key={contact.id} className="p-3 border-gray-200 group relative">
                          <div className="flex items-start gap-3">
                            <Avatar className={cn("h-10 w-10", contact.image && "bg-white")}>
                              <AvatarImage src={contact.image || undefined} />
                              <AvatarFallback className="text-xs font-light">
                                {contact.name.charAt(0).toUpperCase()}
                                {contact.lastName?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 pr-20">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-light">
                                  {contact.name} {contact.lastName || ""}
                                </p>
                                {contact.jobPosition && (
                                  <Badge variant="outline" className="text-[10px] font-light">
                                    {contact.jobPosition}
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1">
                                {contact.email && (
                                  <p className="text-xs font-light text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {contact.email}
                                  </p>
                                )}
                                {contact.phone && (
                                  <p className="text-xs font-light text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {contact.phone}
                                  </p>
                                )}
                                {contact.mobile && (
                                  <p className="text-xs font-light text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    Mobile: {contact.mobile}
                                  </p>
                                )}
                                {contact.workPhone && (
                                  <p className="text-xs font-light text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    Work: {contact.workPhone}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="absolute top-1 right-1 flex items-center gap-1 shrink-0 z-10">
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 py-0 cursor-pointer hover:bg-gray-100 border-[#85A3B2]/30 text-[8px] font-light flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setEditingContact(contact);
                                  setIsContactModalOpen(true);
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                title="Edit"
                                asChild={false}
                              >
                                Edit
                              </Badge>
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 py-0 cursor-pointer hover:bg-gray-100 border-[#FF5C8D]/30 text-[8px] font-light flex items-center justify-center"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  const confirmed = await confirm(`Are you sure you want to delete ${contact.name} ${contact.lastName || ''}?`);
                                  if (confirmed) {
                                    try {
                                      const response = await fetch(`/api/contacts/${contact.id}`, {
                                        method: 'DELETE',
                                      });

                                      if (!response.ok) {
                                        const error = await response.json();
                                        throw new Error(error.error || 'Failed to delete contact');
                                      }

                                      toast.success('Contact deleted');
                                      router.refresh();
                                    } catch (error) {
                                      toast.error(error instanceof Error ? error.message : 'Failed to delete contact');
                                    }
                                  }
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                title="Delete"
                                asChild={false}
                              >
                                Delete
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground font-light mb-3">
                        No contacts associated with this company
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingContact(null);
                          setIsContactModalOpen(true);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Contact
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="leads" className="mt-0">
                  {leads.length > 0 ? (
                    <div className="space-y-2">
                      {leads.map((lead) => (
                        <Link key={lead.id} href={`/leads/${lead.id}`}>
                          <Card className="p-3 border-gray-200 hover:border-[#85A3B2] transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-light truncate">{lead.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {format(new Date(lead.updatedAt), "MMM d, yyyy")}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {lead.status}
                              </Badge>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground font-light">
                        No leads for this company
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="opportunities" className="mt-0">
                  {opportunities.length > 0 ? (
                    <div className="space-y-2">
                      {opportunities.map((opp) => {
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
                          <Link key={opp.id} href={`/leads/${opp.id}`}>
                            <Card className="p-3 border-gray-200 hover:border-[#85A3B2] transition-colors cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-light truncate">{opp.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] text-muted-foreground">
                                      {opp.taskCount} tasks • {opp.proposalCount} proposals
                                    </p>
                                    {opp.valueEstimate && (
                                      <p className="text-[10px] text-muted-foreground">
                                        • €{opp.valueEstimate.toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {opp.briefStatus && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {opp.briefStatus}
                                    </Badge>
                                  )}
                                  {totalTasks > 0 && chartData.length > 0 && (
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
                                  )}
                                </div>
                              </div>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground font-light">
                        No opportunities for this company
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="proposals" className="mt-0">
                  {proposals.length > 0 ? (
                    <div className="space-y-2">
                      {proposals.map((proposal) => (
                        <Link key={proposal.id} href={`/leads/${proposal.crmRecordId}`}>
                          <Card className="p-3 border-gray-200 hover:border-[#85A3B2] transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-light truncate">
                                  {proposal.title || proposal.crmRecordTitle}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Version {proposal.version} • {proposal.crmRecordTitle}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {proposal.status}
                              </Badge>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground font-light">
                        No proposals for this company
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="files" className="mt-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFileUploadModalOpen(true)}
                      className="text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add File
                    </Button>
                  </div>
                  {files.length > 0 ? (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <Card key={file.id} className="p-3 border-gray-200 relative group">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-light truncate">{file.filename}</p>
                                {file.description && (
                                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                                    {file.description}
                                  </p>
                                )}
                                <p className="text-[10px] text-muted-foreground truncate mt-1">
                                  {file.crmRecordTitle}{file.taskTitle ? ` • ${file.taskTitle}` : ''}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {format(new Date(file.createdAt), "MMM d, yyyy")} • {file.uploaderName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-muted-foreground">
                                {(file.sizeBytes / 1024).toFixed(1)} KB
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => window.open(file.url, '_blank')}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={async () => {
                                  const confirmed = await confirm(`Are you sure you want to delete ${file.filename}?`);
                                  if (confirmed) {
                                    try {
                                      // Use generic company file endpoint if it's a generic file, otherwise use opportunity endpoint
                                      const isGenericFile = file.crmRecordId === 'generic';
                                      const response = isGenericFile
                                        ? await fetch(`/api/companies/${company.id}/files/${file.id}`, {
                                          method: 'DELETE',
                                        })
                                        : await fetch(`/api/opportunities/${file.crmRecordId}/attachments/${file.id}`, {
                                          method: 'DELETE',
                                        });

                                      if (!response.ok) {
                                        const error = await response.json();
                                        throw new Error(error.error || 'Failed to delete file');
                                      }

                                      toast.success('File deleted');
                                      router.refresh();
                                    } catch (error) {
                                      toast.error(error instanceof Error ? error.message : 'Failed to delete file');
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Paperclip className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground font-light">
                        No files for this company
                      </p>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          ) : (
            <CardContent>
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground font-light">
                  Loading...
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <CompanyFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={async (data) => {
          const result = await updateCompany(currentCompany.id, data);
          if (result.error) {
            toast.error(result.error);
            throw new Error(result.error);
          }
          toast.success("Company updated");
          router.refresh();
          setIsEditModalOpen(false);
        }}
        initialData={{
          name: currentCompany.name,
          vatNumber: currentCompany.vatNumber,
          commercialTitle: currentCompany.commercialTitle,
          address: currentCompany.address,
          irsOffice: currentCompany.irsOffice,
          city: currentCompany.city,
          country: currentCompany.country as any || undefined,
          zip: currentCompany.zip,
          phone: currentCompany.phone,
          email: currentCompany.email,
          logoUrl: currentCompany.logoUrl,
          website: currentCompany.website,
        }}
      />

      <ContactFormModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        onSubmit={async (data) => {
          try {
            const url = editingContact
              ? `/api/contacts/${editingContact.id}`
              : '/api/contacts';
            const method = editingContact ? 'PUT' : 'POST';

            const contactData = {
              ...data,
              companyId: currentCompany.id, // Always set to current company
            };

            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(contactData),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to save contact');
            }

            toast.success(editingContact ? 'Contact updated' : 'Contact created');
            setIsContactModalOpen(false);
            setEditingContact(null);
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save contact');
            throw error;
          }
        }}
        initialData={editingContact ? {
          id: editingContact.id,
          name: editingContact.name,
          lastName: editingContact.lastName,
          companyId: currentCompany.id,
          email: editingContact.email,
          phone: editingContact.phone,
          mobile: editingContact.mobile,
          workPhone: editingContact.workPhone,
          jobPosition: editingContact.jobPosition,
          image: editingContact.image,
        } : {
          companyId: currentCompany.id,
        }}
        companies={allCompanies.map(c => ({ id: c.id, name: c.name }))}
      />

      {/* File Upload Modal */}
      <Dialog open={isFileUploadModalOpen} onOpenChange={setIsFileUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload a file to one of the company's opportunities or leads
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Associate with Opportunity/Lead (Optional)</Label>
              {[...leads, ...opportunities].length === 0 ? (
                <div className="mt-2 p-3 border border-dashed rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    No opportunities or leads available. File will be uploaded as a generic company file.
                  </p>
                </div>
              ) : (
                <Select value={selectedOpportunityId} onValueChange={setSelectedOpportunityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None (Generic file)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Generic file)</SelectItem>
                    {leads.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Leads</div>
                        {leads.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {opportunities.length > 0 && (
                      <>
                        {leads.length > 0 && <div className="h-px bg-border my-1" />}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Opportunities</div>
                        {opportunities.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Enter file description..."
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>File {!selectedFile && <span className="text-destructive">*</span>}</Label>
              {uploadingFile ? (
                <div className="mt-2 w-full space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              ) : (
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {selectedFile ? selectedFile.name : "Choose File"}
                  </Button>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsFileUploadModalOpen(false);
                  setSelectedFile(null);
                  setFileDescription("");
                  setSelectedOpportunityId("");
                  setUploadProgress(0);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedFile) {
                    toast.error("Please select a file");
                    return;
                  }

                  setUploadingFile(true);
                  setUploadProgress(0);

                  try {
                    // Simulate progress
                    const progressInterval = setInterval(() => {
                      setUploadProgress((prev) => {
                        if (prev >= 90) {
                          clearInterval(progressInterval);
                          return 90;
                        }
                        return prev + 10;
                      });
                    }, 200);

                    const formData = new FormData();
                    formData.append("file", selectedFile);
                    if (fileDescription.trim()) {
                      formData.append("description", fileDescription.trim());
                    }

                    // If opportunity/lead is selected, use that endpoint, otherwise use generic company file endpoint
                    const response = selectedOpportunityId
                      ? await fetch(`/api/opportunities/${selectedOpportunityId}/attachments`, {
                        method: "POST",
                        body: formData,
                      })
                      : await fetch(`/api/companies/${company.id}/files`, {
                        method: "POST",
                        body: formData,
                      });

                    clearInterval(progressInterval);
                    setUploadProgress(100);

                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || "Failed to upload file");
                    }

                    toast.success("File uploaded successfully");
                    setIsFileUploadModalOpen(false);
                    setSelectedFile(null);
                    setFileDescription("");
                    setSelectedOpportunityId("");
                    setUploadProgress(0);
                    router.refresh();
                  } catch (error) {
                    setUploadProgress(0);
                    toast.error(error instanceof Error ? error.message : "Failed to upload file");
                  } finally {
                    setUploadingFile(false);
                  }
                }}
                disabled={uploadingFile || !selectedFile}
                title={!selectedFile ? "Please select a file" : ""}
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}

