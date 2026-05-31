import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function ItemTypePresetPage() {
  return (
    <LegacySurfacePage
      activePath="/settings"
      eyebrow="Configuration"
      title="Item type presets are now backed by the unified data layer."
      description="This page keeps the preset route alive while pointing to the canonical item type APIs."
      sections={[
        {
          title: 'Item type presets',
          eyebrow: 'Catalog',
          items: [
            { label: 'Item types', description: 'Read the unified item type list for presets.', href: '/api/item-type/preset' },
            { label: 'Admin items', description: 'Inspect admin item type definitions used by the legacy preset editor.', href: '/api/item-type/admin/items' },
          ],
        },
      ]}
    />
  );
}
