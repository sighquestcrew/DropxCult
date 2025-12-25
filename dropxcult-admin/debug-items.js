
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const items = await prisma.orderItem.findMany({
            where: { order: { isPaid: true } },
            select: { name: true, isCustom: true, designId: true, image: true, qty: true },
            take: 20
        });
        console.log(JSON.stringify(items, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
