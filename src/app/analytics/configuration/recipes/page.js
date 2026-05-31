import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function AnalyticsConfigurationRecipesPage() {
  return (
    <LegacySurfacePage
      activePath="/analytics"
      eyebrow="Analytics"
      title="Recipe configuration now targets the unified assembly model."
      description="This route replaces the legacy recipe editor with the Prisma-backed recipe and ingredient APIs."
      sections={[
        {
          title: 'Recipes',
          eyebrow: 'Assembly configuration',
          items: [
            { label: 'Recipe CRUD', description: 'Create, update, or delete recipe definitions.', href: '/api/assembly/recipes' },
            { label: 'Assembly calculation', description: 'Run the request calculator against product recipes.', href: '/api/assembly/calculate' },
          ],
        },
      ]}
    />
  );
}
