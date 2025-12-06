import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const brandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const body = await request.json();
    const validatedData = brandSchema.parse(body);

    const brand = await prisma.brand.create({
      data: {
        organizationId: organization.id,
        name: validatedData.name,
        website: validatedData.website || null,
        notes: validatedData.notes || null,
        logoUrl: validatedData.logoUrl || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        country: validatedData.country || null,
        postalCode: validatedData.postalCode || null,
        instagramUrl: validatedData.instagramUrl || null,
        facebookUrl: validatedData.facebookUrl || null,
        twitterUrl: validatedData.twitterUrl || null,
        linkedinUrl: validatedData.linkedinUrl || null,
        youtubeUrl: validatedData.youtubeUrl || null,
        tiktokUrl: validatedData.tiktokUrl || null,
      },
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

    console.error("Brand creation error:", error);
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

    const brands = await prisma.brand.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: {
            campaigns: true,
            contacts: true,
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      brands.map((brand) => ({
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
      }))
    );
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

