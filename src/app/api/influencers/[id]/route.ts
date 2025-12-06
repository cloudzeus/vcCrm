import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const influencerSchema = z.object({
  stageName: z.string().min(2, "Stage name must be at least 2 characters").optional(),
  bio: z.string().optional(),
  defaultCurrency: z.string().optional(),
  managerSharePercent: z.number().min(0).max(100).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const body = await request.json();
    const validatedData = influencerSchema.parse(body);

    const existingInfluencer = await prisma.influencerProfile.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingInfluencer) {
      return NextResponse.json(
        { error: "Influencer profile not found" },
        { status: 404 }
      );
    }

    const influencer = await prisma.influencerProfile.update({
      where: { id },
      data: {
        stageName: validatedData.stageName !== undefined ? (validatedData.stageName || null) : undefined,
        bio: validatedData.bio !== undefined ? (validatedData.bio || null) : undefined,
        defaultCurrency: validatedData.defaultCurrency,
        managerSharePercent: validatedData.managerSharePercent,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            campaignAssignments: true,
            posts: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: influencer.id,
      userId: influencer.userId,
      stageName: influencer.stageName || "",
      bio: influencer.bio || "",
      defaultCurrency: influencer.defaultCurrency,
      managerSharePercent: influencer.managerSharePercent || 0,
      userName: influencer.user.name || "",
      userEmail: influencer.user.email,
      userImage: influencer.user.image,
      campaignCount: influencer._count.campaignAssignments,
      postCount: influencer._count.posts,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Influencer update error:", error);
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
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const influencer = await prisma.influencerProfile.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!influencer) {
      return NextResponse.json(
        { error: "Influencer profile not found" },
        { status: 404 }
      );
    }

    await prisma.influencerProfile.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Influencer deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

