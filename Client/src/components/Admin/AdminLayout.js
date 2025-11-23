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
            {/* Top: Admin Dashboard + logout */}
            <header className="w-full bg-slate-50 px-4 pt-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Admin Dashboard
                        </h1>
                        <p className="text-sm text-slate-500">
                            System-wide overview and management
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center"
                        title="Log out"
                    >
                        <LogOut className="w-5 h-5" />
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