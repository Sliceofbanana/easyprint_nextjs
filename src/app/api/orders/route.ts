import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '../../../lib/prisma';
import { OrderStatus } from '@prisma/client';

// ✅ GET all orders
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string };

    console.log('📊 Fetching orders for:', user.role, user.id);

    const orders = user.role === 'USER'
      ? await prisma.order.findMany({ 
          where: { userId: user.id }, 
          orderBy: { createdAt: 'desc' } 
        })
      : await prisma.order.findMany({ 
          orderBy: { createdAt: 'desc' } 
        });

    console.log('📦 Found orders:', orders.length);

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      totalPrice: order.totalPrice,
      total: order.totalPrice,
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
      details: {
        contactName: order.customerName,
        contactEmail: order.customerEmail,
      },
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ✅ POST create new order
export async function POST(req: NextRequest) {
  try {
    console.log('🔵 POST /api/orders called');

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    const user = session.user as { id: string; email: string };
    console.log('✅ User authenticated:', user.email);

    const body = await req.json();
    console.log('📥 Received order data:', JSON.stringify(body, null, 2));

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
      adminNotes,
      paymentProofUrl,
      paymentReference,
    } = body;

    // ✅ Validate required fields
    if (!customerName?.trim()) {
      console.error('❌ Missing customerName');
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!customerEmail?.trim()) {
      console.error('❌ Missing customerEmail');
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }
    if (!totalPrice || isNaN(Number(totalPrice)) || Number(totalPrice) <= 0) {
      console.error('❌ Invalid totalPrice:', totalPrice);
      return NextResponse.json({ error: 'Valid total price is required' }, { status: 400 });
    }
    
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    
    let nextNumber = 1001;
    if (lastOrder?.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.replace(/[^\d]/g, ''));
      nextNumber = isNaN(lastNumber) ? 1001 : lastNumber + 1;
    }
    
    const nextOrderNumber = `MQ_${nextNumber}`;

    console.log('🔢 Generated order number:', nextOrderNumber);

    const sanitizedData = {
      userId: user.id,
      orderNumber: nextOrderNumber,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase(),
      customerPhone: customerPhone ? String(customerPhone).trim() : null,
      serviceType: serviceType || 'DOCUMENT_PRINTING',
      paperSize: paperSize?.toUpperCase() || 'A4',
      colorType: colorType?.toUpperCase()?.replace(/\s+/g, '_') || 'BLACK_AND_WHITE',
      copies: Math.max(1, parseInt(String(copies)) || 1),
      pages: Math.max(1, parseInt(String(pages)) || 1),
      bindingType: bindingType?.toUpperCase()?.replace(/-/g, '_') || 'NONE',
      fileUrl: fileUrl || '',
      fileName: fileName || 'document.pdf',
      pricePerPage: parseFloat(String(pricePerPage)) || 0,
      totalPrice: parseFloat(String(totalPrice)),
      notes: notes ? String(notes).trim() : '',
      paymentProofUrl: paymentProofUrl || null,
      paymentReference: paymentReference || null,
      adminNotes: adminNotes || `Service: ${serviceType}\nDelivery: ${body.deliveryType || 'pickup'}`,
      status: OrderStatus.PENDING, 
    };

    console.log('💾 Sanitized data for Prisma:', JSON.stringify(sanitizedData, null, 2));

    const order = await prisma.order.create({
      data: sanitizedData,
    });

    console.log('✅ Order created successfully:', order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('❌ Error creating order:', error);
    
    const err = error as { message?: string; code?: string; meta?: unknown };

    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: err.message || 'Unknown error',
        code: err.code || null,
      },
      { status: 500 }
    );
  }
}