import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/', label: 'Overview' },
  { href: '/auth', label: 'Auth' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/csv', label: 'CSV' },
  { href: '/transaction', label: 'Transactions' },
  { href: '/donation-drives', label: 'Drives' },
  { href: '/configuration', label: 'Config' },
  { href: '/faq', label: 'FAQ' },
  { href: '/users', label: 'Users' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ activePath, title, eyebrow, description, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="topbar__brand">EcoTrack Unified</p>
          <p className="topbar__tag">Vercel + Supabase migration workspace</p>
        </div>
        <nav className="topbar__nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === activePath;
            return (
              <Link
                key={item.href}
                className={isActive ? 'topbar__link topbar__link--active' : 'topbar__link'}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="shell-main">
        <section className="hero-panel">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {description ? <p className="hero-panel__description">{description}</p> : null}
        </section>

        <div className="content-grid">{children}</div>
      </main>
    </div>
  );
}
