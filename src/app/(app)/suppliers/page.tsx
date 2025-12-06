import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { SuppliersClient } from "@/components/suppliers/suppliers-client";

export default async function SuppliersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();

  const suppliers = await prisma.supplier.findMany({
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
    <SuppliersClient
      initialSuppliers={suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        vatNumber: s.vatNumber || undefined,
        commercialTitle: s.commercialTitle || undefined,
        address: s.address || undefined,
        irsOffice: s.irsOffice || undefined,
        city: s.city || undefined,
        country: s.country || null,
        zip: s.zip || undefined,
        phone: s.phone || undefined,
        email: s.email || undefined,
        logoUrl: s.logoUrl || undefined,
        website: s.website || undefined,
        contactCount: s._count.contacts,
      }))}
    />
  );
}

