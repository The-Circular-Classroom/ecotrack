import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function AnalyticsConfigurationProductTypesPage() {
  return (
    <LegacySurfacePage
      activePath="/analytics"
      eyebrow="Analytics"
      title="Product types are stored in the canonical schema."
      description="This page keeps the product type manager visible while the new assembly endpoints handle CRUD operations."
      sections={[
        {
          title: 'Product types',
          eyebrow: 'Assembly configuration',
          items: [
            { label: 'Create/update', description: 'Manage product type records through the assembly API.', href: '/api/assembly/product-types' },
            { label: 'Products', description: 'Review products that use the defined types.', href: '/api/assembly/products' },
          ],
        },
      ]}
    />
  );
}
