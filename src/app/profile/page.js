import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function ProfilePage() {
  return (
    <LegacySurfacePage
      activePath="/users"
      eyebrow="Profile"
      title="Your profile now lives in the unified app."
      description="This route preserves the legacy profile entry point and points it at the Supabase-backed user surface."
      sections={[
        {
          title: 'Profile actions',
          eyebrow: 'Account',
          items: [
            { label: 'Users', description: 'Review user records and role assignments in the new app.', href: '/users' },
            { label: 'Auth settings', description: 'Continue to the unified authentication settings page.', href: '/auth/settings' },
          ],
        },
      ]}
    />
  );
}