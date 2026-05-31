import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function UpdateItemConditionPage() {
  return (
    <LegacySurfacePage
      activePath="/inventory"
      eyebrow="Inventory"
      title="Update item condition inside the unified inventory workflow."
      description="This page keeps the legacy route alive while routing condition changes into the Prisma-backed inventory ledger."
      sections={[
        {
          title: 'Condition change',
          eyebrow: 'Inventory mutation',
          items: [
            {
              label: 'API route',
              description: 'PATCH the new inventory condition endpoint to record the update and ledger effect.',
              href: '/api/inventory/update-item-condition',
            },
            {
              label: 'Inventory view',
              description: 'Return to the canonical inventory page to inspect the resulting balances.',
              href: '/inventory',
            },
          ],
        },
      ]}
    />
  );
}
