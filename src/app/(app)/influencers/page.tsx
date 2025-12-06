import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { InfluencersClient } from "@/components/influencers/influencers-client";

export default async function InfluencersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();

  const influencers = await prisma.influencerProfile.findMany({
    where: {
      organizationId: organization.id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          campaignAssignments: true,
          posts: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <InfluencersClient
      initialInfluencers={influencers.map((i) => ({
        id: i.id,
        userId: i.userId,
        stageName: i.stageName || "",
        bio: i.bio || "",
        defaultCurrency: i.defaultCurrency,
        managerSharePercent: i.managerSharePercent || 0,
        userName: i.user.name || "",
        userEmail: i.user.email,
        userImage: i.user.image,
        campaignCount: i._count.campaignAssignments,
        postCount: i._count.posts,
      }))}
    />
  );
}

