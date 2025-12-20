
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking for admin users...");
    const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true, email: true, name: true, isAdmin: true }
    });

    console.log("Admins found:", admins);

    console.log("Checking for user 'admin@dropxcult.com'...");
    const specificUser = await prisma.user.findUnique({
        where: { email: 'admin@dropxcult.com' },
        select: { id: true, email: true, name: true, isAdmin: true }
    });
    console.log("Specific user:", specificUser);

    // Also list top 5 users just in case
    const allUsers = await prisma.user.findMany({
        take: 5,
        select: { id: true, email: true, name: true, isAdmin: true }
    });
    console.log("First 5 users:", allUsers);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
