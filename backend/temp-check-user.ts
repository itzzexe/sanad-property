import { PrismaClient } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    if (users.length > 0) {
      console.log('User emails:', users.map(u => u.email));
    } else {
      console.log('NO USERS IN DATABASE. You need to register or seed.');
    }
  } catch (e) {
    console.error('Error checking users:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
