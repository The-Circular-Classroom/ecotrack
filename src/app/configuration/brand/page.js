import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function BrandConfigurationPage() {
  return (
    <LegacySurfacePage
      activePath="/settings"
      eyebrow="Configuration"
      title="Brand supplier configuration now uses Prisma-backed catalog routes."
      description="This is the legacy brand management page, now mapped to the unified brand API."
      sections={[
        {
          title: 'Brands',
          eyebrow: 'Catalog',
          items: [
            { label: 'Brand list', description: 'Create and manage brand supplier records.', href: '/api/brand' },
            { label: 'Brand details', description: 'Open a specific brand record by id.', href: '/api/brand/1' },
          ],
        },
      ]}
    />
  );
}
