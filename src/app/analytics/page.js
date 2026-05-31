import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';

export default function AnalyticsPage() {
  return (
    <AppShell
      activePath="/analytics"
      eyebrow="Analytics"
      title="Read-only analytics can share the same unified data model."
      description="The current analytics service is a good fit for server-side queries against Supabase Postgres once the canonical schema is in place."
    >
      <SectionCard title="Analytics surfaces" eyebrow="Dashboards">
        <div className="metric-grid">
          <div className="metric">
            <span className="metric__value">Overview</span>
            <span className="metric__label">Platform-wide KPIs and summary data.</span>
          </div>
          <div className="metric">
            <span className="metric__value">Schools</span>
            <span className="metric__label">School partnership reporting and trends.</span>
          </div>
          <div className="metric">
            <span className="metric__value">Collections</span>
            <span className="metric__label">Donation collection and fulfillment analytics.</span>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
