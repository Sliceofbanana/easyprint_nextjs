import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '../../../../lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { role: string };
    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { itemName, category, quantity, unit, minStockLevel } = body;

    // ✅ Fixed: Properly typed updateData
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
    if (quantity !== undefined) {
      updateData.quantity = parseInt(quantity);
      updateData.lastRestocked = new Date();
    }
    if (unit) updateData.unit = unit;
    if (minStockLevel !== undefined) updateData.minStockLevel = parseInt(minStockLevel);

    const item = await prisma.inventory.update({
      where: { id: params.itemId },
      data: updateData,
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { role: string };
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    await prisma.inventory.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}