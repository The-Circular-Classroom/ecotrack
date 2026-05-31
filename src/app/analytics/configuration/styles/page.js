import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function AnalyticsConfigurationStylesPage() {
  return (
    <LegacySurfacePage
      activePath="/analytics"
      eyebrow="Analytics"
      title="Styles now come from the unified catalog tables."
      description="This route mirrors the old style manager and points to the new style CRUD endpoints in the assembly API."
      sections={[
        {
          title: 'Styles',
          eyebrow: 'Assembly configuration',
          items: [
            { label: 'Style list', description: 'Create or update product styles from the unified API.', href: '/api/assembly/styles' },
            { label: 'Products', description: 'Open the product view to see which styles are attached.', href: '/api/assembly/products' },
          ],
        },
      ]}
    />
  );
}
