import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ✅ GET all orders (Staff/Admin only)
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string };

    // ✅ Only allow STAFF and ADMIN to access all orders
    if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Staff/Admin access only' },
        { status: 403 }
      );
    }

    console.log('📊 Fetching all orders for:', user.role);

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('📦 Found orders:', orders.length);

    // ✅ Format orders with all needed fields
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      fileName: order.fileName,
      fileUrl: order.fileUrl,
      paperSize: order.paperSize,
      colorType: order.colorType,
      copies: order.copies,
      pages: order.pages,
      bindingType: order.bindingType,
      notes: order.notes,
      adminNotes: order.adminNotes,
      serviceType: order.serviceType,
      filesDeletedAt: order.filesDeletedAt?.toISOString() || null,
      paymentProofUrl: order.paymentProofUrl,
      paymentReference: order.paymentReference,
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}