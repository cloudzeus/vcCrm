import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { ContactsClient } from "@/components/contacts/contacts-client";

export default async function ContactsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();

  const [contacts, companies, suppliers] = await Promise.all([
    prisma.contact.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
            city: true,
            phone: true,
            email: true,
            website: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
            city: true,
            phone: true,
            email: true,
            website: true,
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
    prisma.supplier.findMany({
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

  return (
    <ContactsClient
      initialContacts={contacts.map((c) => ({
        id: c.id,
        name: c.name,
        lastName: c.lastName || undefined,
        companyId: c.companyId || undefined,
        supplierId: c.supplierId || undefined,
        company: c.company ? {
          id: c.company.id,
          name: c.company.name,
          logoUrl: c.company.logoUrl || undefined,
          address: c.company.address || undefined,
          city: c.company.city || undefined,
          phone: c.company.phone || undefined,
          email: c.company.email || undefined,
          website: c.company.website || undefined,
        } : c.supplier ? {
          id: c.supplier.id,
          name: c.supplier.name,
          logoUrl: c.supplier.logoUrl || undefined,
          address: c.supplier.address || undefined,
          city: c.supplier.city || undefined,
          phone: c.supplier.phone || undefined,
          email: c.supplier.email || undefined,
          website: c.supplier.website || undefined,
        } : null,
        jobPosition: c.jobPosition || undefined,
        notes: c.notes || undefined,
        address: c.address || undefined,
        city: c.city || undefined,
        zip: c.zip || undefined,
        country: c.country || null,
        image: c.image || undefined,
        email: c.email || undefined,
        phone: c.phone || undefined,
        mobile: c.mobile || undefined,
        workPhone: c.workPhone || undefined,
        gender: c.gender || null,
        birthday: c.birthday ? c.birthday.toISOString() : null,
      }))}
      companies={companies}
      suppliers={suppliers}
    />
  );
}

