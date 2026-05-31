import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function ConfigurationPage() {
  return (
    <LegacySurfacePage
      activePath="/settings"
      eyebrow="Configuration"
      title="Configuration management lives in the unified app."
      description="This route preserves the legacy configuration hub while the canonical Prisma tables take over."
      sections={[
        {
          title: 'Config pages',
          eyebrow: 'Catalog',
          items: [
            { label: 'Brand', description: 'Manage brand supplier records in the unified catalog.', href: '/configuration/brand' },
            { label: 'Colour / pattern / material', description: 'Maintain the item metadata used across inventory and assembly.', href: '/configuration/colour-pattern-material' },
          ],
        },
      ]}
    />
  );
}
