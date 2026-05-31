import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';

export default function UsersPage() {
  return (
    <AppShell
      activePath="/users"
      eyebrow="Users"
      title="User management moves onto Supabase identities and app roles."
      description="This page represents the admin workflow that will eventually replace the Cognito-linked user management Lambda."
    >
      <SectionCard title="Admin model" eyebrow="Access control">
        <div className="route-stack">
          <div className="info-tile">
            <strong className="info-tile__label">Profiles</strong>
            <span>Store app-specific profile data separately from Supabase auth identities.</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">Roles</strong>
            <span>Drive permissions from a unified database role model instead of Cognito groups.</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">Admin actions</strong>
            <span>Keep user create, update, and delete paths in one server-side implementation.</span>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
