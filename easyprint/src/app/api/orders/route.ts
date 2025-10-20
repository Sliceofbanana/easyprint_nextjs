import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '../../lib/prisma';

// GET all orders (for admin/staff) or user's orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string; email: string };

    let orders;
    
    // Admin and Staff can see all orders
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Regular users see only their orders
      orders = await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    }

    // Format orders for frontend
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      totalPrice: order.totalPrice,
      status: order.status,
      serviceType: order.serviceType,
      paperSize: order.paperSize,
      colorType: order.colorType,
      copies: order.copies,
      pages: order.pages,
      bindingType: order.bindingType,
      fileUrl: order.fileUrl,
      fileName: order.fileName,
      notes: order.notes,
      adminNotes: order.adminNotes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      completedAt: order.completedAt?.toISOString(),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; email: string };
    const body = await req.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      paperSize,
      colorType,
      copies,
      pages,
      bindingType,
      fileUrl,
      fileName,
      pricePerPage,
      totalPrice,
      notes,
      paymentProof, // { ref: string, fileName: string }
    } = body;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        customerName,
        customerEmail,
        customerPhone,
        serviceType: serviceType || 'DOCUMENT_PRINTING',
        paperSize: paperSize?.toUpperCase() || 'A4',
        colorType: colorType?.toUpperCase() || 'BLACK_AND_WHITE',
        copies: parseInt(copies) || 1,
        pages: parseInt(pages) || 1,
        bindingType: bindingType?.toUpperCase() || 'NONE',
        fileUrl,
        fileName,
        pricePerPage: parseFloat(pricePerPage) || 0,
        totalPrice: parseFloat(totalPrice),
        notes: notes || '',
        adminNotes: paymentProof ? `Payment Ref: ${paymentProof.ref}` : '',
        status: 'PENDING', // Default status
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}