// @ts-nocheck
// apps/frontend/src/app/inventory-admin/page.js
// This route is kept for backwards-compatibility. All inventory logic is now
// handled by /inventory with role-based access control.
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoryAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inventory');
  }, [router]);

  return null;
}