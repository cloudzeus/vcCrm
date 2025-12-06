"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Music,
  Calendar,
  Briefcase,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Trash2,
  Edit,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface InfluencerDetail {
  id: string;
  userId: string;
  stageName: string;
  bio: string;
  fullName: string;
  dateOfBirth?: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  defaultCurrency: string;
  managerSharePercent: number;
  portfolioUrl: string;
  profileImageUrl: string;
  coverImageUrl: string;
  niche: string;
  availability: string;
  notes: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  platforms?: any;
  languages?: any;
  collaborationTypes?: any;
  rateCard?: any;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  campaignCount: number;
  postCount: number;
  taskCount: number;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    startDate?: string;
    endDate?: string;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate?: string;
    campaignName: string;
  }>;
  recentPosts: Array<{
    id: string;
    platform: string;
    scheduledAt: string;
    status: string;
  }>;
}

interface InfluencerListItem {
  id: string;
  stageName: string;
  userName: string;
  userImage?: string | null;
}

interface InfluencerDetailClientProps {
  influencer: InfluencerDetail;
  allInfluencers: InfluencerListItem[];
}

export function InfluencerDetailClient({
  influencer,
  allInfluencers,
}: InfluencerDetailClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInfluencers = allInfluencers.filter(
    (i) =>
      i.stageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "PAID":
        return "bg-green-100 text-green-700 border-green-200";
      case "ACTIVE":
      case "PUBLISHED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const initials = influencer.userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left Sidebar - Influencer List */}
      <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-light">Influencer Profiles</CardTitle>
                <CardDescription className="text-xs">
                  Influencer profiles in your organization
                </CardDescription>
              </div>
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search influencers..."
                className="pl-7 h-7 text-xs bg-[#f5f5f5] border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredInfluencers.map((item) => {
              const isActive = item.id === influencer.id;
              const itemInitials = item.userName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "?";

              return (
                <Link key={item.id} href={`/influencers/${item.id}`}>
                  <Card
                    className={cn(
                      "border-dotted border-gray-200 cursor-pointer transition-all",
                      isActive
                        ? "bg-[#E9D8C8]/30 border-[#85A3B2]/30"
                        : "bg-white hover:bg-[#F5EDE5]/30"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={item.userImage || undefined} />
                          <AvatarFallback className="text-xs">{itemInitials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-light text-foreground truncate">
                            {item.stageName || item.userName}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.userName}
                          </p>
                        </div>
                        {isActive && (
                          <div className="h-2 w-2 rounded-full bg-[#85A3B2]" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Detail Sections */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Influencer Information Details */}
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-light">Influencer Information Details</CardTitle>
                <CardDescription className="text-xs">
                  Detailed information of influencer profile
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-white hover:bg-[#F5EDE5]/30"
                  onClick={() => router.push(`/influencers/${influencer.id}?edit=true`)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Header with Avatar and Name */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={influencer.userImage || influencer.profileImageUrl || undefined} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-light text-foreground">
                  {influencer.stageName || influencer.userName}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Influencer #{influencer.id.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Full Name</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                  {influencer.fullName || influencer.userName || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Stage Name</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                  {influencer.stageName || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Email</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {influencer.email || influencer.userEmail || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Phone</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {influencer.phone || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Location</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {influencer.location || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Niche</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                  {influencer.niche || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Availability</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                  {influencer.availability || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Currency</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                  {influencer.defaultCurrency}
                </div>
              </div>
              {influencer.address && (
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase">Address</label>
                  <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                    {influencer.address}
                  </div>
                </div>
              )}
              {influencer.bio && (
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase">Bio</label>
                  <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                    {influencer.bio}
                  </div>
                </div>
              )}
            </div>

            {/* Social Media Links */}
            {(influencer.instagramUrl ||
              influencer.facebookUrl ||
              influencer.twitterUrl ||
              influencer.linkedinUrl ||
              influencer.youtubeUrl ||
              influencer.tiktokUrl) && (
              <div className="mt-4 pt-4 border-t border-dotted border-gray-200">
                <label className="text-[10px] text-muted-foreground uppercase mb-2 block">
                  Social Media
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {influencer.instagramUrl && (
                    <a
                      href={influencer.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Instagram className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                  {influencer.facebookUrl && (
                    <a
                      href={influencer.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Facebook className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                  {influencer.twitterUrl && (
                    <a
                      href={influencer.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Twitter className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                  {influencer.linkedinUrl && (
                    <a
                      href={influencer.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Linkedin className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                  {influencer.youtubeUrl && (
                    <a
                      href={influencer.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Youtube className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                  {influencer.tiktokUrl && (
                    <a
                      href={influencer.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Music className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-sm font-light">Campaign Performance</CardTitle>
              <CardDescription className="text-xs">
                Campaigns and performance metrics
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-[#E9D8C8]/20 p-3 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Total Campaigns</div>
                <div className="text-lg font-light text-foreground">{influencer.campaignCount}</div>
              </div>
              <div className="bg-[#E9D8C8]/20 p-3 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Total Posts</div>
                <div className="text-lg font-light text-foreground">{influencer.postCount}</div>
              </div>
              <div className="bg-[#E9D8C8]/20 p-3 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Active Tasks</div>
                <div className="text-lg font-light text-foreground">{influencer.taskCount}</div>
              </div>
            </div>

            {influencer.campaigns.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-light text-muted-foreground uppercase mb-2">
                  Recent Campaigns
                </div>
                {influencer.campaigns.slice(0, 5).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-light text-foreground">{campaign.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {campaign.startDate && format(new Date(campaign.startDate), "MMM d, yyyy")}
                        {campaign.endDate &&
                          ` - ${format(new Date(campaign.endDate), "MMM d, yyyy")}`}
                      </p>
                    </div>
                    <Badge variant="default">
                      {campaign.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        {influencer.recentTasks.length > 0 && (
          <Card className="border-dotted border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-sm font-light">Recent Tasks</CardTitle>
                <CardDescription className="text-xs">
                  Assigned tasks and deadlines
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {influencer.recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-light text-foreground">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {task.campaignName}
                        {task.dueDate &&
                          ` • Due: ${format(new Date(task.dueDate), "MMM d, yyyy")}`}
                      </p>
                    </div>
                    <Badge variant="default">
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

