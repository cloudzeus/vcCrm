import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { InfluencerCalendar } from "@/components/calendar/influencer-calendar";
import { CalendarClient } from "@/components/calendar/calendar-client";

export default async function CalendarPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();

  // Fetch posts for the calendar
  const posts = await prisma.postSchedule.findMany({
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
          userId: true,
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  // Fetch all opportunity tasks (with or without due dates)
  const tasks = await prisma.opportunityTask.findMany({
    where: {
      crmRecord: {
        organizationId: organization.id,
      },
    },
    include: {
      crmRecord: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { dueDate: "asc" },
      { createdAt: "asc" },
    ],
  });

  // Transform posts for the calendar component
  const calendarPosts = posts.map((post) => ({
    id: post.id,
    campaignId: post.campaignId,
    influencerId: post.influencerId,
    platform: post.platform,
    contentType: post.contentType,
    scheduledAt: post.scheduledAt.toISOString(),
    status: post.status,
    caption: post.caption || undefined,
    campaign: post.campaign,
    influencer: {
      stageName: post.influencer.stageName || undefined,
      userId: post.influencer.userId,
      user: {
        name: post.influencer.user?.name || undefined,
        image: post.influencer.user?.image || undefined,
      },
    },
  }));

  // Transform tasks for the calendar component
  // Only include tasks that have a dueDate for calendar display
  // Tasks without dueDate will be filtered out but all tasks are fetched
  const calendarTasks = tasks
    .filter((task) => task.dueDate !== null)
    .map((task) => ({
      id: task.id,
      type: "task" as const,
      title: task.title,
      question: task.question,
      status: task.status,
      dueDate: task.dueDate!.toISOString(),
      opportunityId: task.crmRecordId,
      opportunityTitle: task.crmRecord.title,
      companyName: task.crmRecord.company.name,
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo.id,
            name: task.assignedTo.name,
            email: task.assignedTo.email,
          }
        : task.assignedToUser
        ? {
            id: task.assignedToUser.id,
            name: task.assignedToUser.name,
            email: task.assignedToUser.email,
          }
        : null,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-light tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Manage and schedule your influencer posts and opportunity tasks
        </p>
      </div>
      <CalendarClient initialPosts={calendarPosts} initialTasks={calendarTasks} />
    </div>
  );
}

