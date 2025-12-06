import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { sendQuestionnaireEmail } from "@/lib/mailer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    // Get the CRM record with all tasks
    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        company: true,
        opportunityTasks: {
          where: {
            status: {
              not: "DONE",
            },
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!crmRecord) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Group tasks by assigned contact
    const tasksByContact: Record<string, Array<{
      id: string;
      title: string;
      question: string;
      description: string | null;
      order: number;
    }>> = {};

    const unassignedTasks: Array<{
      id: string;
      title: string;
      question: string;
      description: string | null;
      order: number;
    }> = [];

    crmRecord.opportunityTasks.forEach((task) => {
      if (task.assignedToContactId && task.assignedTo) {
        const contactId = task.assignedToContactId;
        if (!tasksByContact[contactId]) {
          tasksByContact[contactId] = [];
        }
        tasksByContact[contactId].push({
          id: task.id,
          title: task.title,
          question: task.question,
          description: task.description,
          order: task.order,
        });
      } else {
        unassignedTasks.push({
          id: task.id,
          title: task.title,
          question: task.question,
          description: task.description,
          order: task.order,
        });
      }
    });

    // Get contact details for each assigned contact
    const contactIds = Object.keys(tasksByContact);
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
      },
    });

    const questionnaire = {
      opportunity: {
        id: crmRecord.id,
        title: crmRecord.title,
        companyName: crmRecord.company.name,
      },
      contacts: contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        lastName: contact.lastName,
        email: contact.email,
        questions: tasksByContact[contact.id] || [],
      })),
      unassigned: unassignedTasks,
    };

    return NextResponse.json(questionnaire);
  } catch (error: any) {
    console.error("Error fetching questionnaire:", error);
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

    const body = await request.json();
    const { contactIds, emailContent } = body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: "Contact IDs are required" },
        { status: 400 }
      );
    }

    // Get the CRM record with all tasks
    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        company: true,
        opportunityTasks: {
          where: {
            assignedToContactId: { in: contactIds },
            status: {
              not: "DONE",
            },
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!crmRecord) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Group tasks by contact
    const tasksByContact: Record<string, typeof crmRecord.opportunityTasks> = {};
    crmRecord.opportunityTasks.forEach((task) => {
      if (task.assignedToContactId) {
        if (!tasksByContact[task.assignedToContactId]) {
          tasksByContact[task.assignedToContactId] = [];
        }
        tasksByContact[task.assignedToContactId].push(task);
      }
    });

    const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const opportunityUrl = `${baseUrl}/leads/${id}`;

    // Send emails to each contact
    const emailResults = await Promise.allSettled(
      Object.entries(tasksByContact).map(async ([contactId, tasks]) => {
        const contact = tasks[0]?.assignedTo;
        if (!contact || !contact.email) {
          throw new Error(`Contact ${contactId} has no email`);
        }

        // Use custom email content if provided, otherwise use default template
        const customContent = emailContent?.[contactId];
        
        await sendQuestionnaireEmail({
          email: contact.email,
          contactName: `${contact.name} ${contact.lastName || ""}`.trim(),
          companyName: crmRecord.company.name,
          opportunityTitle: crmRecord.title,
          questions: tasks.map((task) => ({
            id: task.id,
            title: task.title,
            question: task.question,
            description: task.description || undefined,
            taskUrl: `${opportunityUrl}?taskId=${task.id}`,
          })),
          opportunityUrl,
          customContent,
        });

        // Update tasks to mark email as sent
        await prisma.opportunityTask.updateMany({
          where: {
            id: { in: tasks.map((t) => t.id) },
          },
          data: {
            emailSentAt: new Date(),
          },
        });

        return {
          contactId,
          contactName: `${contact.name} ${contact.lastName || ""}`.trim(),
          email: contact.email,
          taskCount: tasks.length,
        };
      })
    );

    const successful = emailResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);
    const failed = emailResults
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason);

    return NextResponse.json({
      success: true,
      sent: successful.length,
      failed: failed.length,
      results: {
        successful,
        failed: failed.map((error) => error.message || "Unknown error"),
      },
    });
  } catch (error: any) {
    console.error("Error sending questionnaire emails:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

