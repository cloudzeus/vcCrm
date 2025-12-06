import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow, requireRole } from "@/lib/auth-helpers";
import { sendInviteEmail } from "@/lib/mailer";
type UserRole = "SUPERADMIN" | "OWNER" | "MANAGER" | "INFLUENCER" | "CLIENT";
import { z } from "zod";
import { randomBytes } from "crypto";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "MANAGER", "INFLUENCER", "CLIENT"]),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    // Only OWNER and MANAGER can invite users
    requireRole({ role: user.role }, ["OWNER", "MANAGER", "SUPERADMIN"]);

    const body = await request.json();
    const validatedData = inviteSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate invite token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invite token
    const inviteToken = await prisma.inviteToken.create({
      data: {
        organizationId: organization.id,
        email: validatedData.email,
        token,
        role: validatedData.role,
        expiresAt,
      },
    });

    // Send invitation email
    try {
      await sendInviteEmail({
        email: validatedData.email,
        organizationName: organization.name,
        inviterName: user.name || "A team member",
        inviteToken: token,
        role: validatedData.role,
      });
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      inviteTokenId: inviteToken.id,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Invite user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

