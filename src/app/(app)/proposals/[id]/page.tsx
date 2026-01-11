
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";
import { ProposalDetailClient } from "@/components/proposals/proposal-detail-client";

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();
    const { id } = await params;

    // Use queryRaw for safety against stale types, similar to listings page
    // BUT findFirst usually works better for single record if we cast appropriately vs raw query complexity for relations
    // However, since we had issues, let's try standard findFirst with 'any' cast which is easier for single record validation

    // We need items and company
    const proposal = await (prisma.proposal as any).findFirst({
        where: {
            id,
            organizationId: organization.id
        },
        include: {
            company: true,
            items: {
                include: {
                    service: true
                }
            },
            crmRecord: true
        }
    });

    if (!proposal) {
        notFound();
    }

    return <ProposalDetailClient proposal={proposal} />;
}
