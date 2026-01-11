import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { CompanyDetailClient } from "@/components/companies/company-detail-client";

export default async function CompanyDetailPage({
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

  const company = await prisma.company.findFirst({
    where: {
      id,
      organizationId: organization.id,
    },
    // Force rebuild
    include: {
      contacts: {
        orderBy: [
          { createdAt: "asc" },
        ],
      },
      _count: {
        select: {
          contacts: true,
        },
      },
    },
  });

  if (!company) {
    notFound();
  }

  const [allCompanies, leads, opportunities, proposals, attachments] = await Promise.all([
    prisma.company.findMany({
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
    // Fetch leads for this company
    prisma.crmRecord.findMany({
      where: {
        companyId: id,
        organizationId: organization.id,
        status: "LEAD",
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    // Fetch opportunities for this company
    prisma.crmRecord.findMany({
      where: {
        companyId: id,
        organizationId: organization.id,
        status: "OPPORTUNITY",
      },
      include: {
        opportunityTasks: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            opportunityTasks: true,
            proposals: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    // Fetch all proposals for this company
    (prisma.proposal as any).findMany({
      where: {
        companyId: id,
        organizationId: organization.id,
      },
      include: {
        crmRecord: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    // Fetch attachments for opportunities of this company (both direct, task attachments, and generic company files)
    // Note: We'll filter companyId files in JavaScript because of mixed OR conditions
    prisma.opportunityAttachment.findMany({
      where: {
        organizationId: organization.id,
        OR: [
          {
            crmRecord: {
              companyId: id,
            },
          },
          {
            opportunityTask: {
              crmRecord: {
                companyId: id,
              },
            },
          },
          {
            companyId: id,
          }
        ],
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
    }),
  ]);

  return (
    <CompanyDetailClient
      company={{
        id: company.id,
        name: company.name,
        vatNumber: company.vatNumber || undefined,
        commercialTitle: company.commercialTitle || undefined,
        address: company.address || undefined,
        irsOffice: company.irsOffice || undefined,
        city: company.city || undefined,
        country: company.country || null,
        zip: company.zip || undefined,
        phone: company.phone || undefined,
        email: company.email || undefined,
        logoUrl: company.logoUrl || undefined,
        website: company.website || undefined,
        contactCount: company._count.contacts,
        contacts: company.contacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          lastName: contact.lastName || undefined,
          email: contact.email || undefined,
          phone: contact.phone || undefined,
          mobile: contact.mobile || undefined,
          workPhone: contact.workPhone || undefined,
          jobPosition: contact.jobPosition || undefined,
          image: contact.image || undefined,
        })),
      }}
      allCompanies={allCompanies.map((c) => ({
        id: c.id,
        name: c.name,
        logoUrl: c.logoUrl || null,
      }))}
      leads={leads.map((lead) => ({
        id: lead.id,
        title: lead.title,
        status: lead.status,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      }))}
      opportunities={opportunities.map((opp) => {
        // Calculate task status breakdown
        const statusBreakdown = {
          TODO: 0,
          IN_PROGRESS: 0,
          REVIEW: 0,
          DONE: 0,
        };

        opp.opportunityTasks.forEach((task) => {
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

        return {
          id: opp.id,
          title: opp.title,
          briefStatus: opp.briefStatus,
          valueEstimate: opp.valueEstimate,
          taskCount: opp._count.opportunityTasks,
          proposalCount: opp._count.proposals,
          taskStatusBreakdown: statusBreakdown,
          createdAt: opp.createdAt.toISOString(),
          updatedAt: opp.updatedAt.toISOString(),
        };
      })}
      proposals={proposals.map((proposal: any) => ({
        id: proposal.id,
        title: proposal.title,
        totalAmount: proposal.totalAmount,
        status: proposal.status,
        crmRecordId: proposal.crmRecordId || undefined,
        crmRecordTitle: proposal.crmRecord?.title || undefined,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
      }))}
      files={attachments.map((file) => ({
        id: file.id,
        filename: file.filename,
        url: file.url,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        taskId: file.opportunityTaskId || null,
        taskTitle: file.opportunityTask?.title || null,
        crmRecordId: file.crmRecordId || file.opportunityTask?.crmRecord.id || (file.companyId ? 'generic' : ''),
        crmRecordTitle: file.crmRecord?.title || file.opportunityTask?.crmRecord.title || (file.companyId ? 'Generic Company File' : ''),
        uploaderName: file.uploader.name || file.uploader.email,
        description: file.description || null,
        createdAt: file.createdAt.toISOString(),
      }))}
    />
  );
}





