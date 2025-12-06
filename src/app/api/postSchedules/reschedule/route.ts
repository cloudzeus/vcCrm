import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const rescheduleSchema = z.object({
  postScheduleId: z.string(),
  newDateTime: z.string().datetime(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const body = await request.json();
    const { postScheduleId, newDateTime } = rescheduleSchema.parse(body);

    // Get the post schedule
    const postSchedule = await prisma.postSchedule.findUnique({
      where: { id: postScheduleId },
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

    // Update the scheduled date
    const updated = await prisma.postSchedule.update({
      where: { id: postScheduleId },
      data: {
        scheduledAt: new Date(newDateTime),
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

    console.error("Reschedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

