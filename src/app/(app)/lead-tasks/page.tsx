import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { LeadTasksClient } from "@/components/lead-tasks/lead-tasks-client";

// Ensure fresh data
export const revalidate = 0;

export default async function LeadTasksPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const user = await getCurrentUserOrThrow();
    let organization;
    try {
        organization = await getOrganizationOrThrow();
    } catch (error) {
        if (user.role === "SUPERADMIN") {
            organization = null;
        } else {
            throw error;
        }
    }

    if (!organization) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-light tracking-tight">Lead Tasks</h1>
                <p className="text-muted-foreground mt-2">
                    Please select or create an organization to view tasks.
                </p>
            </div>
        );
    }

    const tasks = await prisma.opportunityTask.findMany({
        where: {
            crmRecord: {
                organizationId: organization.id,
            },
        },
        include: {
            crmRecord: {
                select: {
                    id: true,
                    title: true,
                },
            },
            assignedTo: {
                select: {
                    name: true,
                    lastName: true,
                },
            },
            assignedToUser: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const formattedTasks = tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        crmRecordId: task.crmRecordId,
        crmRecordTitle: task.crmRecord.title,
        assignedToName: task.assignedTo
            ? `${task.assignedTo.name} ${task.assignedTo.lastName || ""}`.trim()
            : task.assignedToUser?.name || task.assignedToUser?.email || null,
    }));

    return (
        <div className="p-4 md:p-6 space-y-6">
            <LeadTasksClient tasks={formattedTasks} />
        </div>
    );
}
