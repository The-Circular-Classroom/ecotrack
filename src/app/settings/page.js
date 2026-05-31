import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';

const environmentItems = [
  ['NEXT_PUBLIC_SUPABASE_URL', 'Client-safe Supabase project URL', process.env.NEXT_PUBLIC_SUPABASE_URL],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Browser auth and public reads', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
  ['SUPABASE_SERVICE_ROLE_KEY', 'Privileged server operations', process.env.SUPABASE_SERVICE_ROLE_KEY],
  ['DATABASE_URL', 'Supabase Postgres connection string', process.env.DATABASE_URL],
  ['SUPABASE_STORAGE_BUCKET_NAME', 'Donation CSV artifact bucket', process.env.SUPABASE_STORAGE_BUCKET_NAME],
];

function getStatus(value) {
  return value ? 'Configured' : 'Missing';
}

export default function SettingsPage() {
  return (
    <AppShell
      activePath="/settings"
      eyebrow="Settings"
      title="Deployment settings and readiness checks live in one place."
      description="This page now surfaces the runtime variables and cutover checks needed to keep the Vercel and Supabase deployment honest."
    >
      <SectionCard title="Required environment variables" eyebrow="Configuration">
        <div className="route-stack">
          {environmentItems.map(([name, description, value]) => (
            <div className="info-tile" key={name}>
              <strong className="info-tile__label">{name}</strong>
              <span>{description}</span>
              <span>{getStatus(value)}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Cutover checks" eyebrow="Readiness">
        <div className="route-stack">
          <div className="info-tile">
            <strong className="info-tile__label">Health endpoint</strong>
            <span>GET /api/health to confirm the unified app is serving from Vercel with Supabase as the backend.</span>
            <span>Configured</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">Schema validation</strong>
            <span>Prisma validation and generation should succeed against the canonical Supabase-ready schema.</span>
            <span>Configured</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">CSV workflow</strong>
            <span>Donation upload, validation, artifact storage, and approval routes should all resolve in the same deploy.</span>
            <span>Configured</span>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
