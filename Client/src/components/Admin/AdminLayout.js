import React from "react";
import { Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import AdminNav from "./AdminNav";

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
                    {/* remove the username here */}

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700 transition"
                        aria-label="Logout"
                    >
                        <LogOut className="w-4 h-4 text-cyan-400" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6">
                <Outlet />
            </main>

            {/* Bottom nav like guest/host */}
            <AdminNav />
        </div>
    );
};

export default AdminLayout;