import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user with organization
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true },
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: "No organization found" }, { status: 404 });
        }

        // Find existing video conference sync config
        const dataSync = await prisma.dataSync.findFirst({
            where: {
                organizationId: user.organizationId,
                appName: { contains: "video" }, // Flexible matching
            },
            include: {
                syncMethods: true,
            },
        });

        return NextResponse.json(dataSync);
    } catch (error) {
        console.error("Error fetching video conference sync config:", error);
        return NextResponse.json(
            { error: "Failed to fetch configuration" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user with organization
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true },
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: "No organization found" }, { status: 404 });
        }

        const body = await request.json();
        const { id, syncId, appName, description, isActive, syncMethods } = body;

        // Upsert the DataSync configuration
        const dataSync = await prisma.dataSync.upsert({
            where: {
                organizationId_syncId: {
                    organizationId: user.organizationId,
                    syncId: syncId || `video-conference-${Date.now()}`,
                },
            },
            update: {
                appName,
                description,
                isActive,
            },
            create: {
                organizationId: user.organizationId,
                syncId: syncId || `video-conference-${Date.now()}`,
                appName,
                description,
                isActive,
            },
        });

        // Delete existing methods and recreate them
        await prisma.dataSyncMethod.deleteMany({
            where: { dataSyncId: dataSync.id },
        });

        // Create new sync methods
        const createdMethods = await Promise.all(
            syncMethods.map((method: {
                name: string;
                endpointUrl: string;
                description: string;
                httpMethod: string;
                requestSchema: Record<string, unknown>;
                responseSchema: Record<string, unknown>;
                headers: Record<string, string>;
                syncInterval: string;
                connectionStatus: string;
                lastTestedAt?: Date;
                isActive: boolean;
            }) =>
                prisma.dataSyncMethod.create({
                    data: {
                        dataSyncId: dataSync.id,
                        name: method.name,
                        endpointUrl: method.endpointUrl,
                        description: method.description,
                        httpMethod: method.httpMethod,
                        requestSchema: method.requestSchema as any,
                        responseSchema: method.responseSchema as any,
                        headers: method.headers as any,
                        syncInterval: method.syncInterval,
                        connectionStatus: method.connectionStatus,
                        lastTestedAt: method.lastTestedAt,
                        isActive: method.isActive,
                    },
                })
            )
        );

        // Return the complete configuration
        const result = await prisma.dataSync.findUnique({
            where: { id: dataSync.id },
            include: { syncMethods: true },
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error saving video conference sync config:", error);
        return NextResponse.json(
            { error: "Failed to save configuration" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user with organization
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { organization: true },
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: "No organization found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const syncId = searchParams.get("syncId");

        if (!syncId) {
            return NextResponse.json({ error: "Sync ID required" }, { status: 400 });
        }

        // Delete the sync configuration (cascade will delete methods)
        await prisma.dataSync.delete({
            where: {
                organizationId_syncId: {
                    organizationId: user.organizationId,
                    syncId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting video conference sync config:", error);
        return NextResponse.json(
            { error: "Failed to delete configuration" },
            { status: 500 }
        );
    }
}
