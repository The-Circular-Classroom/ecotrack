// @ts-nocheck
'use client'

import { useState } from 'react'

/**
 * FilterButton - A dropdown filter panel with configurable filter fields.
 *
 * Props:
 * - filters: object with current filter values (e.g. { storedAt: '', itemStatus: '', schoolId: '' })
 * - onFilterChange: (key: string, value: string) => void
 * - onClearFilters: () => void
 */
export default function FilterButton({ filters, onFilterChange, onClearFilters }) {
  const [isOpen, setIsOpen] = useState(false)

  const hasActiveFilters = filters.storedAt || filters.itemStatus || filters.schoolId

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--button-bg)] text-[var(--button-text)] rounded-lg hover:bg-[var(--button-hover)] transition-colors shadow-md"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Toggle filters"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="font-medium">Filters</span>
        {hasActiveFilters && (
          <span className="bg-white text-[var(--button-bg)] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {[filters.storedAt, filters.itemStatus, filters.schoolId].filter(Boolean).length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Filter Panel */}
          <div
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-20 border border-gray-200"
            role="dialog"
            aria-label="Filter options"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Storage Location Filter */}
                <div>
                  <label htmlFor="filter-storedAt" className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Location
                  </label>
                  <select
                    id="filter-storedAt"
                    value={filters.storedAt}
                    onChange={(e) => onFilterChange('storedAt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-main)] focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    <option value="School">School</option>
                    <option value="SponsorOffice">Sponsor Office</option>
                  </select>
                </div>

                {/* Item Status Filter */}
                <div>
                  <label htmlFor="filter-itemStatus" className="block text-sm font-medium text-gray-700 mb-2">
                    Item Status
                  </label>
                  <select
                    id="filter-itemStatus"
                    value={filters.itemStatus}
                    onChange={(e) => onFilterChange('itemStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-main)] focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="ForSale">For Sale</option>
                    <option value="Sold">Sold</option>
                    <option value="Donated">Donated</option>
                  </select>
                </div>

                {/* School ID Filter */}
                <div>
                  <label htmlFor="filter-schoolId" className="block text-sm font-medium text-gray-700 mb-2">
                    School ID
                  </label>
                  <input
                    id="filter-schoolId"
                    type="number"
                    value={filters.schoolId}
                    onChange={(e) => onFilterChange('schoolId', e.target.value)}
                    placeholder="Enter school ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-main)] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    onClearFilters()
                    setIsOpen(false)
                  }}
                  disabled={!hasActiveFilters}
                  className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-sm text-white bg-[var(--button-bg)] rounded-lg hover:bg-[var(--button-hover)] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
