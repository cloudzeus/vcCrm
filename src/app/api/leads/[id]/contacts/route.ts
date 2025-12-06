import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const addContactSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
  role: z.string().optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const body = await request.json();
    const validatedData = addContactSchema.parse(body);

    // Verify the lead exists and belongs to organization
    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!crmRecord) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Verify the contact exists and belongs to organization
    const contact = await prisma.contact.findFirst({
      where: {
        id: validatedData.contactId,
        organizationId: organization.id,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Check if contact is already associated with this lead
    const existing = await prisma.crmRecordContact.findUnique({
      where: {
        crmRecordId_contactId: {
          crmRecordId: id,
          contactId: validatedData.contactId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Contact is already associated with this lead" },
        { status: 400 }
      );
    }

    // Create the association
    await prisma.crmRecordContact.create({
      data: {
        crmRecordId: id,
        contactId: validatedData.contactId,
        role: validatedData.role || null,
      },
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
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error adding contact to lead:", error);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Verify the lead exists and belongs to organization
    const crmRecord = await prisma.crmRecord.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!crmRecord) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Remove the association
    await prisma.crmRecordContact.delete({
      where: {
        crmRecordId_contactId: {
          crmRecordId: id,
          contactId: contactId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing contact from lead:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}





