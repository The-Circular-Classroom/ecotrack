import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function AnalyticsConfigurationPage() {
  return (
    <LegacySurfacePage
      activePath="/analytics"
      eyebrow="Analytics"
      title="Analytics configuration is merged into the unified app."
      description="This page keeps the old configuration hub available while the new Prisma-backed catalog routes take over."
      sections={[
        {
          title: 'Configuration areas',
          eyebrow: 'Catalog',
          items: [
            { label: 'Products', description: 'Configure products, product types, and styles for the assembly routes.', href: '/analytics/configuration/products' },
            { label: 'Recipes', description: 'Maintain the recipe definitions used by assembly planning.', href: '/analytics/configuration/recipes' },
          ],
        },
      ]}
    />
  );
}
