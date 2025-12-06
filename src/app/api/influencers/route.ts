import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const influencerSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  stageName: z.string().min(2, "Stage name must be at least 2 characters").optional(),
  bio: z.string().optional(),
  defaultCurrency: z.string().default("USD"),
  managerSharePercent: z.number().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const body = await request.json();
    const validatedData = influencerSchema.parse(body);

    // Verify user belongs to organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        organizationId: organization.id,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found or doesn't belong to your organization" },
        { status: 404 }
      );
    }

    // Check if influencer profile already exists
    const existing = await prisma.influencerProfile.findUnique({
      where: { userId: validatedData.userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Influencer profile already exists for this user" },
        { status: 400 }
      );
    }

    const influencer = await prisma.influencerProfile.create({
      data: {
        userId: validatedData.userId,
        organizationId: organization.id,
        stageName: validatedData.stageName || null,
        bio: validatedData.bio || null,
        defaultCurrency: validatedData.defaultCurrency,
        managerSharePercent: validatedData.managerSharePercent || 0,
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

    console.error("Influencer creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

