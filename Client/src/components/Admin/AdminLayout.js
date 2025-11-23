import React from "react";
import { Outlet } from "react-router-dom";

const AdminLayout = ({ user, onLogout }) => {
    const handleLogout = () => {
        if (onLogout) onLogout();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Admin Bar */}
            <header className="w-full bg-white border-b border-slate-200 p-4 flex justify-between items-center">
                <h1 className="text-lg font-semibold text-slate-800">
                    Admin Panel
                </h1>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                        {user?.name}
                    </span>

                    <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
