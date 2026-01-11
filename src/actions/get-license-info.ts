"use server";

export async function getLicenseInfo() {
    return {
        serialNumber: process.env.LICENSE_SERIAL_NUMBER,
        ownerName: process.env.LICENSE_OWNER_NAME,
        ownerVat: process.env.LICENSE_OWNER_VAT,
        vendorName: process.env.LICENSE_VENTOR_NAME,
        vendorVat: process.env.LICENSE_VENTRO_VAT,
        date: process.env.LICENSE_DATE,
    };
}
