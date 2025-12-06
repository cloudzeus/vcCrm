"use server";

import { revalidatePath } from "next/cache";
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

export async function createSupplier(data: z.infer<typeof supplierSchema>) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const validatedData = supplierSchema.parse(data);

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

    revalidatePath("/suppliers");
    return {
      success: true,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        vatNumber: supplier.vatNumber || undefined,
        commercialTitle: supplier.commercialTitle || undefined,
        address: supplier.address || undefined,
        irsOffice: supplier.irsOffice || undefined,
        city: supplier.city || undefined,
        country: supplier.country || undefined,
        zip: supplier.zip || undefined,
        phone: supplier.phone || undefined,
        email: supplier.email || undefined,
        logoUrl: supplier.logoUrl || undefined,
        website: supplier.website || undefined,
        contactCount: supplier._count.contacts,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Supplier creation error:", error);
    return { error: "Failed to create supplier" };
  }
}

export async function updateSupplier(
  id: string,
  data: z.infer<typeof supplierSchema>
) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    // Verify supplier belongs to organization
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!supplier) {
      return { error: "Supplier not found" };
    }

    const validatedData = supplierSchema.parse(data);

    const updatedSupplier = await prisma.supplier.update({
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

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);
    return {
      success: true,
      supplier: {
        id: updatedSupplier.id,
        name: updatedSupplier.name,
        vatNumber: updatedSupplier.vatNumber || undefined,
        commercialTitle: updatedSupplier.commercialTitle || undefined,
        address: updatedSupplier.address || undefined,
        irsOffice: updatedSupplier.irsOffice || undefined,
        city: updatedSupplier.city || undefined,
        country: updatedSupplier.country || undefined,
        zip: updatedSupplier.zip || undefined,
        phone: updatedSupplier.phone || undefined,
        email: updatedSupplier.email || undefined,
        logoUrl: updatedSupplier.logoUrl || undefined,
        website: updatedSupplier.website || undefined,
        contactCount: updatedSupplier._count.contacts,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Supplier update error:", error);
    return { error: "Failed to update supplier" };
  }
}

export async function deleteSupplier(id: string) {
  try {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!supplier) {
      return { error: "Supplier not found" };
    }

    await prisma.supplier.delete({
      where: { id },
    });

    revalidatePath("/suppliers");
    return { success: true };
  } catch (error) {
    console.error("Supplier deletion error:", error);
    return { error: "Failed to delete supplier" };
  }
}

