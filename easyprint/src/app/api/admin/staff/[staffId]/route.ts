import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { staffId: string } }
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

    const body = await req.json();
    const { name, email, role, password } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role.toUpperCase();
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.staffId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { staffId: string } }
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

    await prisma.user.delete({
      where: { id: params.staffId },
    });

    return NextResponse.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 });
  }
}