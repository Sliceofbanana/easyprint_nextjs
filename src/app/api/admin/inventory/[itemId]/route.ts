import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ✅ GET - Get single inventory item
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> } // ✅ Changed to Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Await params
    const { itemId } = await params;

    const item = await prisma.inventory.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
      { status: 500 }
    );
  }
}

// ✅ PUT - Update inventory item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> } // ✅ Changed to Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { role: string };
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // ✅ Await params
    const { itemId } = await params;

    const body = await req.json();
    const {
      itemName,
      category,
      quantity,
      unit,
      minStockLevel,
      lastRestocked,
    } = body;

    const updateData: {
      itemName?: string;
      category?: string;
      quantity?: number;
      unit?: string;
      minStockLevel?: number;
      lastRestocked?: Date;
    } = {};

    if (itemName) updateData.itemName = itemName;
    if (category) updateData.category = category;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (unit) updateData.unit = unit;
    if (minStockLevel !== undefined)
      updateData.minStockLevel = parseInt(minStockLevel);
    if (lastRestocked) updateData.lastRestocked = new Date(lastRestocked);

    const updatedItem = await prisma.inventory.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Delete inventory item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> } // ✅ Changed to Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { role: string };
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // ✅ Await params
    const { itemId } = await params;

    await prisma.inventory.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}