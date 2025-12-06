import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  vatNumber: z.string().optional(),
  commercialTitle: z.string().optional(),
  address: z.string().optional(),
  irsOffice: z.string().optional(),
  city: z.string().optional(),
  country: z.enum([
    "AFGHANISTAN", "ALBANIA", "ALGERIA", "ANDORRA", "ANGOLA", "ANTIGUA_AND_BARBUDA",
    "ARGENTINA", "ARMENIA", "AUSTRALIA", "AUSTRIA", "AZERBAIJAN", "BAHAMAS", "BAHRAIN",
    "BANGLADESH", "BARBADOS", "BELARUS", "BELGIUM", "BELIZE", "BENIN", "BHUTAN",
    "BOLIVIA", "BOSNIA_AND_HERZEGOVINA", "BOTSWANA", "BRAZIL", "BRUNEI", "BULGARIA",
    "BURKINA_FASO", "BURUNDI", "CABO_VERDE", "CAMBODIA", "CAMEROON", "CANADA",
    "CENTRAL_AFRICAN_REPUBLIC", "CHAD", "CHILE", "CHINA", "COLOMBIA", "COMOROS",
    "CONGO", "COSTA_RICA", "CROATIA", "CUBA", "CYPRUS", "CZECH_REPUBLIC", "DENMARK",
    "DJIBOUTI", "DOMINICA", "DOMINICAN_REPUBLIC", "ECUADOR", "EGYPT", "EL_SALVADOR",
    "EQUATORIAL_GUINEA", "ERITREA", "ESTONIA", "ESWATINI", "ETHIOPIA", "FIJI",
    "FINLAND", "FRANCE", "GABON", "GAMBIA", "GEORGIA", "GERMANY", "GHANA", "GREECE",
    "GRENADA", "GUATEMALA", "GUINEA", "GUINEA_BISSAU", "GUYANA", "HAITI", "HONDURAS",
    "HUNGARY", "ICELAND", "INDIA", "INDONESIA", "IRAN", "IRAQ", "IRELAND", "ISRAEL",
    "ITALY", "JAMAICA", "JAPAN", "JORDAN", "KAZAKHSTAN", "KENYA", "KIRIBATI", "KOSOVO",
    "KUWAIT", "KYRGYZSTAN", "LAOS", "LATVIA", "LEBANON", "LESOTHO", "LIBERIA", "LIBYA",
    "LIECHTENSTEIN", "LITHUANIA", "LUXEMBOURG", "MADAGASCAR", "MALAWI", "MALAYSIA",
    "MALDIVES", "MALI", "MALTA", "MARSHALL_ISLANDS", "MAURITANIA", "MAURITIUS", "MEXICO",
    "MICRONESIA", "MOLDOVA", "MONACO", "MONGOLIA", "MONTENEGRO", "MOROCCO", "MOZAMBIQUE",
    "MYANMAR", "NAMIBIA", "NAURU", "NEPAL", "NETHERLANDS", "NEW_ZEALAND", "NICARAGUA",
    "NIGER", "NIGERIA", "NORTH_KOREA", "NORTH_MACEDONIA", "NORWAY", "OMAN", "PAKISTAN",
    "PALAU", "PALESTINE", "PANAMA", "PAPUA_NEW_GUINEA", "PARAGUAY", "PERU", "PHILIPPINES",
    "POLAND", "PORTUGAL", "QATAR", "ROMANIA", "RUSSIA", "RWANDA", "SAINT_KITTS_AND_NEVIS",
    "SAINT_LUCIA", "SAINT_VINCENT_AND_THE_GRENADINES", "SAMOA", "SAN_MARINO",
    "SAO_TOME_AND_PRINCIPE", "SAUDI_ARABIA", "SENEGAL", "SERBIA", "SEYCHELLES",
    "SIERRA_LEONE", "SINGAPORE", "SLOVAKIA", "SLOVENIA", "SOLOMON_ISLANDS", "SOMALIA",
    "SOUTH_AFRICA", "SOUTH_KOREA", "SOUTH_SUDAN", "SPAIN", "SRI_LANKA", "SUDAN", "SURINAME",
    "SWEDEN", "SWITZERLAND", "SYRIA", "TAIWAN", "TAJIKISTAN", "TANZANIA", "THAILAND",
    "TIMOR_LESTE", "TOGO", "TONGA", "TRINIDAD_AND_TOBAGO", "TUNISIA", "TURKEY",
    "TURKMENISTAN", "TUVALU", "UGANDA", "UKRAINE", "UNITED_ARAB_EMIRATES", "UNITED_KINGDOM",
    "UNITED_STATES", "URUGUAY", "UZBEKISTAN", "VANUATU", "VATICAN_CITY", "VENEZUELA",
    "VIETNAM", "YEMEN", "ZAMBIA", "ZIMBABWE"
  ]).optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phone: true,
            mobile: true,
            workPhone: true,
            jobPosition: true,
            image: true,
          },
        },
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: supplier.id,
      name: supplier.name,
      vatNumber: supplier.vatNumber || "",
      commercialTitle: supplier.commercialTitle || "",
      address: supplier.address || "",
      irsOffice: supplier.irsOffice || "",
      city: supplier.city || "",
      country: supplier.country || null,
      zip: supplier.zip || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      logoUrl: supplier.logoUrl || "",
      website: supplier.website || "",
      contactCount: supplier._count.contacts,
      contacts: supplier.contacts,
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    const body = await request.json();
    const validatedData = supplierSchema.parse(body);

    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: validatedData.name ?? existingSupplier.name,
        vatNumber: validatedData.vatNumber !== undefined ? validatedData.vatNumber || null : existingSupplier.vatNumber,
        commercialTitle: validatedData.commercialTitle !== undefined ? validatedData.commercialTitle || null : existingSupplier.commercialTitle,
        address: validatedData.address !== undefined ? validatedData.address || null : existingSupplier.address,
        irsOffice: validatedData.irsOffice !== undefined ? validatedData.irsOffice || null : existingSupplier.irsOffice,
        city: validatedData.city !== undefined ? validatedData.city || null : existingSupplier.city,
        country: validatedData.country !== undefined ? validatedData.country || null : existingSupplier.country,
        zip: validatedData.zip !== undefined ? validatedData.zip || null : existingSupplier.zip,
        phone: validatedData.phone !== undefined ? validatedData.phone || null : existingSupplier.phone,
        email: validatedData.email !== undefined ? validatedData.email || null : existingSupplier.email,
        logoUrl: validatedData.logoUrl !== undefined ? validatedData.logoUrl || null : existingSupplier.logoUrl,
        website: validatedData.website !== undefined ? validatedData.website || null : existingSupplier.website,
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: supplier.id,
      name: supplier.name,
      vatNumber: supplier.vatNumber || "",
      commercialTitle: supplier.commercialTitle || "",
      address: supplier.address || "",
      irsOffice: supplier.irsOffice || "",
      city: supplier.city || "",
      country: supplier.country || null,
      zip: supplier.zip || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      logoUrl: supplier.logoUrl || "",
      website: supplier.website || "",
      contactCount: supplier._count.contacts,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Supplier update error:", error);
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

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Supplier deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

