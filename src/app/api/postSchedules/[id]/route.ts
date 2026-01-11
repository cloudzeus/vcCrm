import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";
import { PostStatus, PlatformType, ContentType } from "@prisma/client";

const updatePostScheduleSchema = z.object({
  platform: z.nativeEnum(PlatformType).optional(),
  contentType: z.nativeEnum(ContentType).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.nativeEnum(PostStatus).optional(),
  caption: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePostScheduleSchema.parse(body);

    // Get the post schedule
    const postSchedule = await prisma.postSchedule.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!postSchedule) {
      return NextResponse.json(
        { error: "Post schedule not found" },
        { status: 404 }
      );
    }

    // Verify user has access to the organization
    if (user.role !== "SUPERADMIN") {
      await getOrganizationOrThrow(postSchedule.campaign.organizationId);
    }

    // Update the post schedule
    const updated = await prisma.postSchedule.update({
      where: { id },
      data: {
        ...(validatedData.platform && { platform: validatedData.platform }),
        ...(validatedData.contentType && { contentType: validatedData.contentType }),
        ...(validatedData.scheduledAt && { scheduledAt: new Date(validatedData.scheduledAt) }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.caption !== undefined && { caption: validatedData.caption }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      },
      include: {
        campaign: {
          select: {
            name: true,
          },
        },
        influencer: {
          select: {
            stageName: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Update post schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const { id } = await params;

    // Get the post schedule
    const postSchedule = await prisma.postSchedule.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!postSchedule) {
      return NextResponse.json(
        { error: "Post schedule not found" },
        { status: 404 }
      );
    }

    // Verify user has access to the organization
    if (user.role !== "SUPERADMIN") {
      await getOrganizationOrThrow(postSchedule.campaign.organizationId);
    }

    // Delete the post schedule
    await prisma.postSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}










