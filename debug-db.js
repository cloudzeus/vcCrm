
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Companies...");
    const companies = await prisma.company.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, organizationId: true }
    });
    console.log("Recent 5 Companies:", JSON.stringify(companies, null, 2));

    console.log("Checking Leads...");
    const leads = await prisma.crmRecord.findMany({
        where: { status: 'LEAD' },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, status: true, organizationId: true }
    });
    console.log("Recent 5 Leads:", JSON.stringify(leads, null, 2));

    console.log("Checking Organizations...");
    const orgs = await prisma.organization.findMany({ take: 5 });
    console.log("Orgs:", JSON.stringify(orgs, null, 2));
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
