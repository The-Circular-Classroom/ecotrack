// apps\frontend\src\components\InventoryListItem.js

export default function InventoryListItem({ item }) {
  const { sizeOption, quantity, itemStatus, storedAt } = item;

  const getStatusColor = (status) => {
    switch (status) {
      case 'GeneralOffice':
        return 'bg-teal-500 text-white';
      case 'ForSale':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-300';
      case 'Sold':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'Donated':
        return 'bg-green-50 text-green-700 border border-green-300';
      case 'ForRepurpose':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Repurposed':
        return 'bg-green-50 text-green-700 border border-green-300';
      case 'Disposed':
        return 'bg-gray-100 text-gray-700 border border-gray-300';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200';
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

  return (
    <div className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      {/* Status */}
      <span
        className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${getStatusColor(itemStatus)}`}
      >
        {getStatusLabel(itemStatus)}
      </span>

      {/* Size */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500">Size</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-50 text-gray-700 text-xs font-medium border border-gray-200 tabular-nums">
          {sizeOption?.sizeName || 'N/A'}
        </span>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500">Qty</span>
        <span className="text-sm font-semibold text-gray-900 tabular-nums">{quantity ?? 0}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-xs text-gray-500">Stored at</span>
        <span className="text-sm text-gray-800">{getStoredAtLabel(storedAt)}</span>
      </div>
    </div>
  );
}