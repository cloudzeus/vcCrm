import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";
import { CrmStatus, Prisma } from "@prisma/client";

const leadSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(CrmStatus).optional(),
  companyId: z.string().min(1, "Company is required").optional(),
  valueEstimate: z.number().optional().nullable(),
  expectedClose: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
                phone: true,
                jobPosition: true,
              },
            },
          },
        },
      },
    });

    if (!crmRecord) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: crmRecord.id,
      title: crmRecord.title,
      description: crmRecord.description || "",
      status: crmRecord.status,
      companyId: crmRecord.companyId,
      companyName: crmRecord.company.name,
      companyLogoUrl: crmRecord.company.logoUrl || undefined,
      valueEstimate: crmRecord.valueEstimate || undefined,
      expectedClose: crmRecord.expectedClose?.toISOString() || undefined,
      outcome: crmRecord.outcome || "",
      closedAt: crmRecord.closedAt?.toISOString() || undefined,
      contacts: crmRecord.contacts.map((crc) => ({
        id: crc.contact.id,
        name: crc.contact.name,
        lastName: crc.contact.lastName || "",
        email: crc.contact.email || "",
        phone: crc.contact.phone || "",
        jobPosition: crc.contact.jobPosition || "",
        role: crc.role || "",
      })),
      createdAt: crmRecord.createdAt.toISOString(),
      updatedAt: crmRecord.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const validatedData = leadSchema.parse(body);

    // Verify lead belongs to organization
    const existingRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // If companyId is being updated, verify it belongs to organization
    if (validatedData.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: validatedData.companyId,
          organizationId: organization.id,
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }
    }

    // Auto-set closedAt if status is WON or LOST
    const updateData: Prisma.CrmRecordUpdateInput = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description || null;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      if (validatedData.status === "WON" || validatedData.status === "LOST") {
        updateData.closedAt = new Date();
      } else if (existingRecord.closedAt) {
        updateData.closedAt = null;
      }
    }
    if (validatedData.companyId !== undefined)
      updateData.company = { connect: { id: validatedData.companyId } };
    if (validatedData.valueEstimate !== undefined)
      updateData.valueEstimate = validatedData.valueEstimate || null;
    if (validatedData.expectedClose !== undefined)
      updateData.expectedClose = validatedData.expectedClose
        ? new Date(validatedData.expectedClose + "T00:00:00")
        : null;
    if (validatedData.outcome !== undefined)
      updateData.outcome = validatedData.outcome || null;

    const crmRecord = await prisma.crmRecord.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            name: true,
            address: true,
            city: true,
            phone: true,
            email: true,
            website: true,
          },
        },
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: crmRecord.id,
      title: crmRecord.title,
      description: crmRecord.description || "",
      status: crmRecord.status,
      companyId: crmRecord.companyId,
      companyName: crmRecord.company.name,
      valueEstimate: crmRecord.valueEstimate || undefined,
      expectedClose: crmRecord.expectedClose?.toISOString() || undefined,
      outcome: crmRecord.outcome || "",
      closedAt: crmRecord.closedAt?.toISOString() || undefined,
      contactCount: crmRecord._count.contacts,
      createdAt: crmRecord.createdAt.toISOString(),
      updatedAt: crmRecord.updatedAt.toISOString(),
      companyDetails: {
        address: crmRecord.company.address || undefined,
        city: crmRecord.company.city || undefined,
        phone: crmRecord.company.phone || undefined,
        email: crmRecord.company.email || undefined,
        website: crmRecord.company.website || undefined,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Lead update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!crmRecord) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.crmRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

