import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const campaignSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  brandId: z.string().min(1, "Brand is required"),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  totalBudget: z.number().positive().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const body = await request.json();
    const validatedData = campaignSchema.parse(body);

    // Verify brand belongs to organization
    const brand = await prisma.brand.findFirst({
      where: {
        id: validatedData.brandId,
        organizationId: organization.id,
      },
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        organizationId: organization.id,
        brandId: validatedData.brandId,
        createdById: user.id,
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        totalBudget: validatedData.totalBudget,
      },
      include: {
        brand: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            influencers: true,
            posts: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description || "",
      brandId: campaign.brandId,
      brandName: campaign.brand.name,
      status: campaign.status,
      startDate: campaign.startDate?.toISOString(),
      endDate: campaign.endDate?.toISOString(),
      totalBudget: campaign.totalBudget,
      influencerCount: campaign._count.influencers,
      postCount: campaign._count.posts,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Campaign creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

