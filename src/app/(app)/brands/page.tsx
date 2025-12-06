import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { BrandsClient } from "@/components/brands/brands-client";

export default async function BrandsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();

  const brands = await prisma.brand.findMany({
    where: {
      organizationId: organization.id,
    },
    include: {
      _count: {
        select: {
          campaigns: true,
          contacts: true,
          products: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <BrandsClient
      initialBrands={brands.map((b) => ({
        id: b.id,
        name: b.name,
        website: b.website || "",
        notes: b.notes || "",
        logoUrl: b.logoUrl || "",
        address: b.address || "",
        city: b.city || "",
        state: b.state || "",
        country: b.country || "",
        postalCode: b.postalCode || "",
        instagramUrl: b.instagramUrl || "",
        facebookUrl: b.facebookUrl || "",
        twitterUrl: b.twitterUrl || "",
        linkedinUrl: b.linkedinUrl || "",
        youtubeUrl: b.youtubeUrl || "",
        tiktokUrl: b.tiktokUrl || "",
        campaignCount: b._count.campaigns,
        contactCount: b._count.contacts,
        productCount: b._count.products,
      }))}
    />
  );
}

