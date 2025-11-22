import React from "react";
import { guestAlerts } from "../../mockData";
import {
  AlertCircle,
  Info,
  Bell,
  CheckCircle,
  Mail,
} from "lucide-react";

export function GuestAlerts() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* MAIN CONTENT */}
      <main className="flex-1 px-4 pt-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-slate-900 mb-2 text-lg font-semibold">
              Alerts & Notifications
            </h1>
            <p className="text-slate-600 text-sm">
              Stay updated with important information about your stay
            </p>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {guestAlerts.map((alert) => {
              const badgeClasses =
                alert.status === "Resolved"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-cyan-100 text-cyan-700";

              return (
                <div
                  key={alert.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {alert.type === "error" && (
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        )}
                        {alert.type === "reminder" && (
                          <Bell className="w-5 h-5 text-yellow-500 mt-0.5" />
                        )}
                        {alert.type === "info" && (
                          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                        )}
                        <div>
                          <h2 className="text-sm font-semibold text-slate-900">
                            {alert.message}
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
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
                    <div className="flex gap-2">
                      {alert.status === "Pending" && (
                        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">
                          <CheckCircle className="w-4 h-4" />
                          Mark as Read
                        </button>
                      )}

                      {alert.type === "error" && (
                        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">
                          <Mail className="w-4 h-4" />
                          Contact Host
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {guestAlerts.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No alerts at this time</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default GuestAlerts;