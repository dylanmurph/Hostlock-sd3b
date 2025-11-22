import React, { useState } from "react";
import { hostGuests } from "../../mockData";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Key,
} from "lucide-react";

export function HostGuests() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGuests = hostGuests.filter(
    (guest) =>
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header + Add guest */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-slate-900 mb-2 text-lg font-semibold">
              Guest Management
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              Manage guest access and bookings
            </p>
          </div>

          {/* “Dialog” as collapsible add form */}
          <details className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
            <summary className="flex items-center justify-center gap-2 px-4 py-2 cursor-pointer text-sm font-medium text-slate-800">
              <Plus className="w-4 h-4" />
              Add Guest
            </summary>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  Full Name
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  Booking Code
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="BK-2025-XXXX"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">
                    Check-in
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">
                    Check-out
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  NFC ID
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="NFC-XXXX-XX"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  Property
                </label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option>Sunset Beach Villa</option>
                  <option>Downtown Loft</option>
                  <option>Mountain Retreat Cabin</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  Upload Photo
                </label>
                <button className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">
                  Choose File
                </button>
              </div>
              <button className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700">
                Add Guest
              </button>
            </div>
          </details>
        </div>

        {/* Search Bar */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Search by name, booking code..."
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Guests Table - Desktop */}
        <section className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 pt-4">
            <h2 className="text-sm font-semibold text-slate-900">All Guests</h2>
            <p className="text-xs text-slate-500 mb-4">
              {filteredGuests.length} guests found
            </p>
          </div>
          <div className="px-4 pb-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Booking Code</th>
                  <th className="py-2 pr-4">Check-in / Check-out</th>
                  <th className="py-2 pr-4">NFC ID</th>
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => {
                  const badgeClasses =
                    guest.status === "Active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700";

                  return (
                    <tr
                      key={guest.id}
                      className="border-b border-slate-100 last:border-none"
                    >
                      <td className="py-2 pr-4">{guest.name}</td>
                      <td className="py-2 pr-4">{guest.bookingCode}</td>
                      <td className="py-2 pr-4">
                        <div className="text-xs">
                          <div>{guest.checkIn}</div>
                          <div className="text-slate-500">
                            {guest.checkOut}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-4">{guest.nfcId}</td>
                      <td className="py-2 pr-4">{guest.property}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClasses}`}
                        >
                          {guest.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-1">
                          <button className="p-1 rounded hover:bg-slate-100">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 rounded hover:bg-slate-100">
                            <Key className="w-4 h-4" />
                          </button>
                          <button className="p-1 rounded text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Guests Cards - Mobile */}
        <div className="md:hidden space-y-3">
          <div className="text-sm text-slate-600 px-1">
            {filteredGuests.length} guests found
          </div>
          {filteredGuests.map((guest) => {
            const badgeClasses =
              guest.status === "Active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700";

            return (
              <section
                key={guest.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{guest.name}</p>
                      <p className="text-xs text-slate-500">
                        {guest.bookingCode}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClasses}`}
                    >
                      {guest.status}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Check-in:</span>
                      <span>{guest.checkIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Check-out:</span>
                      <span>{guest.checkOut}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">NFC ID:</span>
                      <span>{guest.nfcId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Property:</span>
                      <span className="text-right">{guest.property}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">
                      <Key className="w-4 h-4" />
                      Access
                    </button>
                    <button className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default HostGuests;