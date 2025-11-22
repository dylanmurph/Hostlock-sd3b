  import React from 'react';

  // --- mock data ---
  const hostGuests = [
    { id: 1, name: 'John Doe', status: 'Active' },
    { id: 2, name: 'Jane Smith', status: 'Active' },
    { id: 3, name: 'Alex Johnson', status: 'Checked Out' },
  ];

  const accessLogs = [
    {
      id: 1,
      guestName: 'James Bond',
      property: 'Apartment 3B',
      method: 'NFC + Facial Recognition',
      status: 'Success',
      time: '2025-11-06 10:24',
    },
    {
      id: 2,
      guestName: 'Sarah Connor',
      property: 'Apartment 3B',
      method: 'NFC',
      status: 'Failed',
      time: '2025-11-06 09:58',
    },
    {
      id: 3,
      guestName: 'Jane Smith',
      property: 'Penthouse',
      method: 'Apple Wallet',
      status: 'Success',
      time: '2025-11-05 22:13',
    },
  ];

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

  // --- component ---
  const HostHome = () => {
    const activeGuests = hostGuests.filter((g) => g.status === 'Active').length;
    const failedAttempts = accessLogs.filter(
      (log) => log.status === 'Failed' && log.time.startsWith('2025-11-06')
    ).length;
    const pendingAlerts = hostAlerts.filter((a) => a.status === 'Pending').length;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* MAIN CONTENT */}
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
    )
  }

  export default HostHome;