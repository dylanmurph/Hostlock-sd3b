import React, { useEffect, useState } from "react";
import api from "../../api";
import { Calendar, Clock, History as HistoryIcon, XCircle } from "lucide-react";

function GuestBookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [accessLogs, setAccessLogs] = useState({}); // store logs by booking code
  const [bnbs, setBnbs] = useState({}); // store bnb info by id

  useEffect(() => {
    async function fetchBookingsAndLogs() {
      try {
        // Fetch bookings
        const res = await api.get("/guest/get/booking");
        setBookings(res.data);

        // Fetch BnB info
        const bnbIds = [...new Set(res.data.map(b => b.bnb_id))];
        const bnbPromises = bnbIds.map(id => api.get(`/bnbs/${id}`));
        const bnbResults = await Promise.all(bnbPromises);
        const bnbMap = {};
        bnbResults.forEach(r => { bnbMap[r.data.id] = r.data; });
        setBnbs(bnbMap);

        // Fetch access logs
        const historyPromises = res.data.map(async (b) => {
          const logRes = await api.get(`/guest/booking/${b.bookingCode}/history`);
          // transform logs to match access_logs table
          const logs = logRes.data.map(log => ({
            timestamp: log.time_logged,
            status: log.match_result === "match" ? "Success" : "Failed",
            user: log.recognized_user?.name || "Unknown",
            method: log.event_type || "Unknown",
            fob: log.fob_id || null,
            snapshot: log.snapshot_path || null
          }));
          return { [b.bookingCode]: logs };
        });

        const logsArray = await Promise.all(historyPromises);
        setAccessLogs(Object.assign({}, ...logsArray));

      } catch (err) {
        console.error("Failed to fetch bookings or logs:", err.response || err.message);
      }
    }

    fetchBookingsAndLogs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 px-4 pt-4 pb-24">
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div>
            <h1 className="text-base font-semibold text-slate-900">My Bookings</h1>
            <p className="text-xs text-slate-500">View your current and upcoming stays</p>
          </div>

          {bookings.map((booking) => {
            const bnb = bnbs[booking.bnb_id] || {};
            return (
              <div key={booking.bookingCode} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">{bnb.name || "Loading..."}</h2>
                  </div>
                </div>

                <div className="px-4 py-3 space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 mt-0.5 text-cyan-500" />
                    <div>
                      <div><span className="font-medium">Check-in:&nbsp;</span>{booking.checkIn} {booking.checkInTime}</div>
                      <div><span className="font-medium">Check-out:&nbsp;</span>{booking.checkOut} {booking.checkOutTime}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-500" />
                    <div>
                      <span className="text-slate-500 mr-1">Booking Code:</span>
                      <span className="font-medium">{booking.bookingCode}</span>
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
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${log.status === "Success" ? "bg-green-500" : "bg-red-500"}`} />
                                <span className="text-xs">{log.timestamp}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{log.method} - {log.user}</p>
                              {log.fob && <p className="text-xs text-slate-400 mt-0.5">Fob ID: {log.fob}</p>}
                            </div>
                            {log.snapshot && (
                              <img src={log.snapshot} alt="Snapshot" className="w-12 h-12 object-cover rounded-md" />
                            )}
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${log.status === "Success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {log.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <button className="mt-1 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 self-end">
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Booking
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default GuestBookings;