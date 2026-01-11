import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";

// PUT /api/services/[serviceId]
export async function PUT(
    req: Request,
    { params }: { params: { serviceId: string } }
) {
    try {
        const user = await getCurrentUserOrThrow();
        const organization = await getOrganizationOrThrow();
        const body = await req.json();

        const { code, description, image } = body;

        if (!params.serviceId) {
            return new NextResponse("Service ID is required", { status: 400 });
        }

        // Verify ownership
        const existingService = await prisma.service.findUnique({
            where: {
                id: params.serviceId,
                organizationId: organization.id,
            },
        });

        if (!existingService) {
            return new NextResponse("Service not found", { status: 404 });
        }

        const service = await prisma.service.update({
            where: {
                id: params.serviceId,
            },
            data: {
                code,
                description,
                image,
            },
        });

        return NextResponse.json(service);
    } catch (error) {
        console.error("[SERVICE_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE /api/services/[serviceId]
export async function DELETE(
    req: Request,
    { params }: { params: { serviceId: string } }
) {
    try {
        const user = await getCurrentUserOrThrow();
        const organization = await getOrganizationOrThrow();

        if (!params.serviceId) {
            return new NextResponse("Service ID is required", { status: 400 });
        }

        // Verify ownership
        const existingService = await prisma.service.findUnique({
            where: {
                id: params.serviceId,
                organizationId: organization.id,
            },
        });

        if (!existingService) {
            return new NextResponse("Service not found", { status: 404 });
        }

        await prisma.service.delete({
            where: {
                id: params.serviceId,
            },
        });

        return NextResponse.json(existingService);
    } catch (error) {
        console.error("[SERVICE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
