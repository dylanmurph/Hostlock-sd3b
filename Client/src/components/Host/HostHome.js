import React, { useState, useEffect } from 'react';
import api from '../api'; // your axios instance with baseURL & auth

// --- mock alerts ---
const hostAlerts = [
  {
    id: 1,
    type: 'failed_access',
    message: '3 failed access attempts at Apartment 3B',
    status: 'Pending',
    time: '2025-11-06 09:58',
  },
  {
    id: 2,
    type: 'system_error',
    message: 'Door sensor offline at Main Entrance',
    status: 'Resolved',
    time: '2025-11-05 21:15',
  },
  {
    id: 3,
    type: 'unauthorized',
    message: 'Unauthorized NFC detected',
    status: 'Pending',
    time: '2025-11-05 18:42',
  },
];

const HostHome = () => {
  const [guests, setGuests] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuestsAndLogs = async () => {
      try {
        // Fetch all bookings for the host
        const res = await api.get("/host/get/bookings");
        const bookings = res.data || [];
        setGuests(bookings);

        // Fetch access logs for each booking
        const logsPromises = bookings.map(async (b) => {
          const logRes = await api.get(`/guest/access/${b.bookingCode}/history`);
          return logRes.data.map(log => ({
            bookingCode: b.bookingCode,
            timestamp: log.timestamp,
            status: log.status,
            user: log.user || "Unknown",
            method: log.method || "Unknown",
            fob: log.fob || null,
            snapshot: log.snapshot || null
          }));
        });

        const allLogs = await Promise.all(logsPromises);
        setAccessLogs(allLogs.flat()); // flatten array
      } catch (err) {
        console.error("Failed to fetch bookings or logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestsAndLogs();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  const activeGuests = guests.filter((g) => g.status === 'Active').length;
  const failedAttempts = accessLogs.filter((log) => log.status === 'Failed').length;
  const pendingAlerts = hostAlerts.filter((a) => a.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-slate-900 mb-2 text-lg md:text-2xl font-semibold">
            Dashboard
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Overview of your property access system
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 flex flex-col justify-between border border-slate-100">
            <p className="text-xs md:text-sm text-slate-500 mb-1">Current Guests</p>
            <div className="text-2xl md:text-3xl font-semibold">{activeGuests}</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 flex flex-col justify-between border border-slate-100">
            <p className="text-xs md:text-sm text-slate-500 mb-1">Failed Attempts (24h)</p>
            <div className="text-2xl md:text-3xl font-semibold text-red-600">
              {failedAttempts}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 flex flex-col justify-between border border-slate-100">
            <p className="text-xs md:text-sm text-slate-500 mb-1">System Status</p>
            <div className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs md:text-sm text-green-700 font-medium">Online</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 flex flex-col justify-between border border-slate-100">
            <p className="text-xs md:text-sm text-slate-500 mb-1">Pending Alerts</p>
            <div className="text-2xl md:text-3xl font-semibold text-yellow-600">
              {pendingAlerts}
            </div>
          </div>
        </div>

        {/* Recent alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="border-b px-4 py-3 md:px-5 md:py-4">
            <h2 className="text-base md:text-lg font-semibold">Recent Alerts</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Latest notifications requiring attention
            </p>
          </div>
          <div className="p-3 md:p-4 space-y-3">
            {hostAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between p-3 bg-slate-50 rounded-xl gap-2"
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-xs md:text-sm break-words">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                    alert.status === 'Resolved'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-sky-500 text-white'
                  }`}
                >
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HostHome;