'use client';

import Link from 'next/link';

export default function AnalyticsConfigSectionNav({ activeSection }) {
  const getMenuClass = (section) => {
    const baseClass =
      'block w-full text-left px-3 py-2.5 text-sm rounded-md transition-all duration-200';

    if (activeSection === section) {
      return `${baseClass} font-medium bg-[var(--header-hover)] text-[var(--color-main)] cursor-pointer`;
    }

    return `${baseClass} font-normal text-[#737373] hover:bg-[var(--header-hover)] hover:text-[var(--color-main)] cursor-pointer`;
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 w-full lg:w-52 lg:min-w-52 lg:shrink-0 h-fit lg:sticky lg:top-6">
      <aside className="w-full">
        <ul className="list-none p-0 m-0">
          <li className="m-0">
            <Link
              href="/analytics/configuration/products"
              className={getMenuClass('catalog')}
            >
              Catalog
            </Link>
          </li>
          <li className="m-0">
            <Link
              href="/analytics/configuration/recipes"
              className={getMenuClass('manage-recipes')}
            >
              Recipes
            </Link>
          </li>
        </ul>
      </aside>
    </div>
  );
}
