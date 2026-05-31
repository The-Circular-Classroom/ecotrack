import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function AnalyticsSchoolPage() {
  return (
    <LegacySurfacePage
      activePath="/analytics"
      eyebrow="Analytics"
      title="School analytics now share the unified data layer."
      description="This route preserves the legacy school analytics page while linking to the new per-school inventory and collection APIs."
      sections={[
        {
          title: 'School views',
          eyebrow: 'Schools',
          items: [
            { label: 'Collection overview', description: 'Inspect per-school totals with the canonical inventory model.', href: '/api/school/1/collection-overview' },
            { label: 'Inventory by item', description: 'Review item-level breakdowns for a given school.', href: '/api/school/1/inventory-by-item' },
          ],
        },
      ]}
    />
  );
}
