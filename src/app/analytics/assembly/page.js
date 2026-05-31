import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function AnalyticsAssemblyPage() {
  return (
    <LegacySurfacePage
      activePath="/analytics"
      eyebrow="Analytics"
      title="Assembly planning is now part of the unified schema."
      description="This replaces the legacy assembly dashboard with the Prisma-backed product and recipe routes."
      sections={[
        {
          title: 'Assembly APIs',
          eyebrow: 'Products and recipes',
          items: [
            { label: 'Products', description: 'List and manage product definitions for assembly planning.', href: '/api/assembly/products' },
            { label: 'Calculate', description: 'Run the assembly calculation endpoint for requested quantities.', href: '/api/assembly/calculate' },
          ],
        },
      ]}
    />
  );
}
