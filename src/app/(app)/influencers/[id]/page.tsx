import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { InfluencerDetailClient } from "@/components/influencers/influencer-detail-client";

export default async function InfluencerDetailPage({
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

  const [influencer, allInfluencers] = await Promise.all([
    prisma.influencerProfile.findUnique({
      where: {
        id,
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
        campaignAssignments: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        assignedTasks: {
          include: {
            campaign: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            dueDate: "asc",
          },
          take: 10,
        },
        posts: {
          orderBy: {
            scheduledAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            campaignAssignments: true,
            posts: true,
            assignedTasks: true,
          },
        },
      },
    }),
    prisma.influencerProfile.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  if (!influencer) {
    notFound();
  }

  return (
    <InfluencerDetailClient
      influencer={{
        id: influencer.id,
        userId: influencer.userId,
        stageName: influencer.stageName || "",
        bio: influencer.bio || "",
        fullName: influencer.fullName || "",
        dateOfBirth: influencer.dateOfBirth?.toISOString(),
        location: influencer.location || "",
        address: influencer.address || "",
        phone: influencer.phone || "",
        email: influencer.email || "",
        defaultCurrency: influencer.defaultCurrency,
        managerSharePercent: influencer.managerSharePercent || 0,
        portfolioUrl: influencer.portfolioUrl || "",
        profileImageUrl: influencer.profileImageUrl || "",
        coverImageUrl: influencer.coverImageUrl || "",
        niche: influencer.niche || "",
        availability: influencer.availability || "",
        notes: influencer.notes || "",
        instagramUrl: influencer.instagramUrl || "",
        tiktokUrl: influencer.tiktokUrl || "",
        youtubeUrl: influencer.youtubeUrl || "",
        twitterUrl: influencer.twitterUrl || "",
        facebookUrl: influencer.facebookUrl || "",
        linkedinUrl: influencer.linkedinUrl || "",
        platforms: influencer.platforms as any,
        languages: influencer.languages as any,
        collaborationTypes: influencer.collaborationTypes as any,
        rateCard: influencer.rateCard as any,
        userName: influencer.user.name || "",
        userEmail: influencer.user.email,
        userImage: influencer.user.image,
        campaignCount: influencer._count.campaignAssignments,
        postCount: influencer._count.posts,
        taskCount: influencer._count.assignedTasks,
        campaigns: influencer.campaignAssignments.map((ca) => ({
          id: ca.campaign.id,
          name: ca.campaign.name,
          status: ca.campaign.status,
          startDate: ca.campaign.startDate?.toISOString(),
          endDate: ca.campaign.endDate?.toISOString(),
        })),
        recentTasks: influencer.assignedTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          dueDate: t.dueDate?.toISOString(),
          campaignName: t.campaign.name,
        })),
        recentPosts: influencer.posts.map((p) => ({
          id: p.id,
          platform: p.platform,
          scheduledAt: p.scheduledAt.toISOString(),
          status: p.status,
        })),
      }}
      allInfluencers={allInfluencers.map((i) => ({
        id: i.id,
        stageName: i.stageName || "",
        userName: i.user.name || "",
        userImage: i.user.image,
      }))}
    />
  );
}







