
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking ALL CrmRecords...");
    const records = await prisma.crmRecord.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, status: true, organizationId: true }
    });
    console.log("All Records:", JSON.stringify(records, null, 2));
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
