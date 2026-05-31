import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function ConfirmSignupPage() {
  return (
    <LegacySurfacePage
      activePath="/auth"
      eyebrow="Authentication"
      title="Confirm a new account in Supabase."
      description="This page replaces the Cognito confirmation screen and keeps the onboarding path inside the unified app."
      sections={[
        {
          title: 'Verification',
          eyebrow: 'Account onboarding',
          items: [
            {
              label: 'Sign in',
              description: 'Once the account is confirmed, continue to the login route.',
              href: '/auth/login',
            },
            {
              label: 'Sign up',
              description: 'If the account has not been created yet, use the sign-up route first.',
              href: '/auth/signup',
            },
          ],
        },
      ]}
    />
  );
}
