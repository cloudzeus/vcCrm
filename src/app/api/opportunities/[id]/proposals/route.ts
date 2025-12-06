import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProposalSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  scope: z.string().optional().nullable(),
  deliverables: z.string().optional().nullable(),
  pricing: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  status: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    // Verify opportunity exists
    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
        status: "OPPORTUNITY",
      },
    });

    if (!crmRecord) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    const proposals = await prisma.proposal.findMany({
      where: {
        crmRecordId: id,
      },
      orderBy: {
        version: "desc",
      },
    });

    return NextResponse.json({ proposals });
  } catch (error: any) {
    console.error("Error fetching proposals:", error);
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
    const { proposalId, ...validatedData } = updateProposalSchema.parse(body);

    if (!proposalId) {
      return NextResponse.json(
        { error: "Proposal ID is required" },
        { status: 400 }
      );
    }

    // Verify proposal exists and belongs to opportunity
    const existing = await prisma.proposal.findFirst({
      where: {
        id: proposalId,
        crmRecordId: id,
        crmRecord: {
          organizationId: organization.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.scope !== undefined) updateData.scope = validatedData.scope;
    if (validatedData.deliverables !== undefined) updateData.deliverables = validatedData.deliverables;
    if (validatedData.pricing !== undefined) updateData.pricing = validatedData.pricing;
    if (validatedData.timeline !== undefined) updateData.timeline = validatedData.timeline;
    if (validatedData.terms !== undefined) updateData.terms = validatedData.terms;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      if (validatedData.status === "SENT" && !existing.sentAt) {
        updateData.sentAt = new Date();
      }
      if (validatedData.status === "REVIEW" && !existing.reviewedAt) {
        updateData.reviewedBy = user.id;
        updateData.reviewedAt = new Date();
      }
    }

    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: updateData,
    });

    return NextResponse.json({ proposal });
  } catch (error: any) {
    console.error("Error updating proposal:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}





