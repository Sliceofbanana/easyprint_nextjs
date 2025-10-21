import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '../../../lib/prisma';

// ✅ GET all orders
export async function GET(req: NextRequest) {
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
      orderNumber: `MQ_${order.orderNumber}`,
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
      paymentProofUrl,
      paymentProof,
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

    // ✅ Generate order number as STRING
    // Option 1: Use CUID (recommended - matches schema default)
    // Prisma will auto-generate this, so we don't need to provide it
    
    // Option 2: If you want custom format like "MQ_1001"
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    
    // Extract number from last order (e.g., "MQ_1001" -> 1001)
    let nextNumber = 1001;
    if (lastOrder?.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.replace(/[^\d]/g, ''));
      nextNumber = isNaN(lastNumber) ? 1001 : lastNumber + 1;
    }
    
    const nextOrderNumber = `MQ_${nextNumber}`; // ✅ Now it's a STRING

    console.log('🔢 Generated order number:', nextOrderNumber);

    // ✅ Sanitize and validate data
    const sanitizedData = {
      userId: user.id,
      orderNumber: nextOrderNumber, // ✅ STRING instead of INT
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

    // ✅ Return formatted response
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber, // Already has "MQ_" prefix
        customerName: order.customerName,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating order:', error);
    
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