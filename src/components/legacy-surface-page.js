import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';

export function LegacySurfacePage({
  activePath,
  eyebrow,
  title,
  description,
  sections = [],
  footer,
}) {
  return (
    <AppShell activePath={activePath} eyebrow={eyebrow} title={title} description={description}>
      {sections.map((section) => (
        <SectionCard key={section.title} title={section.title} eyebrow={section.eyebrow} footer={section.footer}>
          <div className="route-stack">
            {section.items.map((item) => (
              <div className="info-tile" key={item.label}>
                <strong className="info-tile__label">{item.label}</strong>
                <span>{item.description}</span>
                {item.href ? <Link href={item.href}>{item.linkLabel || 'Open page'}</Link> : null}
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
      {footer}
    </AppShell>
  );
}