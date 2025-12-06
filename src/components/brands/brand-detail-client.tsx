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
  Building2,
  Users,
  Package,
  Megaphone,
  Trash2,
  Edit,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BrandDetail {
  id: string;
  name: string;
  website: string;
  notes: string;
  logoUrl: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  campaignCount: number;
  contactCount: number;
  productCount: number;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    isPrimary: boolean;
  }>;
  products: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    currency: string;
  }>;
}

interface BrandListItem {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface BrandDetailClientProps {
  brand: BrandDetail;
  allBrands: BrandListItem[];
}

export function BrandDetailClient({ brand, allBrands }: BrandDetailClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBrands = allBrands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "ACTIVE":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PLANNED":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const locationParts = [brand.city, brand.state, brand.country].filter(Boolean);
  const location = locationParts.join(", ") || brand.address || "-";

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left Sidebar - Brand List */}
      <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-light">Brand Profiles</CardTitle>
                <CardDescription className="text-xs">
                  Brand profiles in your organization
                </CardDescription>
              </div>
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                className="pl-7 h-7 text-xs bg-[#f5f5f5] border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredBrands.map((item) => {
              const isActive = item.id === brand.id;
              const initials = item.name.charAt(0).toUpperCase();

              return (
                <Link key={item.id} href={`/brands/${item.id}`}>
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
                          <AvatarImage src={item.logoUrl || undefined} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-light text-foreground truncate">
                            {item.name}
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
        {/* Brand Information Details */}
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-light">Brand Information Details</CardTitle>
                <CardDescription className="text-xs">
                  Detailed information of brand profile
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-white hover:bg-[#F5EDE5]/30"
                  onClick={() => router.push(`/brands/${brand.id}?edit=true`)}
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
            {/* Header with Logo and Name */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={brand.logoUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {brand.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-light text-foreground">{brand.name}</h2>
                <p className="text-xs text-muted-foreground">
                  Brand #{brand.id.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Brand Name</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                  {brand.name}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Website</label>
                {brand.website ? (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md flex items-center gap-1 hover:bg-[#E9D8C8]/30 transition-colors"
                  >
                    <Globe className="h-3 w-3" />
                    {brand.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                    -
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Location</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Postal Code</label>
                <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                  {brand.postalCode || "-"}
                </div>
              </div>
              {brand.address && (
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase">Address</label>
                  <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                    {brand.address}
                  </div>
                </div>
              )}
              {brand.notes && (
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase">Notes</label>
                  <div className="text-xs font-light text-foreground bg-[#f5f5f5] px-3 py-2 rounded-md">
                    {brand.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Social Media Links */}
            {(brand.instagramUrl ||
              brand.facebookUrl ||
              brand.twitterUrl ||
              brand.linkedinUrl ||
              brand.youtubeUrl ||
              brand.tiktokUrl) && (
              <div className="mt-4 pt-4 border-t border-dotted border-gray-200">
                <label className="text-[10px] text-muted-foreground uppercase mb-2 block">
                  Social Media
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {brand.instagramUrl && (
                    <a
                      href={brand.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Instagram className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                  {brand.facebookUrl && (
                    <a
                      href={brand.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Facebook className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                  {brand.twitterUrl && (
                    <a
                      href={brand.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Twitter className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                  {brand.linkedinUrl && (
                    <a
                      href={brand.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Linkedin className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                  {brand.youtubeUrl && (
                    <a
                      href={brand.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                    >
                      <Youtube className="h-3.5 w-3.5 text-foreground" />
                    </a>
                  )}
                  {brand.tiktokUrl && (
                    <a
                      href={brand.tiktokUrl}
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

        {/* Brand Statistics */}
        <Card className="border-dotted border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-sm font-light">Brand Statistics</CardTitle>
              <CardDescription className="text-xs">
                Campaigns, contacts, and products overview
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-[#E9D8C8]/20 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">Campaigns</div>
                </div>
                <div className="text-lg font-light text-foreground">{brand.campaignCount}</div>
              </div>
              <div className="bg-[#E9D8C8]/20 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">Contacts</div>
                </div>
                <div className="text-lg font-light text-foreground">{brand.contactCount}</div>
              </div>
              <div className="bg-[#E9D8C8]/20 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">Products</div>
                </div>
                <div className="text-lg font-light text-foreground">{brand.productCount}</div>
              </div>
            </div>

            {brand.campaigns.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-light text-muted-foreground uppercase mb-2">
                  Recent Campaigns
                </div>
                {brand.campaigns.map((campaign) => (
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

        {/* Contacts */}
        {brand.contacts.length > 0 && (
          <Card className="border-dotted border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-sm font-light">Brand Contacts</CardTitle>
                <CardDescription className="text-xs">
                  Contact persons and their details
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {brand.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-light text-foreground">
                          {contact.name}
                          {contact.isPrimary && (
                            <Badge variant="default">
                              Primary
                            </Badge>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {contact.role}
                          {contact.department && ` • ${contact.department}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products */}
        {brand.products.length > 0 && (
          <Card className="border-dotted border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-sm font-light">Products & Services</CardTitle>
                <CardDescription className="text-xs">
                  Products and services to be promoted
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {brand.products.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-md bg-[#f5f5f5] hover:bg-[#E9D8C8]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-light text-foreground">{product.name}</p>
                        {product.description && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {product.category && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 font-light border border-dotted"
                            >
                              {product.category}
                            </Badge>
                          )}
                          {product.price > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {product.currency} {product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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

