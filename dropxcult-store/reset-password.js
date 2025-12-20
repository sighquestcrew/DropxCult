
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const userId = 'cmiujl6e30000ab15o7zp9jpa';

    // 1. Get user email
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
    });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log(`User email: ${user.email}`);

    // 2. Reset password
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    console.log("Password reset found 'admin123'");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
