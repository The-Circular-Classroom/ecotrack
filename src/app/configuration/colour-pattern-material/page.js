import { LegacySurfacePage } from '@/components/legacy-surface-page';

export default function ColourPatternMaterialPage() {
  return (
    <LegacySurfacePage
      activePath="/settings"
      eyebrow="Configuration"
      title="Colour, pattern, and material management is now unified."
      description="This page preserves the legacy catalog entry point while the new Prisma-backed tables provide the data."
      sections={[
        {
          title: 'Metadata tables',
          eyebrow: 'Catalog',
          items: [
            { label: 'Colours', description: 'Manage primary and secondary colour definitions.', href: '/api/colour' },
            { label: 'Patterns', description: 'Maintain pattern lookups used by item types.', href: '/api/pattern' },
            { label: 'Materials', description: 'Maintain material lookups used by item types.', href: '/api/material' },
          ],
        },
      ]}
    />
  );
}
