import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { LeadDetailClient } from "@/components/leads/lead-detail-client";
import type { LeadDetail } from "@/lib/types/crm";

export default async function LeadDetailPage({
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

  const [crmRecord, companies, suppliers, allUsers] = await Promise.all([
    prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            contacts: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
                phone: true,
                jobPosition: true,
              },
              orderBy: {
                name: "asc",
              },
            },
          },
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
                phone: true,
                jobPosition: true,
                companyId: true,
                supplierId: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                supplier: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        opportunityTasks: {
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
            attachments: {
              select: {
                id: true,
                filename: true,
                url: true,
                mimeType: true,
                sizeBytes: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: [
            { status: "asc" },
            { order: "asc" },
            { createdAt: "asc" },
          ],
        },
      },
    }),
    prisma.company.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.supplier.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        contacts: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phone: true,
            jobPosition: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { organizationId: organization.id },
          { role: "SUPERADMIN" }, // Include SUPERADMIN users even without organizationId
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!crmRecord) {
    notFound();
  }

  const lead: LeadDetail = {
    id: crmRecord.id,
    title: crmRecord.title,
    description: crmRecord.description || undefined,
    status: crmRecord.status,
    companyId: crmRecord.companyId,
    companyName: crmRecord.company.name,
    companyLogoUrl: crmRecord.company.logoUrl || undefined,
    valueEstimate: crmRecord.valueEstimate || undefined,
    expectedClose: crmRecord.expectedClose || undefined,
    outcome: crmRecord.outcome || undefined,
    closedAt: crmRecord.closedAt || undefined,
    contactCount: crmRecord.contacts.length,
    contacts: crmRecord.contacts.map((crc) => ({
      id: crc.contact.id,
      name: crc.contact.name,
      lastName: crc.contact.lastName || "",
      email: crc.contact.email || "",
      phone: crc.contact.phone || "",
      jobPosition: crc.contact.jobPosition || "",
      role: crc.role || "",
      companyName: crc.contact.company?.name || null,
      supplierName: crc.contact.supplier?.name || null,
      isCompanyContact: !!crc.contact.companyId,
      isSupplierContact: !!crc.contact.supplierId,
    })),
    createdAt: crmRecord.createdAt,
    updatedAt: crmRecord.updatedAt,
  };

  // Extract company contacts
  const companyContacts = (crmRecord.company?.contacts || []).map((contact) => ({
    id: contact.id,
    name: contact.name,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    jobPosition: contact.jobPosition,
  }));

  // Map suppliers with their contacts
  const suppliersWithContacts = suppliers.map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    city: supplier.city,
    contacts: supplier.contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      jobPosition: contact.jobPosition,
    })),
  }));

  // Map tasks
  const tasksData = crmRecord.opportunityTasks.map((task) => ({
    id: task.id,
    title: task.title,
    question: task.question || "",
    description: task.description,
    answer: task.answer || "",
    status: task.status,
    priority: task.priority,
    assignedToContactId: task.assignedToContactId
      ? task.assignedToContactId
      : task.assignedToUser
        ? `user-${task.assignedToUser.id}`
        : null,
    assignedToName: task.assignedTo?.name || task.assignedToUser?.name || null,
    assignedTo: task.assignedTo
      ? {
        id: task.assignedTo.id,
        name: task.assignedTo.name || "Unknown",
        email: task.assignedTo.email,
      }
      : task.assignedToUser
        ? {
          id: task.assignedToUser.id,
          name: task.assignedToUser.name || "Unknown",
          email: task.assignedToUser.email,
        }
        : null,
    dueDate: task.dueDate,
    startDate: task.startDate,
    reminderDate: task.reminderDate,
    emailSentAt: task.emailSentAt,
    order: task.order,
    answeredAt: task.answeredAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    crmRecordId: task.crmRecordId,
    attachments: task.attachments.map((att) => ({
      id: att.id,
      filename: att.filename,
      url: att.url,
      mimeType: att.mimeType,
      sizeBytes: att.sizeBytes,
    })),
  }));

  // Calculate task counts
  const taskCount = crmRecord.opportunityTasks.length;
  const completedTaskCount = crmRecord.opportunityTasks.filter(
    (task) => task.status === "DONE"
  ).length;

  // Collect all available contacts for task assignment:
  // 1. Contacts already associated with the lead
  // 2. Company contacts
  // 3. Supplier contacts
  // 4. Users (including SUPERADMIN)
  const allAvailableContacts = [
    // Lead contacts
    ...lead.contacts.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email || null,
      type: "contact" as const,
    })),
    // Company contacts (excluding already added)
    ...companyContacts
      .filter((cc) => !lead.contacts.some((lc) => lc.id === cc.id))
      .map((cc) => ({
        id: cc.id,
        name: cc.name,
        email: cc.email || null,
        type: "contact" as const,
      })),
    // Supplier contacts (excluding already added)
    ...suppliersWithContacts.flatMap((supplier) =>
      supplier.contacts
        .filter((sc) => !lead.contacts.some((lc) => lc.id === sc.id))
        .map((sc) => ({
          id: sc.id,
          name: sc.name,
          email: sc.email || null,
          type: "contact" as const,
        }))
    ),
    // Users (with user- prefix to differentiate from contacts)
    ...allUsers.map((u) => ({
      id: `user-${u.id}`, // Prefix to differentiate from contacts
      name: u.name || u.email,
      email: u.email || null,
      type: "user" as const,
      role: u.role,
    })),
  ];

  // Remove duplicates by ID
  const uniqueContacts = Array.from(
    new Map(allAvailableContacts.map((contact) => [contact.id, contact])).values()
  );

  return (
    <LeadDetailClient
      lead={lead}
      allCompanies={companies}
      tasks={tasksData}
      companyContacts={companyContacts}
      suppliers={suppliersWithContacts}
      allAvailableContacts={uniqueContacts}
      taskCount={taskCount}
      completedTaskCount={completedTaskCount}
    />
  );
}

