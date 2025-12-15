import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
    ) as { id: string; email: string; role: string };

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
      totalPrice,
      notes,
      paymentProofUrl,
      paymentReference,
    } = body;

    // Generate order number
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1001;
    if (lastOrder?.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.replace(/[^\d]/g, ''));
      nextNumber = isNaN(lastNumber) ? 1001 : lastNumber + 1;
    }

    const orderNumber = `MQ_${nextNumber}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: decoded.id,
        orderNumber,
        customerName,
        customerEmail: customerEmail.toLowerCase(),
        customerPhone,
        serviceType: serviceType || 'DOCUMENT_PRINTING',
        paperSize: paperSize?.toUpperCase() || 'A4',
        colorType: colorType?.toUpperCase()?.replace(/\s+/g, '_') || 'BLACK_AND_WHITE',
        copies: Math.max(1, parseInt(copies) || 1),
        pages: Math.max(1, parseInt(pages) || 1),
        bindingType: bindingType?.toUpperCase()?.replace(/-/g, '_') || 'NONE',
        fileUrl: fileUrl || '',
        fileName: fileName || 'document.pdf',
        totalPrice: parseFloat(totalPrice),
        notes: notes || '',
        paymentProofUrl: paymentProofUrl || null,
        paymentReference: paymentReference || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalPrice: order.totalPrice,
      },
    });
  } catch (error) {
    console.error('WordPress order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
    ) as { id: string };

    const orders = await prisma.order.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        fileName: true,
        fileUrl: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}