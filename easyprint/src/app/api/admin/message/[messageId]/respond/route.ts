import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// ✅ POST - Admin sends response to customer message
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } } // Get message ID from URL
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { message } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create response in MessageResponse table
    const response = await prisma.messageResponse.create({
      data: {
        message: message.trim(),
        messageId: params.id, // Link to original message
        respondedById: admin.id, // Who responded
      },
    });

    // Update message status to IN_PROGRESS if it was PENDING
    const currentMessage = await prisma.message.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (currentMessage?.status === 'PENDING') {
      await prisma.message.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Fetch updated message with all responses
    const updatedMessage = await prisma.message.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error sending response:', error);
    return NextResponse.json(
      { error: 'Failed to send response' },
      { status: 500 }
    );
  }
}