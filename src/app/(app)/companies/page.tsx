import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { CompaniesClient } from "@/components/companies/companies-client";

export default async function CompaniesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();

  const companies = await prisma.company.findMany({
    where: {
      organizationId: organization.id,
    },
    include: {
      _count: {
        select: {
          contacts: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <CompaniesClient
      initialCompanies={companies.map((c) => ({
        id: c.id,
        name: c.name,
        vatNumber: c.vatNumber || undefined,
        commercialTitle: c.commercialTitle || undefined,
        address: c.address || undefined,
        irsOffice: c.irsOffice || undefined,
        city: c.city || undefined,
        country: c.country || null,
        zip: c.zip || undefined,
        phone: c.phone || undefined,
        email: c.email || undefined,
        logoUrl: c.logoUrl || undefined,
        website: c.website || undefined,
        contactCount: c._count.contacts,
      }))}
    />
  );
}







