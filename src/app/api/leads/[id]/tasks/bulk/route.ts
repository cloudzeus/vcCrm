import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkTaskSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      question: z.string().min(1, "Question is required"),
      description: z.string().optional().nullable(),
      assignedToContactId: z.string().optional().nullable(),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    // Verify the CRM record exists
    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!crmRecord) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = bulkTaskSchema.parse(body);

    // Separate contact IDs and user IDs (users have "user-" prefix)
    const allAssignedIds = Array.from(
      new Set(
        validatedData.tasks
          .map((t) => t.assignedToContactId)
          .filter((id): id is string => !!id && typeof id === "string")
      )
    );

    const contactIds = allAssignedIds.filter((id) => !id.startsWith("user-"));
    const userIds = allAssignedIds
      .filter((id) => id.startsWith("user-"))
      .map((id) => id.replace("user-", ""));

    // Get valid contact IDs
    let validContactIds = new Set<string>();
    if (contactIds.length > 0) {
      const contacts = await prisma.contact.findMany({
        where: {
          id: { in: contactIds },
          organizationId: organization.id,
        },
        select: {
          id: true,
        },
      });
      validContactIds = new Set(contacts.map((c) => c.id));
    }

    // Get valid user IDs
    let validUserIds = new Set<string>();
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          OR: [
            { organizationId: organization.id },
            { role: "SUPERADMIN" }, // Include SUPERADMIN users
          ],
        },
        select: {
          id: true,
        },
      });
      validUserIds = new Set(users.map((u) => u.id));
    }

    // Prepare tasks with valid assignments
    const tasksToCreate = validatedData.tasks.map((task) => {
      if (!task.assignedToContactId) {
        return { ...task, assignedToContactId: null, assignedToUserId: null };
      }

      if (task.assignedToContactId.startsWith("user-")) {
        const userId = task.assignedToContactId.replace("user-", "");
        return {
          ...task,
          assignedToContactId: null,
          assignedToUserId: validUserIds.has(userId) ? userId : null,
        };
      } else {
        return {
          ...task,
          assignedToContactId: validContactIds.has(task.assignedToContactId)
            ? task.assignedToContactId
            : null,
          assignedToUserId: null,
        };
      }
    });

    // Get existing task count for ordering
    const existingTasksCount = await prisma.opportunityTask.count({
      where: { crmRecordId: id },
    });

    // Create all tasks
    const createdTasks = await Promise.all(
      tasksToCreate.map((task, index) =>
        prisma.opportunityTask.create({
          data: {
            crmRecordId: id,
            companyId: crmRecord.companyId,
            title: task.title,
            question: task.question,
            description: task.description || null,
            assignedToContactId: task.assignedToContactId,
            assignedToUserId: task.assignedToUserId,
            status: "TODO",
            order: existingTasksCount + index,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      tasks: createdTasks,
      count: createdTasks.length,
    });
  } catch (error: any) {
    console.error("Error creating bulk tasks:", error);
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

