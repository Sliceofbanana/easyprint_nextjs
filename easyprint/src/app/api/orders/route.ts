import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '../../lib/prisma';

// GET all orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string };

    const orders = user.role === 'USER'
      ? await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
      : await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });

    // ✅ Format orders with MQ_ prefix and correct field names
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: `MQ_${order.orderNumber}`, // ✅ Add prefix
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      totalPrice: order.totalPrice,
      total: order.totalPrice, // ✅ Add for compatibility
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
      details: { // ✅ Add for UserDashboard compatibility
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

// POST create new order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; email: string };
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
      paymentProofUrl,
      paymentProof,
    } = body;

    // ✅ Validate required fields
    if (!customerName) {
      return NextResponse.json({ error: 'Missing customerName' }, { status: 400 });
    }
    if (!customerEmail) {
      return NextResponse.json({ error: 'Missing customerEmail' }, { status: 400 });
    }
    if (!totalPrice || isNaN(Number(totalPrice))) {
      return NextResponse.json({ error: 'Invalid or missing totalPrice' }, { status: 400 });
    }

    // ✅ Sanitize and validate data
    const sanitizedData = {
      userId: user.id,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim(),
      customerPhone: customerPhone ? String(customerPhone).trim() : null,
      serviceType: serviceType || 'DOCUMENT_PRINTING',
      paperSize: paperSize?.toUpperCase() || 'A4',
      colorType: colorType?.toUpperCase() || 'BLACK_AND_WHITE',
      copies: Math.max(1, parseInt(String(copies)) || 1),
      pages: Math.max(1, parseInt(String(pages)) || 1),
      bindingType: bindingType?.toUpperCase() || 'NONE',
      fileUrl: fileUrl || '',
      fileName: fileName || 'document.pdf',
      pricePerPage: parseFloat(String(pricePerPage)) || 0,
      totalPrice: parseFloat(String(totalPrice)),
      notes: notes ? String(notes).trim() : '',
      adminNotes: paymentProof 
        ? `Payment Ref: ${paymentProof.ref || 'N/A'}\nScreenshot: ${paymentProofUrl || 'Not uploaded'}` 
        : '',
      status: 'PENDING',
    };

    console.log('💾 Sanitized data for Prisma:', JSON.stringify(sanitizedData, null, 2));

    // ✅ Create order
    const order = await prisma.order.create({
      data: sanitizedData,
    });

    console.log('✅ Order created successfully:', order.id);

    // ✅ Return with MQ_ prefix
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: `MQ_${order.orderNumber}`, // ✅ Add prefix
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating order:', error);
    
    // ✅ Log Prisma-specific errors
    if (error.code) {
      console.error('Prisma error code:', error.code);
      console.error('Prisma error meta:', error.meta);
    }

    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: error.message || 'Unknown error',
        code: error.code || null,
      },
      { status: 500 }
    );
  }
}