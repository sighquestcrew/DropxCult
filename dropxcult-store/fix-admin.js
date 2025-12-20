
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = 'cmiujl6e30000ab15o7zp9jpa';

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        console.log(`User ${userId} not found!`);
    } else {
        console.log(`User ${userId} found. isAdmin: ${user.isAdmin}`);
        if (!user.isAdmin) {
            console.log("Promoting user to admin...");
            await prisma.user.update({
                where: { id: userId },
                data: { isAdmin: true }
            });
            console.log("User promoted to admin!");
        } else {
            console.log("User is already admin.");
        }
    }

    // Also check if there's any other admin
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    console.log(`Total admins in DB: ${adminCount}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
