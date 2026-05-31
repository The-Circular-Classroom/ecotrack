import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function MfaPage() {
  return (
    <LegacySurfacePage
      activePath="/auth"
      eyebrow="Authentication"
      title="Multi-factor auth is part of the unified Supabase flow."
      description="The legacy MFA page now points into the same session model used by the rest of the Vercel app."
      sections={[
        {
          title: 'MFA options',
          eyebrow: 'Session security',
          items: [
            {
              label: 'Sign in',
              description: 'Return to the login route after completing your second factor challenge.',
              href: '/auth/login',
            },
            {
              label: 'Settings',
              description: 'Use the account settings route to review the active session state.',
              href: '/auth/settings',
            },
          ],
        },
      ]}
    />
  );
}
