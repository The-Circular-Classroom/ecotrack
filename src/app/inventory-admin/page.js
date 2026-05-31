import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function InventoryAdminPage() {
  return (
    <LegacySurfacePage
      activePath="/inventory"
      eyebrow="Inventory"
      title="Admin inventory workflows are merged into the unified inventory surface."
      description="This route preserves the legacy entry point while pointing users at the canonical inventory APIs and condition update flow."
      sections={[
        {
          title: 'Admin actions',
          eyebrow: 'Inventory admin',
          items: [
            {
              label: 'Inventory dashboard',
              description: 'The unified inventory page now hosts the cross-school inventory workflow.',
              href: '/inventory',
            },
            {
              label: 'Condition updates',
              description: 'Update item conditions with the new unified inventory API.',
              href: '/api/inventory/update-item-condition',
            },
          ],
        },
      ]}
    />
  );
}
