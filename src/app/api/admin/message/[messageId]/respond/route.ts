import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> } // ✅ Changed to Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { role: string; id: string };
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // ✅ Await params
    const { messageId } = await params;

    const body = await req.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Response message is required' },
        { status: 400 }
      );
    }

    // Create response
    const newResponse = await prisma.messageResponse.create({
      data: {
        message: message.trim(),
        messageId: messageId,
        respondedById: user.id,
      },
    });

    // Update message status
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: 'RESPONDED',
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      response: newResponse,
    });
  } catch (error) {
    console.error('Error responding to message:', error);
    return NextResponse.json(
      { error: 'Failed to send response' },
      { status: 500 }
    );
  }
}