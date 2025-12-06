import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TaskStatus } from "@prisma/client";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  question: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  answer: z.string().optional().nullable(),
  assignedToContactId: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.number().int().min(0).max(2).optional(),
  startDate: z.preprocess(
    (val) => {
      if (!val || val === null || val === "") return null;
      if (typeof val === "string") {
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date.toISOString();
      }
      return null;
    },
    z.string().datetime().nullable()
  ).optional().nullable(),
  dueDate: z.preprocess(
    (val) => {
      if (!val || val === null || val === "") return null;
      if (typeof val === "string") {
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date.toISOString();
      }
      return null;
    },
    z.string().datetime().nullable()
  ).optional().nullable(),
  reminderDate: z.preprocess(
    (val) => {
      if (!val || val === null || val === "") return null;
      if (typeof val === "string") {
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date.toISOString();
      }
      return null;
    },
    z.string().datetime().nullable()
  ).optional().nullable(),
  notes: z.string().optional().nullable(),
  order: z.number().int().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id, taskId } = await params;

    const task = await prisma.opportunityTask.findFirst({
      where: {
        id: taskId,
        crmRecordId: id,
        crmRecord: {
          organizationId: organization.id,
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        crmRecord: {
          select: {
            id: true,
            title: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id, taskId } = await params;

    if (!taskId || taskId === "undefined") {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    // Handle request body - check if it exists and parse it
    let body = {};
    try {
      const contentType = request.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const text = await request.text();
        if (text && text.trim()) {
          body = JSON.parse(text);
        }
      }
    } catch (error) {
      // If body parsing fails, return error
      console.error("Failed to parse request body:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const validatedData = updateTaskSchema.parse(body);

    // Verify task exists and belongs to organization
    const existingTask = await prisma.opportunityTask.findFirst({
      where: {
        id: taskId,
        crmRecordId: id,
        crmRecord: {
          organizationId: organization.id,
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Handle assignment - check if it's a user (user- prefix) or contact
    let validContactId: string | null = existingTask.assignedToContactId;
    let validUserId: string | null = existingTask.assignedToUserId || null;
    
    if (validatedData.assignedToContactId !== undefined) {
      if (validatedData.assignedToContactId) {
        const assignedId = validatedData.assignedToContactId;
        
        if (assignedId.startsWith("user-")) {
          // It's a user assignment
          const userId = assignedId.replace("user-", "");
          const user = await prisma.user.findFirst({
            where: {
              id: userId,
              OR: [
                { organizationId: organization.id },
                { role: "SUPERADMIN" }, // Include SUPERADMIN users
              ],
            },
          });

          if (user) {
            validUserId = userId;
            validContactId = null; // Clear contact assignment
          } else {
            console.warn(`User ${userId} not found, task will be unassigned`);
            validUserId = null;
            validContactId = null;
          }
        } else {
          // It's a contact assignment
          const contact = await prisma.contact.findFirst({
            where: {
              id: assignedId,
              organizationId: organization.id,
            },
          });

          if (contact) {
            validContactId = assignedId;
            validUserId = null; // Clear user assignment
          } else {
            console.warn(`Contact ${assignedId} not found, task will be unassigned`);
            validContactId = null;
            validUserId = null;
          }
        }
      } else {
        // Explicitly unassign both
        validContactId = null;
        validUserId = null;
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.question !== undefined) updateData.question = validatedData.question;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.answer !== undefined) {
      updateData.answer = validatedData.answer;
      // Set answeredAt if answer is being provided and wasn't set before
      if (validatedData.answer && !existingTask.answer) {
        updateData.answeredAt = new Date();
      }
    }
    if (validatedData.assignedToContactId !== undefined) {
      updateData.assignedToContactId = validContactId;
      updateData.assignedToUserId = validUserId;
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      // If marking as DONE and answer exists, set answeredAt
      if (validatedData.status === "DONE" && existingTask.answer && !existingTask.answeredAt) {
        updateData.answeredAt = new Date();
      }
    }
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    }
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }
    if (validatedData.reminderDate !== undefined) {
      updateData.reminderDate = validatedData.reminderDate ? new Date(validatedData.reminderDate) : null;
    }
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    const task = await prisma.opportunityTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("Error updating task:", error);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id, taskId } = await params;

    // Verify task exists and belongs to organization
    const task = await prisma.opportunityTask.findFirst({
      where: {
        id: taskId,
        crmRecordId: id,
        crmRecord: {
          organizationId: organization.id,
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    await prisma.opportunityTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

