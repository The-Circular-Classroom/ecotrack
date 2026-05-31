import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function DonationDrivesPage() {
  return (
    <LegacySurfacePage
      activePath="/csv"
      eyebrow="Donation drives"
      title="Donation drive management now lives in the unified app."
      description="This route preserves the old drive management entry point and points it at the new Supabase-backed donation-drive APIs."
      sections={[
        {
          title: 'Drive workflow',
          eyebrow: 'Donation drives',
          items: [
            {
              label: 'Drive list',
              description: 'Use the canonical donation-drive API to list and create drives.',
              href: '/api/donation-drive',
            },
            {
              label: 'CSV workflow',
              description: 'CSV upload and approval now happen through the unified CSV routes.',
              href: '/csv',
            },
          ],
        },
      ]}
    />
  );
}
