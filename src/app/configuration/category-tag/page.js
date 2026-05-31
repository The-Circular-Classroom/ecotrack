import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function CategoryTagPage() {
  return (
    <LegacySurfacePage
      activePath="/settings"
      eyebrow="Configuration"
      title="Category and tag configuration now uses the unified catalog APIs."
      description="This route mirrors the legacy category/tag editor and points it at the Prisma-backed CRUD endpoints."
      sections={[
        {
          title: 'Categories and tags',
          eyebrow: 'Catalog',
          items: [
            { label: 'Categories', description: 'Create and maintain item categories.', href: '/api/category' },
            { label: 'Tags', description: 'Manage tags and item-type tag links.', href: '/api/tag' },
          ],
        },
      ]}
    />
  );
}
