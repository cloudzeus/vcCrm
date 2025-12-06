import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TaskStatus } from "@prisma/client";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  question: z.string().min(1, "Question is required"),
  description: z.string().optional(),
  assignedToContactId: z.string().optional().nullable(),
  priority: z.number().int().min(0).max(2).default(0),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  reminderDate: z.string().datetime().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    // Verify the opportunity exists and belongs to organization
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

    // Get all tasks for this opportunity
    const tasks = await prisma.opportunityTask.findMany({
      where: {
        crmRecordId: id,
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
      orderBy: [
        { status: "asc" },
        { order: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const validatedData = taskSchema.parse(body);

    // Handle assignment - check if it's a user (user- prefix) or contact
    let validContactId = null;
    let validUserId = null;
    
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
        } else {
          console.warn(`User ${userId} not found, task will be unassigned`);
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
        } else {
          console.warn(`Contact ${assignedId} not found, task will be unassigned`);
        }
      }
    }

    // Get max order for this status
    const maxOrder = await prisma.opportunityTask.findFirst({
      where: {
        crmRecordId: id,
        status: "TODO",
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });

    const task = await prisma.opportunityTask.create({
      data: {
        crmRecordId: id,
        companyId: crmRecord.companyId,
        title: validatedData.title,
        question: validatedData.question,
        description: validatedData.description || null,
        assignedToContactId: validContactId,
        assignedToUserId: validUserId,
        priority: validatedData.priority,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        reminderDate: validatedData.reminderDate ? new Date(validatedData.reminderDate) : null,
        status: "TODO",
        order: (maxOrder?.order ?? -1) + 1,
      },
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

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
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

