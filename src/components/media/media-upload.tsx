"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MediaUploadProps {
  campaignId?: string;
  influencerId?: string;
  postScheduleId?: string;
  onUploadComplete?: (media: any) => void;
  className?: string;
}

export function MediaUpload({
  campaignId,
  influencerId,
  postScheduleId,
  onUploadComplete,
  className,
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    if (campaignId) formData.append("campaignId", campaignId);
    if (influencerId) formData.append("influencerId", influencerId);
    if (postScheduleId) formData.append("postScheduleId", postScheduleId);
    formData.append("isPrimary", "false");

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev: number) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const media = await response.json();
      toast.success("File uploaded successfully");
      onUploadComplete?.(media);
      setProgress(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-border",
          uploading && "opacity-50",
          className?.includes("max-w") && "w-full"
        )}
      >
        <CardContent className={cn("p-3", className?.includes("max-w") && "p-2")}>
          <div className={cn(
            "flex flex-col items-center justify-center",
            className?.includes("max-w") ? "space-y-2" : "space-y-4"
          )}>
            {uploading ? (
              <>
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </>
            ) : (
              <>
                <div className={cn(
                  "rounded-full bg-muted",
                  className?.includes("max-w") ? "p-2" : "p-4"
                )}>
                  <Upload className={cn(
                    "text-muted-foreground",
                    className?.includes("max-w") ? "h-4 w-4" : "h-6 w-6"
                  )} />
                </div>
                <div className="text-center">
                  <p className={cn(
                    "font-medium",
                    className?.includes("max-w") ? "text-xs" : "text-sm"
                  )}>
                    {className?.includes("max-w") ? "Drop or click" : "Drag and drop a file here, or click to select"}
                  </p>
                  {!className?.includes("max-w") && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports images, videos, and documents
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  size={className?.includes("max-w") ? "sm" : "default"}
                  className={className?.includes("max-w") ? "h-7 text-xs px-3" : ""}
                >
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleChange}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

