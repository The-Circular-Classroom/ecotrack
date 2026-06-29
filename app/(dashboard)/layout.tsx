import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/overview', label: 'Overview' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/donations', label: 'Donations' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/csv-upload', label: 'CSV Upload' },
  { href: '/users', label: 'Users', adminOnly: true },
  { href: '/settings', label: 'Settings' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: '240px',
          backgroundColor: '#1a1a2e',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem 0',
        }}
      >
        <div
          style={{
            padding: '0 1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '1rem',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>
            EcoTrack
          </h1>
          <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0', opacity: 0.7 }}>
            The Circular Classroom
          </p>
        </div>

        <nav style={{ flex: 1 }}>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '0.625rem 1.25rem',
                    color: 'rgba(255,255,255,0.85)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    borderRadius: '0 4px 4px 0',
                    transition: 'background-color 0.15s',
                  }}
                  data-admin-only={item.adminOnly || undefined}
                >
                  {item.label}
                  {item.adminOnly && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.625rem',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '3px',
                        verticalAlign: 'middle',
                      }}
                    >
                      Admin
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: '56px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1.5rem',
            backgroundColor: '#fff',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Dashboard
          </span>
        </header>

        <main style={{ flex: 1, padding: '1.5rem', backgroundColor: '#f9fafb' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
