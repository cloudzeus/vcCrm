import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateOpportunitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  needs: z.string().optional().nullable(),
  productServiceScope: z.string().optional().nullable(),
  customerInfo: z.any().optional().nullable(),
  briefStatus: z.string().optional(),
  valueEstimate: z.number().optional().nullable(),
  expectedClose: z.string().datetime().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const opportunity = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
        status: "OPPORTUNITY",
      },
      include: {
        company: {
          include: {
            contacts: {
              orderBy: {
                name: "asc",
              },
            },
          },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
        opportunityTasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [
            { status: "asc" },
            { order: "asc" },
            { createdAt: "asc" },
          ],
        },
        proposals: {
          orderBy: {
            version: "desc",
          },
        },
        _count: {
          select: {
            opportunityTasks: true,
            proposals: true,
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    // Calculate completed tasks
    const completedTasks = opportunity.opportunityTasks.filter(
      (t) => t.status === "DONE"
    ).length;

    return NextResponse.json({
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        companyId: opportunity.companyId,
        company: {
          id: opportunity.company.id,
          name: opportunity.company.name,
          contacts: opportunity.company.contacts.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
          })),
        },
        contacts: opportunity.contacts.map((cc) => ({
          id: cc.contact.id,
          name: cc.contact.name,
          email: cc.contact.email,
          role: cc.role,
        })),
        valueEstimate: opportunity.valueEstimate,
        expectedClose: opportunity.expectedClose,
        briefStatus: opportunity.briefStatus,
        needs: opportunity.needs,
        productServiceScope: opportunity.productServiceScope,
        customerInfo: opportunity.customerInfo,
        tasks: opportunity.opportunityTasks,
        proposals: opportunity.proposals,
        taskCount: opportunity._count.opportunityTasks,
        completedTaskCount: completedTasks,
        proposalCount: opportunity._count.proposals,
        createdAt: opportunity.createdAt,
        updatedAt: opportunity.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching opportunity:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const body = await request.json();
    const validatedData = updateOpportunitySchema.parse(body);

    // Verify opportunity exists
    const existing = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
        status: "OPPORTUNITY",
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.needs !== undefined) updateData.needs = validatedData.needs;
    if (validatedData.productServiceScope !== undefined) updateData.productServiceScope = validatedData.productServiceScope;
    if (validatedData.customerInfo !== undefined) updateData.customerInfo = validatedData.customerInfo;
    if (validatedData.briefStatus !== undefined) updateData.briefStatus = validatedData.briefStatus;
    if (validatedData.valueEstimate !== undefined) updateData.valueEstimate = validatedData.valueEstimate;
    if (validatedData.expectedClose !== undefined) {
      updateData.expectedClose = validatedData.expectedClose ? new Date(validatedData.expectedClose) : null;
    }

    const opportunity = await prisma.crmRecord.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ opportunity });
  } catch (error: any) {
    console.error("Error updating opportunity:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}







