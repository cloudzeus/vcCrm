import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";
import { CrmStatus, Prisma } from "@prisma/client";

const leadSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  status: z.nativeEnum(CrmStatus),
  companyId: z.string().min(1, "Company is required"),
  valueEstimate: z.number().optional().nullable(),
  expectedClose: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const body = await request.json();
    const validatedData = leadSchema.parse(body);

    // Verify company belongs to organization
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

    const crmRecord = await prisma.crmRecord.create({
      data: {
        organizationId: organization.id,
        companyId: validatedData.companyId,
        title: validatedData.title,
        description: validatedData.description || null,
        status: validatedData.status,
        valueEstimate: validatedData.valueEstimate || null,
        expectedClose: validatedData.expectedClose
          ? new Date(validatedData.expectedClose + "T00:00:00")
          : null,
        outcome: validatedData.outcome || null,
      },
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
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                lastName: true,
              },
            },
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

    console.error("Lead creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.CrmRecordWhereInput = {
      organizationId: organization.id,
    };

    if (status && status !== "all" && Object.values(CrmStatus).includes(status as CrmStatus)) {
      where.status = status as CrmStatus;
    }

    const crmRecords = await prisma.crmRecord.findMany({
      where,
      include: {
        company: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            contacts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      crmRecords.map((record) => ({
        id: record.id,
        title: record.title,
        description: record.description || "",
        status: record.status,
        companyId: record.companyId,
        companyName: record.company.name,
        valueEstimate: record.valueEstimate || undefined,
        expectedClose: record.expectedClose?.toISOString() || undefined,
        outcome: record.outcome || "",
        closedAt: record.closedAt?.toISOString() || undefined,
        contactCount: record._count.contacts,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

