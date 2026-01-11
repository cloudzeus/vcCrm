import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { BrandDetailClient } from "@/components/brands/brand-detail-client";

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();

  const [brand, allBrands, contacts, products] = await Promise.all([
    prisma.brand.findUnique({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        campaigns: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            campaigns: true,
            contacts: true,
            products: true,
          },
        },
      },
    }),
    prisma.brand.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.brandContact.findMany({
      where: {
        brandId: id,
      },
      orderBy: [
        { isPrimary: "desc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.brandProduct.findMany({
      where: {
        brandId: id,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  if (!brand) {
    notFound();
  }

  return (
    <BrandDetailClient
      brand={{
        id: brand.id,
        name: brand.name,
        website: brand.website || "",
        notes: brand.notes || "",
        logoUrl: brand.logoUrl || "",
        address: brand.address || "",
        city: brand.city || "",
        state: brand.state || "",
        country: brand.country || "",
        postalCode: brand.postalCode || "",
        instagramUrl: brand.instagramUrl || "",
        facebookUrl: brand.facebookUrl || "",
        twitterUrl: brand.twitterUrl || "",
        linkedinUrl: brand.linkedinUrl || "",
        youtubeUrl: brand.youtubeUrl || "",
        tiktokUrl: brand.tiktokUrl || "",
        campaignCount: brand._count.campaigns,
        contactCount: brand._count.contacts,
        productCount: brand._count.products,
        campaigns: brand.campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          startDate: c.startDate?.toISOString() || null,
          endDate: c.endDate?.toISOString() || null,
        })),
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email || "",
          phone: c.phone || "",
          role: c.role || "",
          department: c.department || "",
          isPrimary: c.isPrimary,
        })),
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          category: p.category || "",
          price: p.price || 0,
          currency: p.currency || "EUR",
        })),
      }}
      allBrands={allBrands}
    />
  );
}









