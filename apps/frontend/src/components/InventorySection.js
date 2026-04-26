// apps/frontend/src/components/InventorySection.js
import { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa6";
import InventoryTable from "./InventoryTable";

export default function InventorySection({ title, items = [], onRowClick }) {
  const [expanded, setExpanded] = useState(false);

  if (!items.length) return null;

  const total = items.reduce((s, r) => s + (r.quantity || 0), 0);
  const sizeCount = new Set(items.map((r) => r.sizeOption?.sizeName).filter(Boolean)).size;

  const maleItems = items.filter((r) => r.itemType?.gender === "Male");
  const femaleItems = items.filter((r) => r.itemType?.gender === "Female");
  const unisexItems = items.filter((r) => !r.itemType?.gender || r.itemType?.gender === "Unisex");

  const genderGroups = [
    { label: "Male", items: maleItems },
    { label: "Female", items: femaleItems },
    { label: "Unisex", items: unisexItems },
  ].filter((g) => g.items.length > 0);

  const hasMultipleGenders = genderGroups.length > 1;

  return (
    <div className="mb-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <FaChevronDown className="text-gray-400 text-xs" />
          ) : (
            <FaChevronRight className="text-gray-400 text-xs" />
          )}
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {hasMultipleGenders && genderGroups.map((g) => (
            <span key={g.label}>
              {g.label}: <span className="font-semibold text-gray-900">
                {g.items.reduce((s, r) => s + (r.quantity || 0), 0)}
              </span>
            </span>
          ))}
          <span><span className="font-semibold text-gray-900">{total}</span> items</span>
          <span>{sizeCount} {sizeCount === 1 ? "size" : "sizes"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 pt-2">
          {hasMultipleGenders ? (
            genderGroups.map((g) => (
              <div key={g.label} className="mb-4 last:mb-0">
                <h4 className="text-sm font-medium text-gray-600 mb-2">{g.label}</h4>
                <InventoryTable items={g.items} onRowClick={onRowClick} />
              </div>
            ))
          ) : (
            <InventoryTable items={items} onRowClick={onRowClick} />
          )}
        </div>
      )}
    </div>
  );
}