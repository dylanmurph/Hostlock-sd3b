import React, { useState, useEffect } from 'react';
import api from '../../api';
import { AlertTriangle, User, TrendingDown, Bell } from 'lucide-react';

const API_ENDPOINTS = {
    bookings: "/host/get/bookings",
    accessLogTemplate: (bookingCode) => `/guest/access/${bookingCode}/history`,
    alerts: "/host/get/alerts",
};

function mapApiAlertsToDashboard(apiAlerts) {
    return apiAlerts.map(alert => ({
        id: alert.alertId,
        message: `${alert.bnbName}: Tamper Alert triggered.`,
        status: 'Pending', 
        time: alert.triggeredAt,
        type: 'unauthorized',
    }));
}
// ---------------------------------------------------------------------------------


const HostHome = () => {
    const [guests, setGuests] = useState([]);
    const [accessLogs, setAccessLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // 1. Fetch Host Alerts (Tamper Alerts)
                const alertRes = await api.get(API_ENDPOINTS.alerts);
                const fetchedAlerts = mapApiAlertsToDashboard(alertRes.data || []);
                setAlerts(fetchedAlerts);
                
                // 2. Fetch all Bookings for the host
                const bookingRes = await api.get(API_ENDPOINTS.bookings);
                const bookings = bookingRes.data || [];
                setGuests(bookings);

                // 3. Fetch Access Logs for each booking
                const logsPromises = bookings.map(async (b) => {
                    // Check if the route exists before fetching logs
                    if (b.bookingCode) {
                        try {
                            const logRes = await api.get(API_ENDPOINTS.accessLogTemplate(b.bookingCode));
                            return logRes.data.map(log => ({
                                bookingCode: b.bookingCode,
                                status: log.match_result,
                                timestamp: log.time_logged,
                            }));
                        } catch (logErr) {
                            console.warn(`Could not fetch logs for booking ${b.bookingCode}:`, logErr);
                            return [];
                        }
                    }
                    return [];
                });

                const allLogs = await Promise.all(logsPromises);
                setAccessLogs(allLogs.flat());
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError("Could not load all dashboard data. Check API connectivity.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div className="p-4 text-slate-500">Loading dashboard data...</div>;
    
    const activeGuests = guests.filter((g) => g.status === 'Active' || (g.check_in_time && g.check_out_time && new Date(g.check_in_time) < new Date() && new Date(g.check_out_time) > new Date())).length;
    
    const failedAttempts = accessLogs.filter((log) => log.status === 'MATCH_FAILURE').length;

    const pendingAlerts = alerts.filter((a) => a.status === 'Pending').length;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
                
                {/* Header */}
                <header>
                    <h1 className="text-slate-900 mb-2 text-lg md:text-2xl font-semibold">
                        Host Dashboard
                    </h1>
                    <p className="text-slate-600 text-sm md:text-base">
                        Overview of your property access system
                    </p>
                </header>

                {error && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <DashboardCard 
                        title="Current Guests" 
                        value={activeGuests} 
                        icon={<User className="w-6 h-6 text-blue-500" />}
                    />
                    <DashboardCard 
                        title="Failed Attempts (24h)" 
                        value={failedAttempts} 
                        valueClass="text-red-600"
                        icon={<TrendingDown className="w-6 h-6 text-red-500" />}
                    />
                    <DashboardCard 
                        title="System Status" 
                        value="Online" 
                        valueClass="text-green-700"
                        icon={<div className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />}
                    />
                    <DashboardCard 
                        title="Pending Alerts" 
                        value={pendingAlerts} 
                        valueClass="text-yellow-600"
                        icon={<Bell className="w-6 h-6 text-yellow-500" />}
                    />
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
                        {alerts.length > 0 ? (
                            alerts.slice(0, 5).map((alert) => (
                                <div
                                    key={alert.id}
                                    className="flex items-start justify-between p-3 bg-red-50 rounded-xl gap-2 border border-red-200"
                                >
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <p className="text-xs md:text-sm font-medium text-red-800 break-words">{alert.message}</p>
                                        <p className="text-xs text-red-600 mt-1">{alert.time}</p>
                                    </div>
                                    <span
                                        className={`text-xs px-3 py-1 rounded-full whitespace-nowrap bg-red-500 text-white`}
                                    >
                                        {alert.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">No recent alerts.</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const DashboardCard = ({ title, value, valueClass = 'font-semibold', icon }) => (
    <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 flex flex-col justify-between border border-slate-100">
        <div className="flex items-center justify-between mb-1">
            <p className="text-xs md:text-sm text-slate-500">{title}</p>
            {icon}
        </div>
        <div className={`text-2xl md:text-3xl ${valueClass}`}>
            {value}
        </div>
    </div>
);

export default HostHome;