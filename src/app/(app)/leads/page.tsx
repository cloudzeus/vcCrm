import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { LeadsClient } from "@/components/leads/leads-client";
import type { Lead } from "@/lib/types/crm";

export default async function LeadsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();

  const [crmRecords, companies] = await Promise.all([
    prisma.crmRecord.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        company: {
          select: {
            name: true,
            address: true,
            city: true,
            phone: true,
            email: true,
            website: true,
          },
        },
        _count: {
          select: {
            contacts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
  ]);

  const leads: Lead[] = crmRecords.map((record) => ({
    id: record.id,
    title: record.title,
    description: record.description || undefined,
    status: record.status,
    companyId: record.companyId,
    companyName: record.company.name,
    valueEstimate: record.valueEstimate || undefined,
    expectedClose: record.expectedClose || undefined,
    outcome: record.outcome || undefined,
    closedAt: record.closedAt || undefined,
    contactCount: record._count.contacts,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    companyDetails: {
      address: record.company.address || undefined,
      city: record.company.city || undefined,
      phone: record.company.phone || undefined,
      email: record.company.email || undefined,
      website: record.company.website || undefined,
    },
  } as Lead & { companyDetails?: any }));

  return (
    <LeadsClient
      initialLeads={leads}
      companies={companies}
      currentUserId={user.id}
      currentUserName={user.name || undefined}
    />
  );
}

