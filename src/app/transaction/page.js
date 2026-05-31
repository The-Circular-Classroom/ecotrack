import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function TransactionPage() {
  return (
    <LegacySurfacePage
      activePath="/inventory"
      eyebrow="Transactions"
      title="Transaction ledger lives in the unified Prisma-backed app."
      description="This page replaces the old transaction surface with the new canonical transaction API and inventory ledger."
      sections={[
        {
          title: 'Ledger endpoints',
          eyebrow: 'Transactions',
          items: [
            {
              label: 'Transactions list',
              description: 'Fetch or create transactions through the unified route.',
              href: '/api/transaction',
            },
            {
              label: 'Date range report',
              description: 'Use the date-range endpoint for filtered ledger views.',
              href: '/api/transaction/date-range',
            },
          ],
        },
      ]}
    />
  );
}
