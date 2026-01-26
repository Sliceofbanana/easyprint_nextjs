import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { role: string };

    // ✅ Only STAFF and ADMIN can delete files
    if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Staff/Admin only' },
        { status: 403 }
      );
    }

    const { orderId } = await params;

    // ✅ Update order to mark files as deleted
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        filesDeletedAt: new Date(),
        fileUrl: null,
        fileName: null,
      },
    });

    console.log('🗑️ Files deleted for order:', orderId);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('❌ Error deleting files:', error);
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    );
  }
}