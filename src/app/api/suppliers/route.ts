import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const body = await request.json();
    const validatedData = supplierSchema.parse(body);

    const supplier = await prisma.supplier.create({
      data: {
        organizationId: organization.id,
        name: validatedData.name,
        vatNumber: validatedData.vatNumber || null,
        commercialTitle: validatedData.commercialTitle || null,
        address: validatedData.address || null,
        irsOffice: validatedData.irsOffice || null,
        city: validatedData.city || null,
        country: validatedData.country || null,
        zip: validatedData.zip || null,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        logoUrl: validatedData.logoUrl || null,
        website: validatedData.website || null,
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

    console.error("Supplier creation error:", error);
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

    const suppliers = await prisma.supplier.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      suppliers.map((supplier) => ({
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
      }))
    );
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

