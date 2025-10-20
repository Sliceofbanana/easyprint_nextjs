import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { role: string };
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      category,
      basePrice,
      attributes,
      pricingTiers,
      sampleImages,
      turnaroundTime,
    } = body;

    if (!name || !category || !basePrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        category: category.toUpperCase(),
        basePrice: parseFloat(basePrice),
        attributes: attributes || {},
        pricingTiers: pricingTiers || {},
        sampleImages: sampleImages || [],
        turnaroundTime: turnaroundTime || '3-day regular',
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}