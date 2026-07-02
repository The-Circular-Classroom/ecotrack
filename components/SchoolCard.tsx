// @ts-nocheck
import Image from 'next/image';

const toTitleCase = (str) => {
  if (!str) return str;
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
};

export default function SchoolCard({ school, onClick }) {
  const totalItems = school.totalQuantity || 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer hover:border-gray-200 p-4 flex items-center gap-4"
    >
      {/* School Logo */}
      <div className="flex-shrink-0 w-20 h-20 relative rounded-xl overflow-hidden">
        {school.logoUrl ? (
          <Image
            src={school.logoUrl}
            alt={school.schoolName}
            fill
            unoptimized
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-main)] to-[var(--color-main-hover)] flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base text-gray-900 truncate mb-1">
          {toTitleCase(school.schoolName)}
        </h3>
        <p className="text-sm text-gray-500">{totalItems.toLocaleString()} items</p>
      </div>
    </div>
  );
}
