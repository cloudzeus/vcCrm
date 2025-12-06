import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const campaignSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  brandId: z.string().min(1, "Brand is required").optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  totalBudget: z.number().positive().optional().nullable(),
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
    const validatedData = campaignSchema.parse(body);

    // Verify campaign belongs to organization
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // If brandId is being updated, verify it belongs to organization
    if (validatedData.brandId && validatedData.brandId !== existingCampaign.brandId) {
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
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        brandId: validatedData.brandId,
        status: validatedData.status,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
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

    console.error("Campaign update error:", error);
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

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Campaign deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

