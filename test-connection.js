import { PrismaClient } from '@prisma/client';

async function Prisma_Client() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL via Prisma!');
  } catch (e) {
    console.error('❌ Connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

export default Prisma_Client;
