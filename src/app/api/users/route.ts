import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";
import { hash } from "bcryptjs";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["SUPERADMIN", "OWNER", "MANAGER", "INFLUENCER", "CLIENT"]),
  image: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const body = await request.json();
    const validatedData = userSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password if provided
    const passwordHash = validatedData.password
      ? await hash(validatedData.password, 10)
      : null;

    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        image: validatedData.image || null,
        role: validatedData.role,
        organizationId: organization.id,
      },
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      image: newUser.image || "",
      organizationId: newUser.organizationId || "",
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("User creation error:", error);
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

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { organizationId: organization.id },
          { role: "SUPERADMIN" }, // Include SUPERADMIN users even without organizationId
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified?.toISOString() || null,
        role: user.role,
        image: user.image || "",
        organizationId: user.organizationId || "",
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

