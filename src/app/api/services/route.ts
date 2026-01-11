import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";

// GET /api/services
export async function GET(req: Request) {
    try {
        const user = await getCurrentUserOrThrow();
        const organization = await getOrganizationOrThrow();

        const services = await prisma.service.findMany({
            where: {
                organizationId: organization.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error("[SERVICES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/services
export async function POST(req: Request) {
    try {
        const user = await getCurrentUserOrThrow();
        const organization = await getOrganizationOrThrow();
        const body = await req.json();

        const { code, description, image, price } = body;

        if (!code || !description) {
            return new NextResponse("Code and description are required", { status: 400 });
        }

        const service = await prisma.service.create({
            data: {
                organizationId: organization.id,
                code,
                description,
                image,
                price: price ? parseFloat(price) : null,
            },
        });

        return NextResponse.json(service);
    } catch (error) {
        console.error("[SERVICES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
