import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function FileApprovalPage() {
  return (
    <LegacySurfacePage
      activePath="/csv"
      eyebrow="CSV workflow"
      title="Validated CSV files are approved inside the unified app."
      description="This route mirrors the legacy approval screen and points at the donation-drive file approval endpoints now built on Supabase Storage."
      sections={[
        {
          title: 'Approval flow',
          eyebrow: 'File review',
          items: [
            {
              label: 'Validated files',
              description: 'Review uploaded donation files from the validated storage bucket.',
              href: '/api/donation-drive/validated-files',
            },
            {
              label: 'Approve file',
              description: 'Move a reviewed file into the approved path using the unified API.',
              href: '/api/donation-drive/approve-file',
            },
          ],
        },
      ]}
    />
  );
}
