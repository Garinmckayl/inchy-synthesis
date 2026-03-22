import { NextResponse } from 'next/server';

// v2 — always returns gracefully, never crashes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  // Return empty history for unauthenticated users instead of 400/500
  if (!id || id === 'undefined' || id === 'null') {
    return NextResponse.json({ messages: [], id: null });
  }

  try {
    // Lazy-init Prisma — return empty if no DB
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ messages: [], id });
    }
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const chat = await prisma.chat.findFirst({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      include: { messages: true },
    });
    await prisma.$disconnect();
    return NextResponse.json(chat ?? { messages: [], id });
  } catch (error) {
    console.error('Failed to get chats by user from database', error);
    return NextResponse.json({ messages: [], id });
  }
}
