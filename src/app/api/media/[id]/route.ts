import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { deleteMedia } from "@/lib/bunny";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const mediaAsset = await prisma.mediaAsset.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!mediaAsset) {
      return NextResponse.json(
        { error: "Media asset not found" },
        { status: 404 }
      );
    }

    // Extract path from URL for deletion
    const url = new URL(mediaAsset.url);
    const path = url.pathname.substring(1); // Remove leading slash

    try {
      await deleteMedia({ path });
    } catch (error) {
      console.error("Failed to delete from BunnyCDN:", error);
      // Continue with database deletion even if CDN deletion fails
    }

    await prisma.mediaAsset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

