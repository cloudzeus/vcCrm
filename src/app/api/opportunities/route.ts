import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Get all opportunities (CrmRecords with status OPPORTUNITY)
    const opportunities = await prisma.crmRecord.findMany({
      where: {
        organizationId: organization.id,
        status: "OPPORTUNITY",
        ...(status && status !== "all" ? { briefStatus: status } : {}),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
            proposals: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      opportunities: opportunities.map((opp) => {
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

        const completedTaskCount = statusBreakdown.DONE;

        return {
          id: opp.id,
          title: opp.title,
          description: opp.description,
          companyId: opp.companyId,
          companyName: opp.company.name,
          valueEstimate: opp.valueEstimate,
          expectedClose: opp.expectedClose,
          briefStatus: opp.briefStatus,
          needs: opp.needs,
          productServiceScope: opp.productServiceScope,
          customerInfo: opp.customerInfo,
          contacts: opp.contacts.map((cc) => ({
            id: cc.contact.id,
            name: cc.contact.name,
            email: cc.contact.email,
            role: cc.role,
          })),
          taskCount: opp._count.opportunityTasks,
          completedTaskCount,
          taskStatusBreakdown: statusBreakdown,
          proposalCount: opp._count.proposals,
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt,
        };
      }),
    });
  } catch (error: any) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}





