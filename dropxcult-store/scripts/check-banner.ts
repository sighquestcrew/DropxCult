// Quick script to check if banner was saved
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            banner: true,
            image: true
        },
        take: 5
    });

    console.log('User banners:');
    users.forEach(u => {
        console.log(`${u.name}: banner=${u.banner || 'NULL'}, image=${u.image ? 'SET' : 'NULL'}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
