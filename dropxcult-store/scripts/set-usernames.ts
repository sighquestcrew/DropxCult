// Script to set usernames for existing users who don't have one
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { username: null }
    });

    console.log(`Found ${users.length} users without usernames`);

    for (const user of users) {
        const baseUsername = user.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        let username = `${baseUsername}-${randomSuffix}`;

        try {
            await prisma.user.update({
                where: { id: user.id },
                data: { username }
            });
            console.log(`Updated user ${user.name} -> @${username}`);
        } catch (error) {
            // If collision, try with timestamp
            username = `${baseUsername}-${Date.now().toString(36).slice(-4)}`;
            await prisma.user.update({
                where: { id: user.id },
                data: { username }
            });
            console.log(`Updated user ${user.name} -> @${username} (retry)`);
        }
    }

    console.log('Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
