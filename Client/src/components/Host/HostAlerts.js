import React from "react";
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  Mail,
} from "lucide-react";
import { hostAlerts } from "../../mockData";

export function HostAlerts() {
  const pendingCount = hostAlerts.filter((a) => a.status === "Pending").length;
  const resolvedCount = hostAlerts.filter((a) => a.status === "Resolved").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-slate-900 mb-2 text-lg font-semibold">
            Alerts & Notifications
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            System alerts and security notifications
          </p>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs md:text-sm text-slate-500">Total Alerts</p>
            </div>
            <div className="px-4 py-3">
              <div className="text-2xl md:text-3xl">{hostAlerts.length}</div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs md:text-sm text-slate-500">Pending</p>
            </div>
            <div className="px-4 py-3">
              <div className="text-2xl md:text-3xl text-yellow-600">
                {pendingCount}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs md:text-sm text-slate-500">Resolved</p>
            </div>
            <div className="px-4 py-3">
              <div className="text-2xl md:text-3xl text-green-600">
                {resolvedCount}
              </div>
            </div>
          </section>
        </div>

        {/* Alerts List */}
        <div className="space-y-3 md:space-y-4">
          {hostAlerts.map((alert) => {
            const badgeClasses =
              alert.status === "Resolved"
                ? "bg-slate-100 text-slate-700"
                : "bg-yellow-100 text-yellow-700";

            return (
              <section
                key={alert.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                      {alert.type === "failed_access" && (
                        <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      {alert.type === "system_error" && (
                        <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 mt-0.5 flex-shrink-0" />
                      )}
                      {alert.type === "unauthorized" && (
                        <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm md:text-base font-semibold break-words text-slate-900">
                          {alert.message}
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500 mt-1">
                          {alert.time}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClasses}`}
                    >
                      {alert.status}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="flex flex-col md:flex-row gap-2">
                    {alert.status === "Pending" && (
                      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">
                        <CheckCircle className="w-4 h-4" />
                        Mark as Resolved
                      </button>
                    )}

                    <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">
                      <Mail className="w-4 h-4" />
                      Notify via Email
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

export default HostAlerts;