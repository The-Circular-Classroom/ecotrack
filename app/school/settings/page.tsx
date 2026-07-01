// @ts-nocheck
"use client";

export default function Settings() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your system preferences</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>SGD</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked />
                <span className="text-gray-700">Low stock alerts</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked />
                <span className="text-gray-700">Order notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" />
                <span className="text-gray-700">Email reports</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-6 py-2 rounded-lg transition-colors" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }} onMouseOver={(e) => e.target.style.backgroundColor = 'var(--button-hover)'} onMouseOut={(e) => e.target.style.backgroundColor = 'var(--button-bg)'}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
