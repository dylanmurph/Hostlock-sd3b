import React from "react";
import { bookings, accessHistory } from "../../mockData";
import { MapPin, Calendar, Clock, Edit, XCircle, History as HistoryIcon } from "lucide-react";

function GuestBookings() {

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* MAIN CONTENT */}
      <main className="flex-1 px-4 pt-4 pb-24">
        <div className="w-full max-w-sm mx-auto space-y-4">
          {/* Header */}
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              My Bookings
            </h1>
            <p className="text-xs text-slate-500">
              View and manage your current and upcoming stays
            </p>
          </div>

          {/* Bookings List */}
          <div className="space-y-3">
            {bookings.map((booking) => {
              const statusClasses =
                booking.status === "Active"
                  ? "bg-emerald-100 text-emerald-700"
                  : booking.status === "Completed"
                    ? "bg-slate-100 text-slate-700"
                    : "bg-red-100 text-red-700";

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          {booking.propertyName}
                        </h2>
                        <div className="flex items-start gap-2 mt-1 text-xs text-slate-600">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          <span>{booking.propertyAddress}</span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClasses}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 py-3 space-y-3 text-xs text-slate-700">
                    {/* Dates / Code */}
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-3.5 h-3.5 mt-0.5 text-cyan-500" />
                        <div>
                          <div>
                            <span className="font-medium">Check-in:&nbsp;</span>
                            {booking.checkIn}
                          </div>
                          <div>
                            <span className="font-medium">Check-out:&nbsp;</span>
                            {booking.checkOut}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-cyan-500" />
                        <div>
                          <span className="text-slate-500 mr-1">
                            Booking Code:
                          </span>
                          <span className="font-medium">
                            {booking.bookingCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions for Active bookings */}
                    {booking.status === "Active" && (
                      <div className="flex flex-col gap-2 pt-1">
                        {/* Edit Booking (inline card instead of dialog) */}
                        <details className="border border-slate-200 rounded-lg">
                          <summary className="flex items-center gap-1 px-3 py-2 text-xs cursor-pointer select-none">
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit Booking
                          </summary>
                          <div className="px-3 pb-3 pt-1 space-y-3 text-xs">
                            <div>
                              <label className="block text-[11px] text-slate-600 mb-1">
                                Contact Email
                              </label>
                              <input
                                type="email"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                placeholder="email@example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-600 mb-1">
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                placeholder="+353 8X XXX XXXX"
                              />
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Changing check-in/check-out dates requires host
                              approval. Your host will be notified of any
                              changes.
                            </p>
                            <button className="w-full px-3 py-2 rounded-lg bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-700">
                              Save Changes
                            </button>
                          </div>
                        </details>

                        {/* Access history (inline collapsible) */}
                        <details className="border border-slate-200 rounded-lg">
                          <summary className="flex items-center gap-1 px-3 py-2 text-xs cursor-pointer select-none">
                            <HistoryIcon className="w-3.5 h-3.5 mr-1" />
                            Access History
                          </summary>
                          <div className="px-3 pb-3 pt-1 max-h-64 overflow-auto space-y-2">
                            {accessHistory.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-2 h-2 rounded-full ${log.status === "Success"
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                        }`}
                                    />
                                    <span className="text-xs">
                                      {log.timestamp}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1">
                                    {log.method} - {log.location}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${log.status === "Success"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-red-100 text-red-700"
                                    }`}
                                >
                                  {log.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>

                        {/* Cancel booking (UI only) */}
                        <button className="mt-1 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 self-end">
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default GuestBookings;