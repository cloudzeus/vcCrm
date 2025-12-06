import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TaskStatus } from "@prisma/client";

const reorderSchema = z.object({
  taskId: z.string(),
  status: z.nativeEnum(TaskStatus),
  order: z.number().int(),
});

const bulkReorderSchema = z.object({
  updates: z.array(reorderSchema),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    // Verify the opportunity exists
    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
        status: "OPPORTUNITY",
      },
    });

    if (!crmRecord) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = bulkReorderSchema.parse(body);

    // Update all tasks in a transaction
    const updates = await Promise.all(
      validatedData.updates.map((update) =>
        prisma.opportunityTask.updateMany({
          where: {
            id: update.taskId,
            crmRecordId: id,
          },
          data: {
            status: update.status,
            order: update.order,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      updated: updates.reduce((sum, u) => sum + u.count, 0),
    });
  } catch (error: any) {
    console.error("Error reordering tasks:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}






