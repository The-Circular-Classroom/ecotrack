import { AppShell } from '@/components/app-shell';
import { AuthPanel } from '@/components/auth-panel';

export default function SignupPage() {
  return (
    <AppShell
      activePath="/auth"
      eyebrow="Authentication"
      title="Create a Supabase account for the migrated app."
      description="This route mirrors the old sign-up entry point, but now uses the same Supabase-backed session surface as the rest of the app."
    >
      <AuthPanel />
    </AppShell>
  );
}
