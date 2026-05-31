import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function AnalyticsConfigurationProductsPage() {
  return (
    <LegacySurfacePage
      activePath="/analytics"
      eyebrow="Analytics"
      title="Products and product styles live in the unified Prisma schema."
      description="This route corresponds to the legacy product configuration area and now points at the assembly APIs."
      sections={[
        {
          title: 'Products',
          eyebrow: 'Assembly configuration',
          items: [
            { label: 'Product list', description: 'Read or edit product definitions.', href: '/api/assembly/products' },
            { label: 'Product options', description: 'Fetch product type and style options.', href: '/api/assembly/product-options' },
          ],
        },
      ]}
    />
  );
}
