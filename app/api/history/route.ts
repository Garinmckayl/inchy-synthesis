import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const chat = await prisma.chat.findFirst({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: true, // Include related messages
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'No chat found for this user' }, { status: 404 });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Failed to get chats by user from database', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}