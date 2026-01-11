import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { ProposalsClient } from "@/components/proposals/proposals-client";

export default async function ProposalsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const user = await getCurrentUserOrThrow();
    const organization = await getOrganizationOrThrow();

    /*
     * Fallback to raw query because the Prism Client instance in memory 
     * might be stale and missing the new 'organizationId' field in its definition 
     * even though the DB has it.
     */
    const proposals = await prisma.$queryRaw`
    SELECT 
      p.id, 
      p.title, 
      p.totalAmount, 
      p.status, 
      p.createdAt,
      c.id as companyId, 
      c.name as companyName,
      r.id as crmRecordId,
      r.title as crmRecordTitle
    FROM Proposal p
    LEFT JOIN Company c ON p.companyId = c.id
    LEFT JOIN CrmRecord r ON p.crmRecordId = r.id
    WHERE p.organizationId = ${organization.id}
    ORDER BY p.createdAt DESC
  `;

    return (
        <ProposalsClient
            initialProposals={(proposals as any[]).map((p: any) => ({
                id: p.id,
                title: p.title,
                totalAmount: p.totalAmount,
                status: p.status,
                companyName: p.companyName,
                companyId: p.companyId,
                crmRecordTitle: p.crmRecordTitle || null,
                crmRecordId: p.crmRecordId || null,
                createdAt: typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString(),
            }))}
        />
    );
}
