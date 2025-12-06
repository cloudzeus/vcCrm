import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { uploadMedia, generateMediaPath, getFileSize, detectMimeType } from "@/lib/bunny";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    // Verify the company exists
    const company = await prisma.company.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Upload file to BunnyCDN
    const path = generateMediaPath(organization.id, file.name, "companies");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = detectMimeType(file.name);
    const sizeBytes = getFileSize(buffer);

    const url = await uploadMedia({
      path,
      buffer,
      contentType: mimeType,
    });

    // Create attachment record as generic company file
    const attachment = await prisma.opportunityAttachment.create({
      data: {
        organizationId: organization.id,
        uploadedByUserId: user.id,
        companyId: id,
        filename: file.name,
        url,
        mimeType,
        sizeBytes,
        description: description || null,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("Error uploading company file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}



