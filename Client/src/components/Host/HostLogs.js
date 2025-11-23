import React from "react";
import { Filter } from "lucide-react";
import { accessLogs } from "../../mockData";

export function HostLogs() {
  const successCount = accessLogs.filter((l) => l.status === "Success").length;
  const failedCount = accessLogs.filter((l) => l.status === "Failed").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">

        {/* Header + Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-slate-900 mb-2 text-lg font-semibold">
              Access Logs
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              Complete timeline of all access events
            </p>
          </div>

          {/* Only Filter button now */}
          <div className="flex gap-2">
            <button className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs md:text-sm text-slate-500">
                Total Attempts Today
              </p>
            </div>
            <div className="px-4 py-3">
              <div className="text-2xl md:text-3xl">{accessLogs.length}</div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs md:text-sm text-slate-500">Successful</p>
            </div>
            <div className="px-4 py-3">
              <div className="text-2xl md:text-3xl text-green-600">
                {successCount}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs md:text-sm text-slate-500">Failed</p>
            </div>
            <div className="px-4 py-3">
              <div className="text-2xl md:text-3xl text-red-600">
                {failedCount}
              </div>
            </div>
          </section>
        </div>

        {/* Logs Table - Desktop */}
        <section className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 pt-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Access Events
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              All access attempts across your properties
            </p>
          </div>
          <div className="px-4 pb-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Guest Name</th>
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {accessLogs.map((log) => {
                  const dotClass =
                    log.status === "Success" ? "bg-green-500" : "bg-red-500";
                  const badgeClasses =
                    log.status === "Success"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700";

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-slate-100 last:border-none"
                    >
                      <td className="py-2 pr-4">{log.time}</td>
                      <td className="py-2 pr-4">{log.guestName}</td>
                      <td className="py-2 pr-4 text-sm">{log.property}</td>
                      <td className="py-2 pr-4 text-sm">{log.method}</td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClasses}`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Logs Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {accessLogs.map((log) => {
            const badgeClasses =
              log.status === "Success"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700";

            return (
              <section
                key={log.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {log.guestName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {log.property}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClasses}`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time:</span>
                      <span>{log.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method:</span>
                      <span className="text-right">{log.method}</span>
                    </div>
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

export default HostLogs;