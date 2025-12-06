import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { uploadMedia, generateMediaPath, getFileSize, detectMimeType } from "@/lib/bunny";
import { z } from "zod";

const uploadSchema = z.object({
  campaignId: z.string().optional(),
  influencerId: z.string().optional(),
  postScheduleId: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const campaignId = formData.get("campaignId") as string | null;
    const influencerId = formData.get("influencerId") as string | null;
    const postScheduleId = formData.get("postScheduleId") as string | null;
    const isPrimary = formData.get("isPrimary") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate optional IDs belong to organization
    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: campaignId,
          organizationId: organization.id,
        },
      });
      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }
    }

    if (influencerId) {
      const influencer = await prisma.influencerProfile.findFirst({
        where: {
          id: influencerId,
          organizationId: organization.id,
        },
      });
      if (!influencer) {
        return NextResponse.json(
          { error: "Influencer not found" },
          { status: 404 }
        );
      }
    }

    if (postScheduleId) {
      const post = await prisma.postSchedule.findFirst({
        where: {
          id: postScheduleId,
          campaign: {
            organizationId: organization.id,
          },
        },
      });
      if (!post) {
        return NextResponse.json(
          { error: "Post schedule not found" },
          { status: 404 }
        );
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate path and upload
    const path = generateMediaPath(organization.id, file.name);
    const mimeType = detectMimeType(file.name);
    const url = await uploadMedia({
      path,
      buffer,
      contentType: mimeType,
    });

    // If this is a primary image, unset other primary images
    if (isPrimary) {
      const updateData: any = {
        isPrimary: false,
      };

      if (campaignId) {
        await prisma.mediaAsset.updateMany({
          where: {
            campaignId,
            isPrimary: true,
          },
          data: updateData,
        });
      } else if (influencerId) {
        await prisma.mediaAsset.updateMany({
          where: {
            influencerId,
            isPrimary: true,
          },
          data: updateData,
        });
      }
    }

    // Save to database
    if (!user.id) {
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 401 }
      );
    }

    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        organizationId: organization.id,
        uploadedByUserId: user.id,
        campaignId: campaignId || null,
        influencerId: influencerId || null,
        postScheduleId: postScheduleId || null,
        filename: file.name,
        url,
        mimeType,
        sizeBytes: getFileSize(buffer),
        isPrimary,
      },
    });

    return NextResponse.json({
      id: mediaAsset.id,
      filename: mediaAsset.filename,
      url: mediaAsset.url,
      mimeType: mediaAsset.mimeType,
      sizeBytes: mediaAsset.sizeBytes,
      isPrimary: mediaAsset.isPrimary,
      createdAt: mediaAsset.createdAt,
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

