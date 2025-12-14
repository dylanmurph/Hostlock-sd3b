import React, { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import api from "../../api";

// helper: turn snake_case into "Title Case"
const toTitle = (str) =>
  str
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// helper: map backend status to category + label
const mapStatus = (raw) => {
  if (!raw) {
    return { category: "Other", label: "Unknown" };
  }

  const s = String(raw).toLowerCase();

  // success types
  if (s === "granted") {
    return { category: "Success", label: "Granted" };
  }
  if (s === "granted_face") {
    return { category: "Success", label: "Granted (with face match)" };
  }
  if (s === "granted_no_face") {
    return { category: "Success", label: "Granted (no face match)" };
  }

  // failure / denied types
  if (
    s === "denied" ||
    s === "failed" ||
    s === "match_failure" ||
    s === "face_mismatch" ||
    s === "no_fob" ||
    s === "no_face"
  ) {
    return { category: "Failed", label: toTitle(s) };
  }

  // default: keep original but look nicer
  return { category: "Other", label: toTitle(s) };
};

export function HostLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All"); // All | Success | Failed
  const [openFilter, setOpenFilter] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/host/access/logs");

        const normalised = res.data.map((log, index) => {
          const { category, label } = mapStatus(log.status);

          return {
            id: log.id ?? index,
            time: log.timestamp,
            guestName: log.user || "Unknown",
            property: log.bnbName || "Unknown property",
            // method removed from UI, but we can still keep it here if needed later
            method: log.method || "Unknown",
            snapshotPath: log.snapshot,
            statusRaw: log.status,
            statusCategory: category, 
            statusLabel: label,
          };
        });

        setLogs(normalised);
      } catch (err) {
        console.error("Failed to fetch access logs:", err);
        setError("Failed to load access logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs =
    statusFilter === "All"
      ? logs
      : logs.filter((l) => l.statusCategory === statusFilter);

  const successCount = filteredLogs.filter(
    (l) => l.statusCategory === "Success"
  ).length;

  const failedCount = filteredLogs.filter(
    (l) => l.statusCategory === "Failed"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-slate-900 mb-2 text-lg font-semibold">
              Access Logs
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              Complete timeline of all access events
            </p>
          </div>

          {/* Filter button */}
          <div className="relative">
            <button
              onClick={() => setOpenFilter((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
            >
              <Filter className="w-4 h-4" />
              {statusFilter === "All" ? "Filter" : statusFilter}
            </button>

            {openFilter && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-md text-sm z-10">
                {["All", "Success", "Failed"].map((opt) => (
                  <button
                    key={opt}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50"
                    onClick={() => {
                      setStatusFilter(opt);
                      setOpenFilter(false);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {loading && (
          <p className="text-xs text-slate-500">Loading access logs...</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}

        {!loading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs md:text-sm text-slate-500">
                    Total Attempts (filtered)
                  </p>
                </div>
                <div className="px-4 py-3 text-2xl md:text-3xl">
                  {filteredLogs.length}
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs md:text-sm text-slate-500">
                    Successful
                  </p>
                </div>
                <div className="px-4 py-3 text-2xl md:text-3xl text-green-600">
                  {successCount}
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs md:text-sm text-slate-500">Failed</p>
                </div>
                <div className="px-4 py-3 text-2xl md:text-3xl text-red-600">
                  {failedCount}
                </div>
              </section>
            </div>

            {/* Desktop logs table */}
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
                    <tr className="border-b text-left text-xs text-slate-500">
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">Guest Name</th>
                      <th className="py-2 pr-4">Property</th>
                      {/* Method column removed */}
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Snapshot</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLogs.map((log) => {
                      const isSuccess = log.statusCategory === "Success";
                      const isFailed = log.statusCategory === "Failed";
                      const isNoFace =
                        log.statusRaw &&
                        String(log.statusRaw).toLowerCase() ===
                          "granted_no_face";

                      const dotClass = isNoFace
                        ? "bg-yellow-400"
                        : isSuccess
                          ? "bg-green-500"
                          : isFailed
                            ? "bg-red-500"
                            : "bg-slate-400";

                      const badgeClass = isNoFace
                        ? "bg-yellow-100 text-yellow-700"
                        : isSuccess
                          ? "bg-emerald-100 text-emerald-700"
                          : isFailed
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-700";

                      return (
                        <tr key={log.id} className="border-b last:border-none">
                          <td className="py-2 pr-4">{log.time}</td>
                          <td className="py-2 pr-4">{log.guestName}</td>
                          <td className="py-2 pr-4">{log.property}</td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${dotClass}`}
                              />
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] ${badgeClass}`}
                              >
                                {log.statusLabel}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 pr-4">
                            {log.snapshotPath &&
                              !log.snapshotPath.startsWith('/uploads/error_') ? (
                              <img
                                src={log.snapshotPath}
                                alt={`Snapshot for ${log.guestName}`}
                                className="w-12 h-auto rounded-md object-cover"
                              />
                            ) : (
                              <span className="text-xs text-slate-400">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Mobile list */}
            <div className="md:hidden space-y-3">
              {filteredLogs.map((log) => {
                const isSuccess = log.statusCategory === "Success";
                const isFailed = log.statusCategory === "Failed";
                const isNoFace =
                  log.statusRaw &&
                  String(log.statusRaw).toLowerCase() === "granted_no_face";

                const badgeClass = isNoFace
                  ? "bg-yellow-100 text-yellow-700"
                  : isSuccess
                    ? "bg-emerald-100 text-emerald-700"
                    : isFailed
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700";

                return (
                  <section
                    key={log.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm"
                  >
                    <div className="px-4 py-4 space-y-3">
                      {log.snapshotPath &&
                        !log.snapshotPath.startsWith('/uploads/error_') && (
                        <img
                          src={log.snapshotPath}
                          alt={`Snapshot for ${log.guestName}`}
                          className="w-full h-auto max-h-32 rounded-md object-cover mb-3"
                        />
                      )}

                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{log.guestName}</p>
                          <p className="text-xs text-slate-500">
                            {log.property}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${badgeClass}`}
                        >
                          {log.statusLabel}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Time:</span>
                          <span>{log.time}</span>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default HostLogs;