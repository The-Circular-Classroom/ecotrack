import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function ResetPasswordPage() {
  return (
    <LegacySurfacePage
      activePath="/auth"
      eyebrow="Authentication"
      title="Reset password in the unified auth surface."
      description="This route carries the recovery step from the legacy frontend into the Supabase-backed app shell."
      sections={[
        {
          title: 'Reset steps',
          eyebrow: 'Recovery',
          items: [
            {
              label: 'Set new password',
              description: 'After a recovery email, continue to the route that accepts the new password.',
              href: '/auth/set-new-password',
            },
            {
              label: 'MFA check',
              description: 'If your workspace requires it, complete the multi-factor step before continuing.',
              href: '/auth/mfa',
            },
          ],
        },
      ]}
    />
  );
}
