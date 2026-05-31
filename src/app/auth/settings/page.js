import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function AuthSettingsPage() {
  return (
    <LegacySurfacePage
      activePath="/auth"
      eyebrow="Authentication"
      title="Account settings live inside the unified app."
      description="This replaces the old Cognito settings surface with a Supabase-aware account page."
      sections={[
        {
          title: 'Account links',
          eyebrow: 'Settings',
          items: [
            {
              label: 'Deployment settings',
              description: 'Review environment checks for the Vercel and Supabase cutover.',
              href: '/settings',
            },
            {
              label: 'Users',
              description: 'Inspect the migrated user profile and role views.',
              href: '/users',
            },
          ],
        },
      ]}
    />
  );
}
