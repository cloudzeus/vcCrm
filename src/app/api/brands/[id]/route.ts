import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const brandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  logoUrl: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  instagramUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  youtubeUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  tiktokUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  contacts: z.array(z.any()).optional(),
  products: z.array(z.any()).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const body = await request.json();
    const validatedData = brandSchema.parse(body);

    const existingBrand = await prisma.brand.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingBrand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.website !== undefined) updateData.website = validatedData.website || null;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;
    if (validatedData.logoUrl !== undefined) updateData.logoUrl = validatedData.logoUrl || null;
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null;
    if (validatedData.city !== undefined) updateData.city = validatedData.city || null;
    if (validatedData.state !== undefined) updateData.state = validatedData.state || null;
    if (validatedData.country !== undefined) updateData.country = validatedData.country || null;
    if (validatedData.postalCode !== undefined) updateData.postalCode = validatedData.postalCode || null;
    if (validatedData.instagramUrl !== undefined) updateData.instagramUrl = validatedData.instagramUrl || null;
    if (validatedData.facebookUrl !== undefined) updateData.facebookUrl = validatedData.facebookUrl || null;
    if (validatedData.twitterUrl !== undefined) updateData.twitterUrl = validatedData.twitterUrl || null;
    if (validatedData.linkedinUrl !== undefined) updateData.linkedinUrl = validatedData.linkedinUrl || null;
    if (validatedData.youtubeUrl !== undefined) updateData.youtubeUrl = validatedData.youtubeUrl || null;
    if (validatedData.tiktokUrl !== undefined) updateData.tiktokUrl = validatedData.tiktokUrl || null;

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            campaigns: true,
            contacts: true,
            products: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: brand.id,
      name: brand.name,
      website: brand.website || "",
      notes: brand.notes || "",
      logoUrl: brand.logoUrl || "",
      address: brand.address || "",
      city: brand.city || "",
      state: brand.state || "",
      country: brand.country || "",
      postalCode: brand.postalCode || "",
      instagramUrl: brand.instagramUrl || "",
      facebookUrl: brand.facebookUrl || "",
      twitterUrl: brand.twitterUrl || "",
      linkedinUrl: brand.linkedinUrl || "",
      youtubeUrl: brand.youtubeUrl || "",
      tiktokUrl: brand.tiktokUrl || "",
      campaignCount: brand._count.campaigns,
      contactCount: brand._count.contacts,
      productCount: brand._count.products,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Brand update error:", error);
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

    const brand = await prisma.brand.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    await prisma.brand.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Brand deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

