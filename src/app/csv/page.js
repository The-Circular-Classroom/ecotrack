import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';

export default function CsvPage() {
  return (
    <AppShell
      activePath="/csv"
      eyebrow="CSV workflow"
      title="Donation CSV uploads are now handled in the unified app."
      description="Uploads are parsed and validated against Supabase Postgres, stored in Supabase Storage, and can be approved into transactions from the same codebase."
    >
      <SectionCard title="Workflow" eyebrow="Upload and approval">
        <div className="route-stack">
          <div className="info-tile">
            <strong className="info-tile__label">Validation</strong>
            <span>POST the file to /api/csv/process-donation-csv to validate users, schools, item types, sizes, and drives.</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">Storage</strong>
            <span>Validated and failed uploads are stored in Supabase Storage under donation workflow folders.</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">Approval</strong>
            <span>Admins can POST validated rows to /api/csv/process-donation-csv/approved to create donation transactions and inventory balances.</span>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}