import { AppShell } from '@/components/app-shell';
import { AuthPanel } from '@/components/auth-panel';

export default function LoginPage() {
  return (
    <AppShell
      activePath="/auth"
      eyebrow="Authentication"
      title="Sign in to the unified Supabase workspace."
      description="This page replaces the old Cognito login surface with the canonical Supabase session model."
    >
      <AuthPanel />
    </AppShell>
  );
}
