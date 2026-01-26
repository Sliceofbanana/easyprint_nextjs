import { prisma } from './prisma';

/**
 * Check if a date is from the current month
 */
export function isCurrentMonth(date: Date): boolean {
  const now = new Date();
  const checkDate = new Date(date);
  
  return (
    checkDate.getFullYear() === now.getFullYear() &&
    checkDate.getMonth() === now.getMonth()
  );
}

/**
 * Check if an order should be archived (older than current month)
 */
export function shouldArchiveOrder(createdAt: Date): boolean {
  const now = new Date();
  const orderDate = new Date(createdAt);
  
  return (
    orderDate.getFullYear() < now.getFullYear() ||
    (orderDate.getFullYear() === now.getFullYear() && 
     orderDate.getMonth() < now.getMonth())
  );
}

/**
 * Archive old orders (run this monthly via cron or API)
 */
export async function archiveOldOrders() {
  const now = new Date();
  const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const result = await prisma.order.updateMany({
    where: {
      createdAt: {
        lt: firstDayOfCurrentMonth,
      },
      archivedAt: null,
    },
    data: {
      archivedAt: new Date(),
    },
  });
  
  console.log(`✅ Archived ${result.count} orders from previous months`);
  return result.count;
}

/**
 * Delete files from archived order
 */
export async function deleteArchivedOrderFiles(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  
  if (!order || !order.archivedAt) {
    throw new Error('Order not found or not archived');
  }
  
  await prisma.order.update({
    where: { id: orderId },
    data: {
      fileUrl: null,
      fileName: null,
      paymentProofUrl: null,
      filesDeletedAt: new Date(),
    },
  });
  
  return true;
}