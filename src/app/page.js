import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';

const migrationMilestones = [
  ['1', 'Single Next.js deployment'],
  ['2', 'Supabase Auth and Postgres'],
  ['3', 'Unified product routes'],
  ['4', 'Rebuilt CSV workflow'],
];

const routeLinks = [
  { href: '/auth', label: 'Auth', description: 'Supabase-backed login and sign-up flow.' },
  { href: '/inventory', label: 'Inventory', description: 'Donation, product, and storage operations.' },
  { href: '/analytics', label: 'Analytics', description: 'Read models and dashboard surfaces.' },
  { href: '/csv', label: 'CSV', description: 'Donation upload, validation, and approval workflow.' },
  { href: '/transaction', label: 'Transactions', description: 'Unified transaction ledger and reporting.' },
  { href: '/donation-drives', label: 'Donation drives', description: 'Drive management and approval workflow.' },
  { href: '/configuration', label: 'Configuration', description: 'Catalog management and legacy admin surfaces.' },
  { href: '/profile', label: 'Profile', description: 'Legacy account entry point now mapped to the unified app.' },
  { href: '/carbon-tracker', label: 'Carbon tracker', description: 'Legacy analytics entry point folded into unified reporting.' },
  { href: '/users', label: 'Users', description: 'Roles, profiles, and admin workflows.' },
  { href: '/settings', label: 'Settings', description: 'Environment and deployment checks.' },
  { href: '/faq', label: 'FAQ', description: 'Migration and support reference.' },
];

export default function HomePage() {
  return (
    <AppShell
      activePath="/"
      eyebrow="Unified migration starter"
      title="A single codebase for Vercel and Supabase."
      description="This scaffold begins the cutover from the AWS multi-repo setup by creating one app shell, one auth surface, and one place to converge the shared product flows."
    >
      <SectionCard
        title="Migration milestones"
        eyebrow="Phase 1"
        footer={<Link href="/auth">Start with auth and session handling.</Link>}
      >
        <div className="metric-grid">
          {migrationMilestones.map(([value, label]) => (
            <div className="metric" key={label}>
              <span className="metric__value">{value}</span>
              <span className="metric__label">{label}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Unified route map" eyebrow="App shape" footer={<p>Each legacy UI area will be folded into one deployable Vercel project.</p>}>
        <div className="link-grid">
          {routeLinks.map((item) => (
            <Link className="link-tile" href={item.href} key={item.href}>
              <strong className="link-tile__label">{item.label}</strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Initial implementation scope"
        eyebrow="Now"
        footer={<p>The next steps are schema cutover validation and end-to-end deployment wiring.</p>}
      >
        <div className="route-stack">
          <div className="info-tile">
            <strong className="info-tile__label">Auth</strong>
            <span>Supabase client helpers, an auth form, and session state are already wired into the scaffold.</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">Backend</strong>
            <span>A health endpoint is in place to verify the unified project can run as one deployable app.</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">CSV workflow</strong>
            <span>Donation CSV uploads now validate against the database, store artifacts in Supabase Storage, and approve into transactions.</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">Legacy frontends</strong>
            <span>The old auth, inventory, analytics, and configuration page families are now represented in the single route tree.</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">Design system</strong>
            <span>The shell uses a single visual language so the future inventory and analytics screens can be merged cleanly.</span>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
