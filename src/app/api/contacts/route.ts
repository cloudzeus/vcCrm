import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  lastName: z.string().optional(),
  companyId: z.string().optional(),
  supplierId: z.string().optional(),
  jobPosition: z.string().optional(),
  notes: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
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
  image: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  workPhone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  birthday: z.string().optional(), // ISO date string
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Validate companyId if provided
    if (validatedData.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: validatedData.companyId,
          organizationId: organization.id,
        },
      });
      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }
    }

    // Validate supplierId if provided
    if (validatedData.supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: validatedData.supplierId,
          organizationId: organization.id,
        },
      });
      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }
    }

    const contact = await prisma.contact.create({
      data: {
        organizationId: organization.id,
        name: validatedData.name,
        lastName: validatedData.lastName || null,
        companyId: validatedData.companyId || null,
        supplierId: validatedData.supplierId || null,
        jobPosition: validatedData.jobPosition || null,
        notes: validatedData.notes || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        zip: validatedData.zip || null,
        country: validatedData.country || null,
        image: validatedData.image || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        mobile: validatedData.mobile || null,
        workPhone: validatedData.workPhone || null,
        gender: validatedData.gender || null,
        birthday: validatedData.birthday ? new Date(validatedData.birthday) : null,
      },
    });

    return NextResponse.json({
      id: contact.id,
      name: contact.name,
      lastName: contact.lastName || "",
      companyId: contact.companyId || "",
      supplierId: contact.supplierId || "",
      jobPosition: contact.jobPosition || "",
      notes: contact.notes || "",
      address: contact.address || "",
      city: contact.city || "",
      zip: contact.zip || "",
      country: contact.country || null,
      image: contact.image || "",
      email: contact.email || "",
      phone: contact.phone || "",
      mobile: contact.mobile || "",
      workPhone: contact.workPhone || "",
      gender: contact.gender || null,
      birthday: contact.birthday ? contact.birthday.toISOString() : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("Contact creation error:", error);
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

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: organization.id,
        ...(companyId && { companyId }),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
            city: true,
            phone: true,
            email: true,
            website: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
            city: true,
            phone: true,
            email: true,
            website: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        lastName: contact.lastName || "",
        companyId: contact.companyId || "",
        supplierId: contact.supplierId || "",
        company: contact.company ? {
          id: contact.company.id,
          name: contact.company.name,
          logoUrl: contact.company.logoUrl || "",
          address: contact.company.address || "",
          city: contact.company.city || "",
          phone: contact.company.phone || "",
          email: contact.company.email || "",
          website: contact.company.website || "",
        } : contact.supplier ? {
          id: contact.supplier.id,
          name: contact.supplier.name,
          logoUrl: contact.supplier.logoUrl || "",
          address: contact.supplier.address || "",
          city: contact.supplier.city || "",
          phone: contact.supplier.phone || "",
          email: contact.supplier.email || "",
          website: contact.supplier.website || "",
        } : null,
        jobPosition: contact.jobPosition || "",
        notes: contact.notes || "",
        address: contact.address || "",
        city: contact.city || "",
        zip: contact.zip || "",
        country: contact.country || null,
        image: contact.image || "",
        email: contact.email || "",
        phone: contact.phone || "",
        mobile: contact.mobile || "",
        workPhone: contact.workPhone || "",
        gender: contact.gender || null,
        birthday: contact.birthday ? contact.birthday.toISOString() : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

