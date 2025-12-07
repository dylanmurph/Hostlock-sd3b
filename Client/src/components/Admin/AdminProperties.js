import { useState } from 'react';
import { adminProperties, adminHosts } from "../../mockData";
import { Search, Building2, Trash2, Edit, Plus } from 'lucide-react';

export function AdminProperties() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hostFilter, setHostFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredProperties = adminProperties.filter((property) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      property.name.toLowerCase().includes(q) ||
      property.hostName.toLowerCase().includes(q);
    const matchesHost = hostFilter === 'all' || property.hostId === hostFilter;
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesHost && matchesStatus;
  });

  return (
    <>
      {/* Add Property Modal */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Add New Property</h2>
              <p className="text-sm text-slate-500">Enter the details of the new property</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Property Name</label>
                <input
                  placeholder="Sunset Beach Villa"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Assign to Host</label>
                <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900">
                  <option value="">Select a host</option>
                  {adminHosts
                    .filter((h) => h.status === 'Active')
                    .map((host) => (
                      <option key={host.id} value={host.id}>
                        {host.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">NFC Devices</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="2"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Cameras</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="3"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  defaultValue="Active"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsAddDialogOpen(false)}
                className="px-3 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={() => setIsAddDialogOpen(false)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-gradient-to-r from-slate-950 to-slate-900 text-cyan-400 hover:from-slate-900 hover:to-slate-800"
              >
                <Plus className="w-4 h-4" />
                Add Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-slate-900 mb-2 text-xl md:text-2xl font-semibold">Property Management</h1>
            <p className="text-slate-600 text-sm md:text-base">Manage all properties across hosts</p>
          </div>

          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-gradient-to-r from-slate-950 to-slate-900 hover:from-slate-900 hover:to-slate-800 text-cyan-400"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        </div>

        {/* Search + Filters */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="p-4 pt-5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                placeholder="Search by property name or host..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={hostFilter}
                onChange={(e) => setHostFilter(e.target.value)}
                className="w-full sm:flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Hosts</option>
                {adminHosts.map((host) => (
                  <option key={host.id} value={host.id}>
                    {host.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-[180px] rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Property Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm"
            >
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold truncate">{property.name}</h2>
                      <p className="text-xs text-slate-500 truncate mt-1">{property.hostName}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center rounded-full text-xs px-2 py-1 ${
                        property.status === 'Active'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {property.status}
                    </span>

                    <div className="flex gap-2">
                      <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Removed Address Section */}
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                  <div className="text-center">
                    <p className="text-lg font-semibold">{property.activeGuests}</p>
                    <p className="text-xs text-slate-500">Guests</p>
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-semibold">{property.nfcDevices}</p>
                    <p className="text-xs text-slate-500">NFC</p>
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-semibold">{property.cameras}</p>
                    <p className="text-xs text-slate-500">Cameras</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="py-12 text-center text-slate-500 text-sm">
              No properties found matching your search criteria
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminProperties;