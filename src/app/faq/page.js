import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function FaqPage() {
  return (
    <LegacySurfacePage
      activePath="/"
      eyebrow="FAQ"
      title="Migration FAQ for the unified EcoTrack app."
      description="This page keeps the legacy FAQ entry point available while the new Vercel and Supabase deployment is being finalized."
      sections={[
        {
          title: 'Common questions',
          eyebrow: 'Support',
          items: [
            {
              label: 'Where do I sign in?',
              description: 'Use the unified auth routes at /auth and /auth/login.',
              href: '/auth/login',
            },
            {
              label: 'Where is inventory now?',
              description: 'Inventory lives at /inventory with the new Prisma-backed APIs.',
              href: '/inventory',
            },
          ],
        },
      ]}
    />
  );
}
