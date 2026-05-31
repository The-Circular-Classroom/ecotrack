import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function SetNewPasswordPage() {
  return (
    <LegacySurfacePage
      activePath="/auth"
      eyebrow="Authentication"
      title="Set a new password for the Supabase account."
      description="This replaces the old Cognito temporary-password screen with a Supabase-native recovery step."
      sections={[
        {
          title: 'Next step',
          eyebrow: 'Password change',
          items: [
            {
              label: 'Login',
              description: 'After updating the password, continue to the sign-in route.',
              href: '/auth/login',
            },
            {
              label: 'Confirm signup',
              description: 'If the account is still unconfirmed, use the verification route before logging in.',
              href: '/auth/confirm-signup',
            },
          ],
        },
      ]}
    />
  );
}
