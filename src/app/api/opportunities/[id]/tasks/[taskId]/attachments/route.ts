import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { uploadMedia, generateMediaPath, getFileSize, detectMimeType } from "@/lib/bunny";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id, taskId } = await params;

    // Verify the task exists and belongs to organization
    const task = await prisma.opportunityTask.findFirst({
      where: {
        id: taskId,
        crmRecordId: id,
        crmRecord: {
          organizationId: organization.id,
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
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
    const path = generateMediaPath(organization.id, file.name, "tasks");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = detectMimeType(file.name);
    const sizeBytes = getFileSize(buffer);

    const url = await uploadMedia({
      path,
      buffer,
      contentType: mimeType,
    });

    // Create attachment record
    const attachment = await prisma.opportunityAttachment.create({
      data: {
        organizationId: organization.id,
        uploadedByUserId: user.id,
        crmRecordId: id,
        opportunityTaskId: taskId,
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

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error: any) {
    console.error("Error uploading task attachment:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id, taskId } = await params;

    // Verify the task exists
    const task = await prisma.opportunityTask.findFirst({
      where: {
        id: taskId,
        crmRecordId: id,
        crmRecord: {
          organizationId: organization.id,
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Get all attachments for this task
    const attachments = await prisma.opportunityAttachment.findMany({
      where: {
        opportunityTaskId: taskId,
        organizationId: organization.id,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ attachments });
  } catch (error: any) {
    console.error("Error fetching task attachments:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}






