import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { sendCampaignSummaryEmail } from "@/lib/mailer";
import { z } from "zod";

const sendSummarySchema = z.object({
  campaignId: z.string(),
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const body = await request.json();
    const validatedData = sendSummarySchema.parse(body);

    // Verify campaign belongs to organization
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: validatedData.campaignId,
        organizationId: organization.id,
      },
      include: {
        brand: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (!campaign.startDate || !campaign.endDate) {
      return NextResponse.json(
        { error: "Campaign must have start and end dates" },
        { status: 400 }
      );
    }

    const dashboardUrl = `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/campaigns/${campaign.id}`;

    // Send email
    try {
      await sendCampaignSummaryEmail({
        email: validatedData.email,
        campaignName: campaign.name,
        brandName: campaign.brand.name,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        dashboardUrl,
      });
    } catch (emailError) {
      console.error("Failed to send campaign summary email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Campaign summary sent successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Send campaign summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

