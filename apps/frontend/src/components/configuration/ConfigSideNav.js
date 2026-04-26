"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function normalizePath(p) {
  if (!p) return "/";
  let out = p.replace(/\/+$/, "");
  if (out === "") out = "/";
  return out;
}

const menuItems = [
  { label: "Item Type Preset", href: "/configuration/itemtype-preset" },
  { label: "Category / Tag", href: "/configuration/category-tag" },
  {
    label: "Colour / Pattern / Material",
    href: "/configuration/colour-pattern-material",
  },
  { label: "Brand", href: "/configuration/brand" },
];

export default function ConfigSideNav() {
  const pathnameRaw = usePathname();
  const pathname = useMemo(() => normalizePath(pathnameRaw), [pathnameRaw]);

  const getMenuClass = (href) => {
    const baseClass =
      "block w-full text-left px-3 py-2.5 text-sm rounded-md transition-all duration-200";

    if (href === "") {
      return `${baseClass} font-normal text-[#b3b3b3] cursor-not-allowed`;
    }
    if (pathname === href) {
      return `${baseClass} font-medium bg-[var(--header-hover)] text-[var(--color-main)] cursor-pointer`;
    }
    return `${baseClass} font-normal text-[#737373] hover:bg-[var(--header-hover)] hover:text-[var(--color-main)] cursor-pointer`;
  };

  return (
    <aside className="w-full">
      <ul className="list-none p-0 m-0">
        {menuItems.map((item) => (
          <li key={item.href || item.label} className="m-0">
            {item.href === "" ? (
              <button className={getMenuClass(item.href)} disabled>
                {item.label}
              </button>
            ) : (
              <Link href={item.href} className={getMenuClass(item.href)}>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
