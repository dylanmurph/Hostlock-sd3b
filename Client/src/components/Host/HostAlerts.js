import React, { useState, useEffect } from "react";
import api from "../../api";
import {
  AlertTriangle,
  CheckCircle,
  Bell,
} from "lucide-react";

function mapApiAlertsToUI(apiAlerts) {
  return apiAlerts.map((alert) => {
    const alertType = "unauthorized";
    const status = "Pending";

    return {
      id: alert.alertId,
      message: `${alert.bnbName}: ${alert.message}`,
      time: alert.triggeredAt,
      status: status,
      type: alertType,
      bnbId: alert.bnbId,
    };
  });
}

export function HostAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derived counts
  const pendingCount = alerts.filter((a) => a.status === "Pending").length;
  const resolvedCount = alerts.filter((a) => a.status === "Resolved").length;

  useEffect(() => {
    /**
     * Fetches all tamper alerts for the current host's BnBs.
     * Route: GET /host/get/alerts
     */
    async function fetchHostAlerts() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/host/get/alerts");
        const mappedAlerts = mapApiAlertsToUI(res.data);
        setAlerts(mappedAlerts);
      } catch (err) {
        console.error(
          "Failed to fetch host alerts:",
          err.response || err.message
        );
        setError(
          "Failed to load tamper alerts. Please check the backend service."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchHostAlerts();
  }, []);

 // Function to handle marking an alert as resolved
const handleMarkResolved = async (alertId) => {
  // Add a small local status indicator if you want, but focus on the API call
  try {
    // 1. Send API request to resolve the alert
    // Use the alertId to target the specific database entry
    const res = await api.put(`/host/alerts/resolve/${alertId}`);

    // 2. Check for success (e.g., status 200 or 204)
    if (res.status === 200 || res.status === 204) {
      // 3. ONLY update the local state if the API call was successful
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status: "Resolved",
              }
            : a
        )
      );
      // Optional: Add a success message notification here
    }
  } catch (err) {
    console.error("Error marking alert as resolved:", err.response || err.message);
    // Notify the user of the failure
    alert("Failed to mark alert as resolved. Please try again.");
  }
};

  // Loading and Error States
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading alerts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6 items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
        <p className="text-red-500 font-medium">Error Loading Alerts</p>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-slate-900 mb-2 text-lg font-semibold">Alerts</h1>
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
              <div className="text-2xl md:text-3xl">{alerts.length}</div>
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
          {alerts.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No new tamper alerts.</p>
              </div>
            </div>
          ) : (
            alerts.map((alert) => {
              const badgeClasses =
                alert.status === "Resolved"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-red-100 text-red-700";

              return (
                <section
                  key={alert.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                        <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500 mt-0.5 flex-shrink-0" />

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
                        <button
                          onClick={() => handleMarkResolved(alert.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default HostAlerts;