import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { CampaignsClient } from "@/components/campaigns/campaigns-client";

export default async function CampaignsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();

  const [campaigns, brands] = await Promise.all([
    prisma.campaign.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        brand: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            influencers: true,
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.brand.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return (
    <CampaignsClient
      initialCampaigns={campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        brandId: c.brandId,
        brandName: c.brand.name,
        status: c.status,
        startDate: c.startDate?.toISOString(),
        endDate: c.endDate?.toISOString(),
        totalBudget: c.totalBudget,
        influencerCount: c._count.influencers,
        postCount: c._count.posts,
      }))}
      brands={brands}
    />
  );
}

