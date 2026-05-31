import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';

export default function InventoryPage() {
  return (
    <AppShell
      activePath="/inventory"
      eyebrow="Inventory"
      title="Inventory and donations move into one server-side surface."
      description="This area will absorb the current inventory-management backend so the same codebase owns donation drives, items, products, and transaction flows."
    >
      <SectionCard title="Inventory migration targets" eyebrow="Route plan">
        <div className="route-stack">
          <div className="info-tile">
            <strong className="info-tile__label">Donation drives</strong>
            <span>Track drive creation, eligibility, and status in one canonical model.</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">Transactions</strong>
            <span>Move donation and item transactions onto the unified Supabase database.</span>
          </div>
          <div className="info-tile">
            <strong className="info-tile__label">Storage locations</strong>
            <span>Model warehouses and storage locations in the same schema as the operational data.</span>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
