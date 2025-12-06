"use server";

interface VatApiResponse {
  basic_rec?: {
    afm?: string;
    doy?: string;
    doy_descr?: string;
    onomasia?: string;
    commer_title?: string | object; // Can be string or object
    postal_address?: string;
    postal_address_no?: string;
    postal_zip_code?: string;
    postal_area_description?: string;
  };
}

export async function lookupVat(vatNumber: string) {
  try {
    // Remove any spaces or special characters from VAT number
    const cleanVatNumber = vatNumber.replace(/\s+/g, "").trim();

    if (cleanVatNumber.length === 0) {
      return { error: "Please enter a valid VAT number" };
    }

    const response = await fetch("https://vat.wwa.gr/afm2info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        afm: cleanVatNumber,
      }),
    });

    if (!response.ok) {
      return { error: "Failed to fetch VAT information" };
    }

    const data: VatApiResponse = await response.json();

    if (!data.basic_rec) {
      return { error: "No information found for this VAT number" };
    }

    const basicRec = data.basic_rec;

    // Build address from postal_address and postal_address_no (concatenate with space)
    const addressParts = [
      basicRec.postal_address,
      basicRec.postal_address_no,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(" ") : undefined;

    // Handle commercial title - use it if it's a string, ignore if it's an object
    let commercialTitle: string | undefined = undefined;
    if (basicRec.commer_title && typeof basicRec.commer_title === "string") {
      commercialTitle = basicRec.commer_title.trim() || undefined;
    }
    // If commer_title is an object, we ignore it (don't set commercialTitle)

    // Map the response to form fields
    return {
      success: true,
      data: {
        name: basicRec.onomasia || undefined,
        commercialTitle: commercialTitle,
        address: fullAddress,
        irsOffice: basicRec.doy_descr || undefined,
        city: basicRec.postal_area_description || undefined,
        zip: basicRec.postal_zip_code || undefined,
      },
    };
  } catch (error) {
    console.error("VAT lookup error:", error);
    return {
      error: error instanceof Error
        ? error.message
        : "Failed to fetch VAT information. Please check the VAT number and try again.",
    };
  }
}

