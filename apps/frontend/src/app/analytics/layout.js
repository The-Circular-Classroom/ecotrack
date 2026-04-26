// apps/frontend/src/app/analytics/layout.js
import AnalyticsNav from '@/components/AnalyticsNav';

export default function AnalyticsLayout({ children }) {
  return (
    <>
      {/* Analytics-specific tab navigation (replaces the inventory NavigationTabs) */}
      <AnalyticsNav />

      {/* Page content — root layout already manages overflow/bg */}
      {children}
    </>
  );
}
