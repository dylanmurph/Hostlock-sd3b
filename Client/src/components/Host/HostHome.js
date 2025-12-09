import React, { useState, useEffect } from 'react';
import api from '../../api';
import { AlertTriangle, User, Bell, Home, Plus, X, Trash2 } from 'lucide-react';

const API_ENDPOINTS = {
    bookings: '/host/get/bookings',
    alerts: '/host/get/alerts',
    hostBnbs: '/host/bnbs',
    createBnb: '/bnbs',
};

// use real status from backend instead of forcing "Pending"
function mapApiAlertsToDashboard(apiAlerts) {
    return apiAlerts.map((alert) => ({
        id: alert.alertId,
        message: `${alert.bnbName}: Tamper Alert triggered.`,
        status: alert.status || 'Pending',
        time: alert.triggeredAt,
        type: alert.type || 'unauthorized',
    }));
}

const HostHome = () => {
    const [guests, setGuests] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [bnbs, setBnbs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isAdding, setIsAdding] = useState(false);
    const [newBnbName, setNewBnbName] = useState('');
    const [addError, setAddError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchBnbs = async () => {
        try {
            const bnbsRes = await api.get(API_ENDPOINTS.hostBnbs);
            setBnbs(bnbsRes.data || []);
            return bnbsRes.data || [];
        } catch (err) {
            console.error('Failed to fetch BnBs:', err);
            setError('Could not load properties.');
            return [];
        }
    };

    const handleCreateBnb = async (e) => {
        e.preventDefault();
        setAddError(null);

        if (!newBnbName.trim()) {
            setAddError('Property name cannot be empty.');
            return;
        }

        try {
            const res = await api.post(API_ENDPOINTS.createBnb, {
                name: newBnbName.trim(),
            });

            setBnbs((prevBnbs) => [...prevBnbs, { id: res.data.id, name: res.data.name }]);
            setNewBnbName('');
            setIsAdding(false);

            alert(
                `Property "${res.data.name}" created successfully! Code: ${res.data.unique_code}`,
            );
        } catch (err) {
            const errorMsg =
                err.response?.data?.msg || 'Failed to create BnB. Check server logs.';
            setAddError(errorMsg);
            console.error('BnB creation failed:', err);
        }
    };

    const handleDeleteBnb = async (bnbId, bnbName) => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${bnbName}"? This action cannot be undone.`,
            )
        ) {
            return;
        }

        setDeletingId(bnbId);
        try {
            await api.delete(`/bnbs/${bnbId}`);
            setBnbs((prevBnbs) => prevBnbs.filter((b) => b.id !== bnbId));
            alert(`Property "${bnbName}" deleted successfully.`);
        } catch (err) {
            const errorMsg =
                err.response?.data?.msg || 'Failed to delete property. Check server logs.';
            setError(errorMsg);
            console.error('BnB deletion failed:', err);
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Alerts (for the Pending Alerts stat)
                const alertRes = await api.get(API_ENDPOINTS.alerts);
                const fetchedAlerts = mapApiAlertsToDashboard(alertRes.data || []);
                setAlerts(fetchedAlerts);

                // Properties
                await fetchBnbs();

                // Bookings
                const bookingRes = await api.get(API_ENDPOINTS.bookings);
                const fetchedBookings = bookingRes.data || [];
                setGuests(fetchedBookings);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError('Could not load all dashboard data. Check API connectivity.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div className="p-4 text-slate-500">Loading dashboard data...</div>;

    const activeGuests =
        guests.filter(
            (g) =>
                g.status === 'Active' ||
                (g.check_in_time &&
                    g.check_out_time &&
                    new Date(g.check_in_time) < new Date() &&
                    new Date(g.check_out_time) > new Date()),
        ).length;

    // only count alerts whose status is actually pending
    const pendingAlerts = alerts.filter(
        (a) => String(a.status).toLowerCase() === 'pending',
    ).length;

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

                {/* 1. Stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <DashboardCard
                        title="Current Guests"
                        value={activeGuests}
                        icon={<User className="w-6 h-6 text-blue-500" />}
                    />
                    <DashboardCard
                        title="Pending Alerts"
                        value={pendingAlerts}
                        valueClass="text-yellow-600"
                        icon={<Bell className="w-6 h-6 text-yellow-500" />}
                    />
                </div>

                {/* 2. Properties block */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <h2 className="text-base md:text-lg font-semibold flex items-center">
                            <Home className="inline w-5 h-5 mr-2 text-slate-700" />
                            <span>Your Properties ({bnbs.length})</span>
                        </h2>

                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="self-start sm:self-auto flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
                        >
                            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            <span>{isAdding ? 'Cancel' : 'Add New Property'}</span>
                        </button>
                    </div>

                    {isAdding && (
                        <form
                            onSubmit={handleCreateBnb}
                            className="mb-4 p-4 border border-slate-200 rounded-xl bg-slate-50"
                        >
                            <h3 className="text-sm font-semibold mb-2 text-slate-700">
                                Add Property Details
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
                                <input
                                    type="text"
                                    placeholder="Enter Property Name (e.g., 'Coastal Retreat')"
                                    value={newBnbName}
                                    onChange={(e) => setNewBnbName(e.target.value)}
                                    className="flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                                >
                                    Create BnB
                                </button>
                            </div>
                            {addError && (
                                <p className="mt-2 text-xs text-red-600 flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {addError}
                                </p>
                            )}
                        </form>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                        {bnbs.length > 0 ? (
                            bnbs.map((bnb) => (
                                <div
                                    key={bnb.id}
                                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-800 flex items-center justify-between"
                                >
                                    <span className="truncate">{bnb.name}</span>
                                    <button
                                        onClick={() => handleDeleteBnb(bnb.id, bnb.name)}
                                        disabled={deletingId === bnb.id}
                                        className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete property"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 col-span-full">
                                No properties registered yet.
                            </p>
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
        <div className={`text-2xl md:text-3xl ${valueClass}`}>{value}</div>
    </div>
);

export default HostHome;