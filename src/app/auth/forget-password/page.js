import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function ForgetPasswordPage() {
  return (
    <LegacySurfacePage
      activePath="/auth"
      eyebrow="Authentication"
      title="Forgot password flow moves to Supabase."
      description="This page replaces the legacy Cognito recovery screen and points users back into the unified auth flow."
      sections={[
        {
          title: 'Recovery flow',
          eyebrow: 'Password reset',
          items: [
            {
              label: 'Reset route',
              description: 'Use the Supabase auth flow to request a recovery email and continue at the reset-password route.',
              href: '/auth/reset-password',
            },
            {
              label: 'Login route',
              description: 'Return to the sign-in form once the password has been updated.',
              href: '/auth/login',
            },
          ],
        },
      ]}
    />
  );
}
