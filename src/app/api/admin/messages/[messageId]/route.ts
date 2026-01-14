import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ✅ POST - Admin/Staff responds to a customer message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const respondingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true },
    });

    if (!respondingUser || (respondingUser.role !== 'ADMIN' && respondingUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden - Admin/Staff only' }, { status: 403 });
    }

    const { messageId } = await params;
    const { message: responseMessage } = await req.json();

    if (!responseMessage?.trim()) {
      return NextResponse.json({ error: 'Response message required' }, { status: 400 });
    }

    // Create the response
    const response = await prisma.messageResponse.create({
      data: {
        messageId,
        respondedById: respondingUser.id,
        message: responseMessage.trim(),
      },
      include: {
        respondedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Get the updated message with all responses
    const updatedMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responses: {
          include: {
            respondedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    console.log('✅ Response created:', response);

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('❌ Error creating response:', error);
    return NextResponse.json(
      { error: 'Failed to send response' },
      { status: 500 }
    );
  }
}