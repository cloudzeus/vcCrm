import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { sendTaskQuestionEmail } from "@/lib/mailer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id, taskId } = await params;

    // Get the task with all related data
    const task = await prisma.opportunityTask.findFirst({
      where: {
        id: taskId,
        crmRecordId: id,
        crmRecord: {
          organizationId: organization.id,
        },
      },
      include: {
        assignedTo: true,
        crmRecord: {
          include: {
            company: true,
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

    if (!task.assignedTo || !task.assignedTo.email) {
      return NextResponse.json(
        { error: "Task has no assigned contact with email" },
        { status: 400 }
      );
    }

    // Send the email
    await sendTaskQuestionEmail({
      email: task.assignedTo.email,
      contactName: task.assignedTo.name || "Valued Contact",
      companyName: task.crmRecord.company.name,
      opportunityTitle: task.crmRecord.title,
      question: task.question,
      questionTitle: task.title,
      taskUrl: `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/leads/${id}?taskId=${taskId}`,
    });

    // Update task to mark email as sent
    await prisma.opportunityTask.update({
      where: { id: taskId },
      data: {
        emailSentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending task email:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}





