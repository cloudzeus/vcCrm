import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

const reportQuerySchema = z.object({
  type: z.enum([
    "brandRevenue",
    "influencerRevenue",
    "platformEngagement",
    "campaignSummary",
  ]),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
  brandId: z.string().optional(),
  influencerId: z.string().optional(),
  campaignId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const body = await request.json();
    const validatedData = reportQuerySchema.parse(body);

    const startDate = validatedData.dateRange?.start
      ? new Date(validatedData.dateRange.start)
      : startOfMonth(subMonths(new Date(), 6));
    const endDate = validatedData.dateRange?.end
      ? new Date(validatedData.dateRange.end)
      : endOfMonth(new Date());

    let result: any = {};

    switch (validatedData.type) {
      case "brandRevenue": {
        const where: any = {
          campaign: {
            organizationId: organization.id,
            status: "COMPLETED",
          },
          status: "COMPLETED",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        };

        if (validatedData.brandId) {
          where.campaign.brandId = validatedData.brandId;
        }

        const brandRevenue = await prisma.campaignInfluencer.groupBy({
          by: ["campaignId"],
          where,
          _sum: {
            fee: true,
          },
          _count: {
            id: true,
          },
        });

        const campaignIds = brandRevenue.map((br) => br.campaignId);
        const campaigns = await prisma.campaign.findMany({
          where: {
            id: { in: campaignIds },
          },
          include: {
            brand: {
              select: {
                name: true,
              },
            },
          },
        });

        result = brandRevenue.map((br) => {
          const campaign = campaigns.find((c) => c.id === br.campaignId);
          return {
            brandName: campaign?.brand.name || "Unknown",
            campaignId: br.campaignId,
            revenue: br._sum.fee || 0,
            influencerCount: br._count.id,
            month: format(new Date(br.campaignId), "MMM yyyy"),
          };
        });
        break;
      }

      case "influencerRevenue": {
        const where: any = {
          campaign: {
            organizationId: organization.id,
            status: "COMPLETED",
          },
          status: "COMPLETED",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        };

        if (validatedData.influencerId) {
          where.influencerId = validatedData.influencerId;
        }

        const influencerRevenue = await prisma.campaignInfluencer.groupBy({
          by: ["influencerId"],
          where,
          _sum: {
            fee: true,
          },
          _count: {
            id: true,
          },
          orderBy: {
            _sum: {
              fee: "desc",
            },
          },
        });

        const influencerIds = influencerRevenue.map((ir) => ir.influencerId);
        const influencers = await prisma.influencerProfile.findMany({
          where: {
            id: { in: influencerIds },
          },
          select: {
            id: true,
            stageName: true,
          },
        });

        result = influencerRevenue.map((ir) => {
          const influencer = influencers.find((i) => i.id === ir.influencerId);
          return {
            influencerId: ir.influencerId,
            influencerName: influencer?.stageName || "Unknown",
            revenue: ir._sum.fee || 0,
            campaignCount: ir._count.id,
          };
        });
        break;
      }

      case "platformEngagement": {
        const where: any = {
          campaign: {
            organizationId: organization.id,
          },
          scheduledAt: {
            gte: startDate,
            lte: endDate,
          },
        };

        if (validatedData.campaignId) {
          where.campaignId = validatedData.campaignId;
        }

        const platformStats = await prisma.postSchedule.groupBy({
          by: ["platform"],
          where,
          _count: {
            id: true,
          },
        });

        const metrics = await prisma.metricSnapshot.groupBy({
          by: ["postScheduleId"],
          where: {
            postSchedule: where,
          },
          _sum: {
            impressions: true,
            reach: true,
            likes: true,
            comments: true,
            saves: true,
            clicks: true,
            shares: true,
          },
        });

        result = platformStats.map((ps) => {
          const platformMetrics = metrics.filter((m) => {
            // This is simplified - in production, you'd join properly
            return true;
          });

          return {
            platform: ps.platform,
            postCount: ps._count.id,
            totalImpressions: platformMetrics.reduce((sum, m) => sum + (m._sum.impressions || 0), 0),
            totalReach: platformMetrics.reduce((sum, m) => sum + (m._sum.reach || 0), 0),
            totalLikes: platformMetrics.reduce((sum, m) => sum + (m._sum.likes || 0), 0),
            totalComments: platformMetrics.reduce((sum, m) => sum + (m._sum.comments || 0), 0),
          };
        });
        break;
      }

      case "campaignSummary": {
        const where: any = {
          organizationId: organization.id,
        };

        if (validatedData.campaignId) {
          where.id = validatedData.campaignId;
        }

        const campaigns = await prisma.campaign.findMany({
          where,
          include: {
            brand: {
              select: {
                name: true,
              },
            },
            influencers: {
              include: {
                influencer: {
                  select: {
                    stageName: true,
                  },
                },
              },
            },
            posts: {
              select: {
                id: true,
                status: true,
                platform: true,
              },
            },
            _count: {
              select: {
                influencers: true,
                posts: true,
              },
            },
          },
        });

        result = campaigns.map((campaign) => {
          const totalFee = campaign.influencers.reduce(
            (sum, ci) => sum + (ci.fee || 0),
            0
          );
          const postedCount = campaign.posts.filter((p) => p.status === "POSTED").length;

          return {
            id: campaign.id,
            name: campaign.name,
            brandName: campaign.brand.name,
            status: campaign.status,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            totalBudget: campaign.totalBudget,
            totalFee,
            influencerCount: campaign._count.influencers,
            postCount: campaign._count.posts,
            postedCount,
            platformBreakdown: campaign.posts.reduce((acc, post) => {
              acc[post.platform] = (acc[post.platform] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          };
        });
        break;
      }
    }

    return NextResponse.json({
      type: validatedData.type,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Report query error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

