"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { z } from "zod";

const companySchema = z.object({
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

export async function createCompany(data: z.infer<typeof companySchema>) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const validatedData = companySchema.parse(data);

    const company = await prisma.company.create({
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

    revalidatePath("/companies");
    return {
      success: true,
      company: {
        id: company.id,
        name: company.name,
        vatNumber: company.vatNumber || undefined,
        commercialTitle: company.commercialTitle || undefined,
        address: company.address || undefined,
        irsOffice: company.irsOffice || undefined,
        city: company.city || undefined,
        country: company.country || undefined,
        zip: company.zip || undefined,
        phone: company.phone || undefined,
        email: company.email || undefined,
        logoUrl: company.logoUrl || undefined,
        website: company.website || undefined,
        contactCount: company._count.contacts,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Company creation error:", error);
    return { error: "Failed to create company" };
  }
}

export async function updateCompany(
  id: string,
  data: z.infer<typeof companySchema>
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    // Verify company belongs to organization
    const company = await prisma.company.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!company) {
      return { error: "Company not found" };
    }

    const validatedData = companySchema.parse(data);

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
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

    revalidatePath("/companies");
    revalidatePath(`/companies/${id}`);
    return {
      success: true,
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        vatNumber: updatedCompany.vatNumber || undefined,
        commercialTitle: updatedCompany.commercialTitle || undefined,
        address: updatedCompany.address || undefined,
        irsOffice: updatedCompany.irsOffice || undefined,
        city: updatedCompany.city || undefined,
        country: updatedCompany.country || undefined,
        zip: updatedCompany.zip || undefined,
        phone: updatedCompany.phone || undefined,
        email: updatedCompany.email || undefined,
        logoUrl: updatedCompany.logoUrl || undefined,
        website: updatedCompany.website || undefined,
        contactCount: updatedCompany._count.contacts,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Company update error:", error);
    return { error: "Failed to update company" };
  }
}

export async function deleteCompany(id: string) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const company = await prisma.company.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!company) {
      return { error: "Company not found" };
    }

    await prisma.company.delete({
      where: { id },
    });

    revalidatePath("/companies");
    return { success: true };
  } catch (error) {
    console.error("Company deletion error:", error);
    return { error: "Failed to delete company" };
  }
}

