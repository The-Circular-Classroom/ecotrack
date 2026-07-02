// @ts-nocheck
// apps\frontend\src\components\InventoryCard.js
import Image from 'next/image';

export default function InventoryCard({ item }) {
  const { itemType, sizeOption, quantity, itemStatus, storedAt } = item;

  const getStatusColor = (status) => {
    switch (status) {
      case 'GeneralOffice':
        return 'bg-teal-500 text-white';
      case 'ForSale':
        return 'bg-yellow-500 text-white';
      case 'Sold':
        return 'bg-red-500 text-white';
      case 'Donated':
        return 'bg-green-500 text-white';
      case 'ForRepurpose':
        return 'bg-orange-500 text-white';
      case 'Repurposed':
        return 'bg-green-500 text-white';
      case 'Disposed':
        return 'bg-black text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'GeneralOffice':
        return 'General Office';
      case 'ForSale':
        return 'For Sale';
      case 'Sold':
        return 'Sold';
      case 'Donated':
        return 'Donated';
      case 'ForRepurpose':
        return 'For Repurpose';
      case 'Repurposed':
        return 'Repurposed';
      case 'Disposed':
        return 'Disposed';
      default:
        return status || '—';
    }
  };

  const getStoredAtLabel = (v) => {
    switch (v) {
      case 'School':
        return 'School';
      case 'TCC':
        return 'TCC';
      default:
        return v || '—';
    }
  };

  const getColorClass = (colorName) => {
    if (!colorName) return 'bg-gray-400';
    const colorMap = {
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      orange: 'bg-orange-500',
      black: 'bg-black',
      white: 'bg-white border-2 border-gray-300',
      gray: 'bg-gray-500',
      grey: 'bg-gray-500',
      brown: 'bg-amber-700',
      navy: 'bg-blue-900',
      maroon: 'bg-red-900',
      teal: 'bg-teal-500',
      cyan: 'bg-cyan-500',
    };
    const normalized = String(colorName).toLowerCase();
    for (const [key, cls] of Object.entries(colorMap)) {
      if (normalized.includes(key)) return cls;
    }
    return 'bg-gray-400';
  };

  const categoryName = itemType?.category?.categoryName || 'Unknown Item';
  const primaryColorName = itemType?.primaryColour?.colourName || '';
  const secondaryColorName = itemType?.secondaryColour?.colourName || '';

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-100">
      {/* Top row: status + right meta */}
      <div className="px-4 pt-4 flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${getStatusColor(
            itemStatus
          )}`}
        >
          {getStatusLabel(itemStatus)}
        </span>

        <div className="w-[150px] shrink-0 text-right space-y-2">
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-500">Qty</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums">{quantity ?? 0}</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-500">Size</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-50 text-gray-700 text-xs font-medium border border-gray-200 tabular-nums">
              {sizeOption?.sizeName || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="px-4 pt-3">
        <div className="relative w-full h-44 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
          {itemType?.imageUrl ? (
            <Image
              src={itemType.imageUrl}
              alt={categoryName}
              fill
              unoptimized
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <svg className="w-14 h-14 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-4">
        <h3 className="font-semibold text-base text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem]">
          {categoryName}
        </h3>

        <div className="mt-2 text-xs text-gray-500">
          Stored at: <span className="text-gray-700">{getStoredAtLabel(storedAt)}</span>
        </div>

        {/* Colors */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 shrink-0">Primary</span>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-4 h-4 rounded-full ${getColorClass(primaryColorName)}`}
                title={primaryColorName || 'No primary color'}
              />
              <span className="text-sm text-gray-800 truncate">{primaryColorName || '—'}</span>
            </div>
          </div>

          {!!secondaryColorName && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-gray-500 shrink-0">Secondary</span>
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-4 h-4 rounded-full ${getColorClass(secondaryColorName)}`}
                  title={secondaryColorName}
                />
                <span className="text-sm text-gray-800 truncate">{secondaryColorName}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
