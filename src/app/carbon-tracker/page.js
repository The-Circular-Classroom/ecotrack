import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function CarbonTrackerPage() {
  return (
    <LegacySurfacePage
      activePath="/analytics"
      eyebrow="Carbon tracker"
      title="Carbon tracking has been folded into the unified analytics workspace."
      description="This legacy placeholder now routes users toward the analytics views that are backed by the canonical Prisma schema."
      sections={[
        {
          title: 'Analytics routes',
          eyebrow: 'Tracking',
          items: [
            { label: 'Analytics overview', description: 'Use the main analytics dashboard for network-level reporting.', href: '/analytics/overview' },
            { label: 'School analytics', description: 'Inspect the school reporting and collection views.', href: '/analytics/school' },
          ],
        },
      ]}
    />
  );
}