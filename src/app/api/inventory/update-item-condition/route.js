import { getRequestContext } from '@/lib/request-context';
import { createTransaction } from '@/lib/data/transactions';
import { prisma } from '@/lib/prisma';

export async function PATCH(request) {
  const context = await getRequestContext(request);
  if (!context.isAuthenticated || !context.userId) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  let payload = body;

  if (body.inventoryBalanceId) {
    const balance = await prisma.inventoryBalance.findUnique({
      where: { id: Number(body.inventoryBalanceId) },
      select: { itemTypeId: true, sizeOptionId: true, itemStatus: true, storedAt: true, quantity: true },
    });

    if (!balance) {
      return Response.json({ success: false, message: 'Inventory balance not found' }, { status: 404 });
    }

    payload = {
      item_type_id: balance.itemTypeId,
      size_option_id: balance.sizeOptionId,
      from_status: body.fromStatus || balance.itemStatus,
      to_status: body.toStatus || body.itemStatus || balance.itemStatus,
      from_stored_at: body.fromStoredAt || balance.storedAt,
      to_stored_at: body.toStoredAt || balance.storedAt,
      quantity: body.quantity || balance.quantity,
      remarks: body.remarks,
      user_id: context.userId,
    };
  }

  const data = await createTransaction({ ...payload, user_id: context.userId });
  return Response.json({ success: true, data });
}