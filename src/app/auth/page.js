import { AppShell } from '@/components/app-shell';
import { AuthPanel } from '@/components/auth-panel';

export default function AuthPage() {
  return (
    <AppShell
      activePath="/auth"
      eyebrow="Authentication"
      title="Supabase Auth becomes the shared entry point."
      description="This page replaces the Cognito-driven front door with a single email/password flow that can later grow into roles, MFA, and admin policies inside Supabase."
    >
      <AuthPanel />
    </AppShell>
  );
}
