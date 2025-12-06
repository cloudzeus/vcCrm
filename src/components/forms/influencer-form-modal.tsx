"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUpload } from "@/components/media/media-upload";
import { Plus, X, Calendar, MapPin, Phone, Mail, Globe } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const platformMetricsSchema = z.object({
  platform: z.string(),
  handle: z.string(),
  followers: z.number().optional(),
  engagementRate: z.number().optional(),
  avgViews: z.number().optional(),
});

const influencerSchema = z.object({
  stageName: z.string().min(2, "Stage name must be at least 2 characters").optional(),
  bio: z.string().optional(),
  defaultCurrency: z.string().optional().default("EUR"),
  managerSharePercent: z.number().min(0).max(100).optional().default(0),
  
  // Personal details
  fullName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  
  // Social media
  instagramUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  tiktokUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  youtubeUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  
  // Portfolio
  portfolioUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  profileImageUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  
  // Professional
  niche: z.string().optional(),
  languages: z.array(z.string()).optional().default([]),
  collaborationTypes: z.array(z.string()).optional().default([]),
  availability: z.string().optional(),
  notes: z.string().optional(),
  
  // Platform metrics
  platforms: z.array(platformMetricsSchema).optional().default([]),
});

type InfluencerFormValues = z.infer<typeof influencerSchema>;

interface InfluencerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InfluencerFormValues) => Promise<void>;
  initialData?: Partial<InfluencerFormValues> & { id?: string };
}

const NICHE_OPTIONS = [
  "Fashion",
  "Beauty",
  "Lifestyle",
  "Tech",
  "Food",
  "Travel",
  "Fitness",
  "Gaming",
  "Education",
  "Business",
  "Entertainment",
  "Other",
];

const LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Greek",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Other",
];

const COLLABORATION_TYPES = [
  "Sponsored Posts",
  "Product Reviews",
  "Brand Ambassadorships",
  "Event Appearances",
  "Video Content",
  "Story Takeovers",
  "Giveaways",
  "Long-term Partnerships",
];

const AVAILABILITY_OPTIONS = [
  "Available",
  "Limited",
  "Unavailable",
  "On Hold",
];

