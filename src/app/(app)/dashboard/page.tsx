import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { startOfWeek, endOfWeek, addWeeks, isAfter } from "date-fns";

// Server-side caching: revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();

  // For SUPERADMIN without org, we'll get the first org or handle gracefully
  let organization;
  try {
    organization = await getOrganizationOrThrow();
  } catch (error) {
    // If no organization found, redirect to a setup page or show empty state
    if (user.role === "SUPERADMIN") {
      // SUPERADMIN can still access dashboard but with limited data
      organization = null;
    } else {
      throw error;
    }
  }

  if (!organization) {
    // Show empty state for SUPERADMIN without org
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-light tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            No organization found. Please create an organization first.
          </p>
        </div>
      </div>
    );
  }

  // Fetch dashboard data
  const [
    activeCampaigns,
    scheduledPostsThisWeek,
    totalRevenue,
    topInfluencers,
    recentActivity,
    revenueData,
    upcomingPosts,
    totalLeads,
    totalOpportunities,
    totalTasks,
    completedTasks,
    recentLeads,
    recentOpportunities,
    recentTasks,
    recentCustomers,
    recentSuppliers,
    recentContacts,
    allTasksForStatus,
    recentUsers,
  ] = await Promise.all([
    // Active campaigns count
    prisma.campaign.count({
      where: {
        organizationId: organization.id,
        status: "ACTIVE",
      },
    }),
    // Scheduled posts this week
    prisma.postSchedule.count({
      where: {
        campaign: {
          organizationId: organization.id,
        },
        scheduledAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())),
          lte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 7)),
        },
      },
    }),
    // Total revenue (sum of campaign influencer fees)
    prisma.campaignInfluencer.aggregate({
      where: {
        campaign: {
          organizationId: organization.id,
          status: "COMPLETED",
        },
        status: "COMPLETED",
      },
      _sum: {
        fee: true,
      },
    }),
    // Top influencers by revenue
    prisma.campaignInfluencer.groupBy({
      by: ["influencerId"],
      where: {
        campaign: {
          organizationId: organization.id,
          status: "COMPLETED",
        },
        status: "COMPLETED",
      },
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
      take: 5,
    }),
    // Recent activity (recent posts)
    prisma.postSchedule.findMany({
      where: {
        campaign: {
          organizationId: organization.id,
        },
      },
      include: {
        campaign: {
          select: {
            name: true,
          },
        },
        influencer: {
          select: {
            stageName: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
    // Revenue over time (last 6 months)
    prisma.campaignInfluencer.findMany({
      where: {
        campaign: {
          organizationId: organization.id,
          status: "COMPLETED",
        },
        status: "COMPLETED",
      },
      select: {
        fee: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    // Upcoming posts - get all future posts (client will filter by week/month)
    prisma.postSchedule.findMany({
      where: {
        campaign: {
          organizationId: organization.id,
        },
        scheduledAt: {
          gte: new Date(),
        },
      },
      include: {
        campaign: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
      take: 50,
    }),
    // Total leads count
    prisma.crmRecord.count({
      where: {
        organizationId: organization.id,
        status: "LEAD",
      },
    }),
    // Total opportunities count
    prisma.crmRecord.count({
      where: {
        organizationId: organization.id,
        status: "OPPORTUNITY",
      },
    }),
    // Total tasks count
    prisma.opportunityTask.count({
      where: {
        crmRecord: {
          organizationId: organization.id,
        },
      },
    }),
    // Completed tasks count
    prisma.opportunityTask.count({
      where: {
        crmRecord: {
          organizationId: organization.id,
        },
        status: "DONE",
      },
    }),
    // Recent leads
    prisma.crmRecord.findMany({
      where: {
        organizationId: organization.id,
        status: "LEAD",
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    // Recent opportunities
    prisma.crmRecord.findMany({
      where: {
        organizationId: organization.id,
        status: "OPPORTUNITY",
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        opportunityTasks: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            opportunityTasks: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    }),
    // Recent tasks (last 20)
    prisma.opportunityTask.findMany({
      where: {
        crmRecord: {
          organizationId: organization.id,
        },
      },
      include: {
        assignedTo: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    }),
    // Task status counts - get all tasks and count manually for better reliability
    // Use the same query pattern as recentTasks but without limit
    prisma.opportunityTask.findMany({
      where: {
        crmRecord: {
          organizationId: organization.id,
        },
      },
      select: {
        status: true,
      },
      // No limit - get all tasks for accurate counting
    }),
    // Recent customers - fetch first 4 Company records (filter empty names in JavaScript)
    prisma.company.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        logoUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
    }),
    // Recent suppliers
    prisma.supplier.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        logoUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    // Recent contacts
    prisma.contact.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        image: true,
        company: {
          select: {
            name: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
    // Recent users (created or updated)
    prisma.user.findMany({
      where: {
        OR: [
          { organizationId: organization.id },
          { role: "SUPERADMIN" }, // Include SUPERADMIN users
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    }),
  ]);

  // Get influencer details for top influencers
  const influencerIds = topInfluencers.map((t) => t.influencerId);
  const influencers = await prisma.influencerProfile.findMany({
    where: {
      id: { in: influencerIds },
    },
    select: {
      id: true,
      stageName: true,
    },
  });

  const topInfluencersWithDetails = topInfluencers.map((t) => {
    const influencer = influencers.find((i) => i.id === t.influencerId);
    return {
      id: t.influencerId,
      name: influencer?.stageName || "Unknown",
      revenue: t._sum.fee || 0,
      campaigns: t._count.id,
    };
  });

  // Fetch tasks grouped by user for Tasks per User chart
  // First, get all tasks assigned to users (including SUPERADMIN)
  const tasksWithUsers = await prisma.opportunityTask.findMany({
    where: {
      crmRecord: {
        organizationId: organization.id,
      },
      assignedToUserId: {
        not: null,
      },
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true,
        },
      },
    },
  });

  // Group tasks by user and count - include all users including SUPERADMIN
  const tasksPerUserMap = tasksWithUsers.reduce((acc, task) => {
    if (task.assignedToUser) {
      const userId = task.assignedToUser.id;
      const userName = task.assignedToUser.name || task.assignedToUser.email?.split('@')[0] || 'Unknown';
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName,
          taskCount: 0,
        };
      }
      acc[userId].taskCount++;
    }
    return acc;
  }, {} as Record<string, { userId: string; userName: string; taskCount: number }>);

  const tasksPerUserData = Object.values(tasksPerUserMap)
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 10) // Top 10 users by task count
    .map((user) => ({
      user: user.userName,
      tasks: user.taskCount,
    }));

  // Calculate completed tasks and status breakdown for each opportunity
  const opportunitiesWithTaskCounts = recentOpportunities.map((opp) => {
    // Calculate task status breakdown
    const statusBreakdown = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
    };

    opp.opportunityTasks.forEach((task) => {
      const taskStatus = task.status.toUpperCase();
      if (taskStatus === "TODO") {
        statusBreakdown.TODO++;
      } else if (taskStatus === "IN_PROGRESS") {
        statusBreakdown.IN_PROGRESS++;
      } else if (taskStatus === "REVIEW") {
        statusBreakdown.REVIEW++;
      } else if (taskStatus === "DONE") {
        statusBreakdown.DONE++;
      }
    });

    return {
      id: opp.id,
      title: opp.title,
      companyName: opp.company.name,
      taskCount: opp._count.opportunityTasks,
      completedTaskCount: statusBreakdown.DONE,
      taskStatusBreakdown: statusBreakdown,
      briefStatus: opp.briefStatus,
      createdAt: opp.createdAt,
    };
  });

  return (
    <DashboardClient
      activeCampaigns={activeCampaigns}
      scheduledPostsThisWeek={scheduledPostsThisWeek}
      totalRevenue={totalRevenue._sum.fee || 0}
      topInfluencers={topInfluencersWithDetails}
      recentActivity={(() => {
        // Combine all activities: posts, contacts, tasks
        const postActivities = recentActivity.map((a) => ({
          id: `post-${a.id}`,
          type: "post",
          title: a.campaign.name,
          description: `Post scheduled for ${a.influencer?.stageName || "Influencer"}`,
          date: a.createdAt,
          user: a.creator ? {
            name: a.creator.name || a.creator.email?.split('@')[0] || "User",
            email: a.creator.email,
            image: a.creator.image,
          } : null,
        }));

        const contactActivities = recentContacts.map((contact: any) => ({
          id: `contact-${contact.id}`,
          type: "contact",
          title: `${contact.name} ${contact.lastName || ""}`.trim(),
          description: contact.company?.name || contact.supplier?.name || "Contact created",
          date: contact.createdAt,
          user: null, // Contact doesn't have creator field
        }));

        const taskActivities = recentTasks.map((task: any) => ({
          id: `task-${task.id}`,
          type: "task",
          title: task.title,
          description: `Task created - ${task.status.toLowerCase()}${task.assignedTo?.name ? ` - Assigned to ${task.assignedTo.name}` : ""}`,
          date: task.createdAt,
          user: null, // Task doesn't have creator field
        }));

        const roleLabels: Record<string, string> = {
          SUPERADMIN: "Super Admin",
          OWNER: "Owner",
          MANAGER: "Manager",
          INFLUENCER: "Influencer",
          CLIENT: "Client",
        };

        const userActivities = recentUsers.flatMap((user) => {
          const activities = [];
          const createdAt = new Date(user.createdAt);
          const updatedAt = new Date(user.updatedAt);
          const timeDiff = updatedAt.getTime() - createdAt.getTime();
          const isNew = timeDiff < 5000; // Less than 5 seconds difference = creation

          // Add creation activity if user was created recently
          if (isNew) {
            activities.push({
              id: `user-create-${user.id}`,
              type: "user",
              title: user.name || user.email,
              description: `User created - ${roleLabels[user.role] || user.role}`,
              date: createdAt,
              user: null,
            });
          } else {
            // Add update activity if user was updated recently (and it's not just creation)
            const hoursSinceCreation = timeDiff / (1000 * 60 * 60);
            if (hoursSinceCreation > 1) { // Only show as update if it's been more than 1 hour since creation
              activities.push({
                id: `user-update-${user.id}-${updatedAt.getTime()}`,
                type: "user",
                title: user.name || user.email,
                description: `User updated - ${roleLabels[user.role] || user.role}`,
                date: updatedAt,
                user: null,
              });
            }
          }
          return activities;
        });

        // Combine and sort by date (newest first)
        const allActivities = [...postActivities, ...contactActivities, ...taskActivities, ...userActivities]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 15); // Get top 15 most recent

        return allActivities;
      })()}
      tasksPerUserData={tasksPerUserData}
      upcomingPosts={upcomingPosts.map((post) => ({
        id: post.id,
        scheduledAt: post.scheduledAt,
        platform: post.platform,
        campaign: post.campaign,
      }))}
      totalLeads={totalLeads}
      totalOpportunities={totalOpportunities}
      totalTasks={totalTasks}
      completedTasks={completedTasks}
      recentLeads={recentLeads.map((lead) => ({
        id: lead.id,
        title: lead.title,
        companyName: lead.company.name,
        status: lead.status,
        createdAt: lead.createdAt,
      }))}
      recentOpportunities={opportunitiesWithTaskCounts}
      recentTasks={recentTasks.map((task) => ({
        id: task.id,
        title: task.title,
        question: task.question,
        status: task.status,
        assignedToName: task.assignedTo?.name || null,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        crmRecordId: task.crmRecordId,
        priority: task.priority,
        description: task.description,
      }))}
      recentCustomers={(recentCustomers || [])
        .filter((customer: any) => customer.name && customer.name.trim() !== "")
        .map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          city: customer.city,
          logoUrl: customer.logoUrl,
          createdAt: customer.createdAt,
        }))}
      recentSuppliers={(recentSuppliers || []).map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        city: supplier.city,
        logoUrl: supplier.logoUrl,
        createdAt: supplier.createdAt,
      }))}
      recentContacts={(recentContacts || []).map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        image: contact.image,
        companyName: contact.company?.name || contact.supplier?.name || null,
        createdAt: contact.createdAt,
      }))}
      taskStatusData={(() => {
        // Count tasks by status - use recentTasks since we know it works
        const statusMap: Record<string, number> = {
          TODO: 0,
          IN_PROGRESS: 0,
          REVIEW: 0,
          DONE: 0,
        };

        // Use recentTasks which we know has data, or allTasksForStatus if available
        const tasksToCount = (recentTasks && recentTasks.length > 0)
          ? recentTasks.map((t: any) => ({ status: t.status }))
          : (allTasksForStatus || []);

        (tasksToCount || []).forEach((task: any) => {
          // Get status value - handle both string and enum
          const rawStatus = task.status;
          const status = String(rawStatus || '').toUpperCase().trim();

          // Map status values - handle exact matches
          if (status === 'TODO') {
            statusMap['TODO']++;
          } else if (status === 'IN_PROGRESS' || status === 'IN PROGRESS') {
            statusMap['IN_PROGRESS']++;
          } else if (status === 'REVIEW') {
            statusMap['REVIEW']++;
          } else if (status === 'DONE') {
            statusMap['DONE']++;
          }
        });

        const data = [
          {
            name: "To Do",
            value: statusMap["TODO"],
            color: "#E9D8C8",
          },
          {
            name: "In Progress",
            value: statusMap["IN_PROGRESS"],
            color: "#85A3B2",
          },
          {
            name: "Review",
            value: statusMap["REVIEW"],
            color: "#732553",
          },
          {
            name: "Done",
            value: statusMap["DONE"],
            color: "#85A3B2",
          },
        ];

        return data.filter((item) => item.value > 0);
      })()}
    />
  );
}

