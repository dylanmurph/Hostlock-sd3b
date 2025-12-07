import React, { useEffect, useState } from "react";
import api from "../../api";
import { Calendar, Clock, History as HistoryIcon, XCircle } from "lucide-react";

import CancelConfirmationModal from './CancelConfirmationModal';

function GuestBookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [accessLogs, setAccessLogs] = useState({}); // store logs by booking code
  const [bnbs, setBnbs] = useState({}); // store bnb info by id
  const [loading, setLoading] = useState(true);

  const [bookingToCancel, setBookingToCancel] = useState(null);

  useEffect(() => {
    async function fetchBookingsAndLogs() {
      try {
        // Fetch bookings
        const res = await api.get("/guest/get/booking");
        setBookings(res.data);

        if (res.data.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch BnB info
        const bnbIds = [...new Set(res.data.map((b) => b.bnb_id))];
        const bnbPromises = bnbIds.map((id) => api.get(`/bnbs/${id}`));
        const bnbResults = await Promise.all(bnbPromises);
        const bnbMap = {};
        bnbResults.forEach((r) => {
          bnbMap[r.data.id] = r.data;
        });
        setBnbs(bnbMap);

        // Fetch access logs per booking
        const historyPromises = res.data.map(async (b) => {
          const logRes = await api.get(
            `/guest/access/${b.bookingCode}/history`
          );
          const logs = logRes.data.map((log) => ({
            timestamp: log.timestamp,
            status: log.status || "Unknown",
            user: log.user || "Unknown",
            method: log.method || "Unknown",
            fob: log.fob || null,
            snapshot: log.snapshot || null,
          }));
          return { [b.bookingCode]: logs };
        });

        const logsArray = await Promise.all(historyPromises);
        setAccessLogs(Object.assign({}, ...logsArray));
      } catch (err) {
        console.error(
          "Failed to fetch bookings or logs:",
          err.response || err.message
        );
      } finally {
        setLoading(false);
      }
    }

    fetchBookingsAndLogs();
  }, []);

  // Triggers the modal
  const handleCancelBooking = (booking) => {
    setBookingToCancel(booking);
  };

  // Handles the API call after modal confirmation
  const handleExecuteCancel = async () => {
    const bookingCode = bookingToCancel.bookingCode;
    setBookingToCancel(null); // Close the modal immediately

    try {
      await api.delete(`/guest/booking/${bookingCode}`);

      // Remove from local state
      setBookings((prev) =>
        prev.filter((b) => b.bookingCode !== bookingCode)
      );

      setAccessLogs((prev) => {
        const clone = { ...prev };
        delete clone[bookingCode];
        return clone;
      });
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      alert(
        err.response?.data?.error || "Failed to cancel booking. Try again later."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 px-4 pt-4 pb-24">
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              My Bookings
            </h1>
            <p className="text-xs text-slate-500">
              View your current and upcoming stays
            </p>
          </div>

          {loading && (
            <p className="text-xs text-slate-500 text-center">Loading…</p>
          )}

          {!loading && bookings.length === 0 && (
            <p className="text-xs text-slate-500 text-center">
              You have no bookings yet.
            </p>
          )}

          {bookings.map((booking) => {
            const bnb = bnbs[booking.bnb_id] || {};
            return (
              <div
                key={booking.bookingCode}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {bnb.name || "Loading..."}
                    </h2>
                  </div>
                </div>

                <div className="px-4 py-3 space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 mt-0.5 text-cyan-500" />
                    <div>
                      <div>
                        <span className="font-medium">Check-in:&nbsp;</span>
                        {booking.checkIn} {booking.checkInTime}
                      </div>
                      <div>
                        <span className="font-medium">Check-out:&nbsp;</span>
                        {booking.checkOut} {booking.checkOutTime}
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

                  {/* Access History */}
                  {accessLogs[booking.bookingCode] && (
                    <details className="border border-slate-200 rounded-lg">
                      <summary className="flex items-center gap-1 px-3 py-2 text-xs cursor-pointer select-none">
                        <HistoryIcon className="w-3.5 h-3.5 mr-1" />
                        Access History
                      </summary>
                      <div className="px-3 pb-3 pt-1 max-h-64 overflow-auto space-y-2">
                        {accessLogs[booking.bookingCode].map((log, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    log.status === "Success"
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                />
                                <span className="text-xs">
                                  {log.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                {log.method} - {log.user}
                              </p>
                              {log.fob && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Fob ID: {log.fob}
                                </p>
                              )}
                            </div>
                            {log.snapshot && (
                              <img
                                src={log.snapshot}
                                alt="Snapshot"
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            )}
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                log.status === "Success"
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
                  )}

                  <button
                    onClick={() => handleCancelBooking(booking)}
                    className="mt-1 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 self-end"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Booking
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      
      {/* Render the modal when bookingToCancel is set */}
      {bookingToCancel && (
          <CancelConfirmationModal
              bookingCode={bookingToCancel.bookingCode}
              bnbName={bnbs[bookingToCancel.bnb_id]?.name || 'Booking'}
              onConfirm={handleExecuteCancel} // Execute cancellation
              onCancel={() => setBookingToCancel(null)} // Close modal
          />
      )}
    </div>
  );
}

export default GuestBookings;