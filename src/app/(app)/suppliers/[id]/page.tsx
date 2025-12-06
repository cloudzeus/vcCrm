import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { SupplierDetailClient } from "@/components/suppliers/supplier-detail-client";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();
  const { id } = await params;

  const supplierContactIds: string[] = [];

  const [supplier, allSuppliers] = await Promise.all([
    prisma.supplier.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phone: true,
            mobile: true,
            workPhone: true,
            jobPosition: true,
            image: true,
          },
        },
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    }),
    prisma.supplier.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!supplier) {
    notFound();
  }

  // Get supplier contact IDs
  supplier.contacts.forEach((contact) => {
    supplierContactIds.push(contact.id);
  });

  // Fetch leads/opportunities where supplier contacts are involved
  const crmRecordContacts = await prisma.crmRecordContact.findMany({
    where: {
      contactId: {
        in: supplierContactIds,
      },
    },
    include: {
      crmRecord: {
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          opportunityTasks: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                },
              },
              assignedToUser: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              opportunityTasks: true,
              proposals: true,
            },
          },
        },
      },
    },
  });

  // Get unique CrmRecord IDs
  const crmRecordIds = [...new Set(crmRecordContacts.map((crc) => crc.crmRecordId))];

  // Fetch tasks assigned to supplier contacts
  const tasks = await prisma.opportunityTask.findMany({
    where: {
      assignedToContactId: {
        in: supplierContactIds,
      },
    },
    include: {
      crmRecord: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedToUser: {
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

  // Fetch ONLY files attached to tasks assigned to supplier contacts
  // Exclude files attached directly to leads/opportunities (those are customer files)
  // Exclude generic company files (companyId is set) - those are customer-specific files
  const allAttachments = await prisma.opportunityAttachment.findMany({
    where: {
      organizationId: organization.id,
      opportunityTaskId: {
        not: null, // Only files attached to tasks
      },
      opportunityTask: {
        assignedToContactId: {
          in: supplierContactIds,
        },
      },
    },
    include: {
      crmRecord: {
        select: {
          id: true,
          title: true,
        },
      },
      opportunityTask: {
        select: {
          id: true,
          title: true,
          crmRecord: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Filter out generic company files and files attached directly to leads/opportunities (customer files)
  const attachments = allAttachments.filter((file) =>
    !file.companyId &&
    file.opportunityTaskId !== null // Ensure it's a task attachment
  );

  // Separate leads and opportunities
  const leads: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  const opportunities: Array<{
    id: string;
    title: string;
    briefStatus: string | null;
    valueEstimate: number | null;
    taskCount: number;
    proposalCount: number;
    taskStatusBreakdown: {
      TODO: number;
      IN_PROGRESS: number;
      REVIEW: number;
      DONE: number;
    };
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  crmRecordContacts.forEach((crc) => {
    const record = crc.crmRecord;
    if (record.status === "LEAD") {
      leads.push({
        id: record.id,
        title: record.title,
        status: record.status,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    } else if (record.status === "OPPORTUNITY") {
      // Calculate task status breakdown
      const statusBreakdown = {
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        DONE: 0,
      };

      record.opportunityTasks.forEach((task) => {
        const taskStatus = task.status.toUpperCase();
        if (taskStatus === "TODO") {
          statusBreakdown.TODO++;
        } else if (taskStatus === "IN_PROGRESS") {
          statusBreakdown.IN_PROGRESS++;
        } else if (taskStatus === "REVIEW") {
          statusBreakdown.REVIEW++;
        } else if (taskStatus === "DONE") {
          statusBreakdown.DONE++;
        }
      });

      opportunities.push({
        id: record.id,
        title: record.title,
        briefStatus: record.briefStatus,
        valueEstimate: record.valueEstimate,
        taskCount: record._count.opportunityTasks,
        proposalCount: record._count.proposals,
        taskStatusBreakdown: statusBreakdown,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    }
  });

  return (
    <SupplierDetailClient
      supplier={{
        id: supplier.id,
        name: supplier.name,
        vatNumber: supplier.vatNumber || undefined,
        commercialTitle: supplier.commercialTitle || undefined,
        address: supplier.address || undefined,
        irsOffice: supplier.irsOffice || undefined,
        city: supplier.city || undefined,
        country: supplier.country || null,
        zip: supplier.zip || undefined,
        phone: supplier.phone || undefined,
        email: supplier.email || undefined,
        logoUrl: supplier.logoUrl || undefined,
        website: supplier.website || undefined,
        contactCount: supplier._count.contacts,
        contacts: supplier.contacts.map((c) => ({
          id: c.id,
          name: c.name,
          lastName: c.lastName || undefined,
          email: c.email || undefined,
          phone: c.phone || undefined,
          mobile: c.mobile || undefined,
          workPhone: c.workPhone || undefined,
          jobPosition: c.jobPosition || undefined,
          image: c.image || undefined,
        })),
      }}
      allSuppliers={allSuppliers}
      leads={leads.map((lead) => ({
        id: lead.id,
        title: lead.title,
        status: lead.status,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      }))}
      opportunities={opportunities.map((opp) => ({
        id: opp.id,
        title: opp.title,
        briefStatus: opp.briefStatus,
        valueEstimate: opp.valueEstimate,
        taskCount: opp.taskCount,
        proposalCount: opp.proposalCount,
        taskStatusBreakdown: opp.taskStatusBreakdown,
        createdAt: opp.createdAt.toISOString(),
        updatedAt: opp.updatedAt.toISOString(),
      }))}
      tasks={tasks.map((task) => ({
        id: task.id,
        title: task.title,
        question: task.question || "",
        answer: task.answer || "",
        status: task.status,
        assignedToContactId: task.assignedToContactId,
        assignedToName: task.assignedTo?.name || task.assignedToUser?.name || null,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        startDate: task.startDate ? task.startDate.toISOString() : null,
        reminderDate: task.reminderDate ? task.reminderDate.toISOString() : null,
        order: task.order,
        answeredAt: task.answeredAt ? task.answeredAt.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        crmRecordId: task.crmRecordId,
        crmRecordTitle: task.crmRecord.title,
        crmRecordStatus: task.crmRecord.status,
      }))}
      files={attachments.map((file) => ({
        id: file.id,
        filename: file.filename,
        url: file.url,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        taskId: file.opportunityTaskId || null,
        taskTitle: file.opportunityTask?.title || null,
        crmRecordId: file.crmRecordId || file.opportunityTask?.crmRecord.id || '',
        crmRecordTitle: file.crmRecord?.title || file.opportunityTask?.crmRecord.title || '',
        uploaderName: file.uploader.name || file.uploader.email,
        description: file.description || null,
        createdAt: file.createdAt.toISOString(),
      }))}
    />
  );
}

