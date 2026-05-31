import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function AnalyticsOverviewPage() {
  return (
    <LegacySurfacePage
      activePath="/analytics"
      eyebrow="Analytics"
      title="Analytics overview now lives on the unified app."
      description="This page replaces the old analytics landing page and points into the new Prisma-backed overview routes."
      sections={[
        {
          title: 'Overview APIs',
          eyebrow: 'Analytics',
          items: [
            { label: 'KPI totals', description: 'Overall network metrics for the migrated inventory model.', href: '/api/analytics/overview/kpi-totals' },
            { label: 'Inventory by school', description: 'Category breakdowns by school in the canonical schema.', href: '/api/analytics/overview/inventory-by-school' },
          ],
        },
      ]}
    />
  );
}
