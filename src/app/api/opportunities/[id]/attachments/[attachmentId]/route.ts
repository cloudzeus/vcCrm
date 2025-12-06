import { NextResponse } from "next/server";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { deleteMedia } from "@/lib/bunny";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id, attachmentId } = await params;

    // Verify the attachment exists and belongs to organization
    const attachment = await prisma.opportunityAttachment.findFirst({
      where: {
        id: attachmentId,
        crmRecordId: id,
        organizationId: organization.id,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Extract path from URL for deletion
    const url = new URL(attachment.url);
    const path = url.pathname.substring(1); // Remove leading slash

    try {
      await deleteMedia({ path });
    } catch (error) {
      console.warn("Failed to delete file from BunnyCDN:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete attachment record
    await prisma.opportunityAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}