export function InfluencerFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: InfluencerFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [coverImageUploading, setCoverImageUploading] = useState(false);

  const form = useForm<InfluencerFormValues>({
    resolver: zodResolver(influencerSchema),
    defaultValues: {
      stageName: initialData?.stageName || "",
      bio: initialData?.bio || "",
      defaultCurrency: initialData?.defaultCurrency || "EUR",
      managerSharePercent: initialData?.managerSharePercent || 0,
      fullName: initialData?.fullName || "",
      dateOfBirth: initialData?.dateOfBirth || "",
      location: initialData?.location || "",
      address: initialData?.address || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      instagramUrl: initialData?.instagramUrl || "",
      tiktokUrl: initialData?.tiktokUrl || "",
      youtubeUrl: initialData?.youtubeUrl || "",
      twitterUrl: initialData?.twitterUrl || "",
      facebookUrl: initialData?.facebookUrl || "",
      linkedinUrl: initialData?.linkedinUrl || "",
      portfolioUrl: initialData?.portfolioUrl || "",
      profileImageUrl: initialData?.profileImageUrl || "",
      coverImageUrl: initialData?.coverImageUrl || "",
      niche: initialData?.niche || "",
      languages: (initialData?.languages as string[]) || [],
      collaborationTypes: (initialData?.collaborationTypes as string[]) || [],
      availability: initialData?.availability || "Available",
      notes: initialData?.notes || "",
      platforms: (initialData?.platforms as any) || [],
    },
  });

  const { fields: platformFields, append: appendPlatform, remove: removePlatform } = useFieldArray({
    control: form.control,
    name: "platforms",
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        stageName: initialData.stageName || "",
        bio: initialData.bio || "",
        defaultCurrency: initialData.defaultCurrency || "EUR",
        managerSharePercent: initialData.managerSharePercent || 0,
        fullName: initialData.fullName || "",
        dateOfBirth: initialData.dateOfBirth || "",
        location: initialData.location || "",
        address: initialData.address || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        instagramUrl: initialData.instagramUrl || "",
        tiktokUrl: initialData.tiktokUrl || "",
        youtubeUrl: initialData.youtubeUrl || "",
        twitterUrl: initialData.twitterUrl || "",
        facebookUrl: initialData.facebookUrl || "",
        linkedinUrl: initialData.linkedinUrl || "",
        portfolioUrl: initialData.portfolioUrl || "",
        profileImageUrl: initialData.profileImageUrl || "",
        coverImageUrl: initialData.coverImageUrl || "",
        niche: initialData.niche || "",
        languages: (initialData.languages as string[]) || [],
        collaborationTypes: (initialData.collaborationTypes as string[]) || [],
        availability: initialData.availability || "Available",
        notes: initialData.notes || "",
        platforms: (initialData.platforms as any) || [],
      });
    } else {
      form.reset({
        stageName: "",
        bio: "",
        defaultCurrency: "EUR",
        managerSharePercent: 0,
        fullName: "",
        dateOfBirth: "",
        location: "",
        address: "",
        phone: "",
        email: "",
        instagramUrl: "",
        tiktokUrl: "",
        youtubeUrl: "",
        twitterUrl: "",
        facebookUrl: "",
        linkedinUrl: "",
        portfolioUrl: "",
        profileImageUrl: "",
        coverImageUrl: "",
        niche: "",
        languages: [],
        collaborationTypes: [],
        availability: "Available",
        notes: "",
        platforms: [],
      });
    }
  }, [initialData, open, form]);

  const handleProfileImageUpload = async (media: any) => {
    form.setValue("profileImageUrl", media.url);
    setProfileImageUploading(false);
    toast.success("Profile image uploaded successfully");
  };

  const handleCoverImageUpload = async (media: any) => {
    form.setValue("coverImageUrl", media.url);
    setCoverImageUploading(false);
    toast.success("Cover image uploaded successfully");
  };

  const handleSubmit = async (data: InfluencerFormValues) => {
    setLoading(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
      toast.success("Influencer saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save influencer");
    } finally {
      setLoading(false);
    }
  };

  const selectedLanguages = form.watch("languages") || [];
  const selectedCollaborationTypes = form.watch("collaborationTypes") || [];

  const toggleLanguage = (language: string) => {
    const current = selectedLanguages;
    if (current.includes(language)) {
      form.setValue("languages", current.filter((l) => l !== language));
    } else {
      form.setValue("languages", [...current, language]);
    }
  };

  const toggleCollaborationType = (type: string) => {
    const current = selectedCollaborationTypes;
    if (current.includes(type)) {
      form.setValue("collaborationTypes", current.filter((t) => t !== type));
    } else {
      form.setValue("collaborationTypes", [...current, type]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle>
              {initialData ? "Edit Influencer Profile" : "Create Influencer Profile"}
            </DialogTitle>
            <DialogDescription>
              {initialData
                ? "Update influencer profile details below."
                : "Fill in the details to create a comprehensive influencer profile for proposing to brands."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="social">Social Media</TabsTrigger>
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="professional">Professional</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stageName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stage Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Influencer Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="defaultCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Influencer bio..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="managerSharePercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager Share (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              {...field}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = e.target.value;
                                field.onChange(value ? parseFloat(value) : 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Availability</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select availability" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {AVAILABILITY_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full legal name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 234 567 8900" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Contact email (can differ from account email)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Full address..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="social" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="instagramUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://instagram.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tiktokUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TikTok URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://tiktok.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="youtubeUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>YouTube URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://youtube.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="twitterUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://twitter.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="facebookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://facebook.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="linkedinUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel>Platform Metrics</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendPlatform({ platform: "", handle: "", followers: undefined, engagementRate: undefined, avgViews: undefined })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Platform
                      </Button>
                    </div>
                    {platformFields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-light text-xs">Platform {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePlatform(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`platforms.${index}.platform`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Platform</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Instagram" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`platforms.${index}.handle`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Handle</FormLabel>
                                <FormControl>
                                  <Input placeholder="@username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name={`platforms.${index}.followers`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Followers</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`platforms.${index}.engagementRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Engagement Rate (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`platforms.${index}.avgViews`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Avg Views</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="portfolio" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="portfolioUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://portfolio.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="profileImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Image</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {field.value && (
                                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                                  <img
                                    src={field.value}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    onClick={() => field.onChange("")}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {!field.value && (
                                <MediaUpload
                                  onUploadComplete={handleProfileImageUpload}
                                  className="max-w-xs"
                                />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="coverImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover Image</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {field.value && (
                                <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                                  <img
                                    src={field.value}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    onClick={() => field.onChange("")}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {!field.value && (
                                <MediaUpload
                                  onUploadComplete={handleCoverImageUpload}
                                  className="max-w-xs"
                                />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="professional" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="niche"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Niche</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select niche" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {NICHE_OPTIONS.map((niche) => (
                              <SelectItem key={niche} value={niche}>
                                {niche}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Languages</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {LANGUAGE_OPTIONS.map((language) => (
                        <Button
                          key={language}
                          type="button"
                          variant={selectedLanguages.includes(language) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleLanguage(language)}
                        >
                          {language}
                        </Button>
                      ))}
                    </div>
                    <FormDescription>
                      Select all languages the influencer speaks
                    </FormDescription>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Collaboration Types</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {COLLABORATION_TYPES.map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={selectedCollaborationTypes.includes(type) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCollaborationType(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                    <FormDescription>
                      Select collaboration types the influencer accepts
                    </FormDescription>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Internal notes for proposing to brands..."
                            className="resize-none"
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          These notes are only visible to your team and help when proposing this influencer to brands
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : initialData ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
