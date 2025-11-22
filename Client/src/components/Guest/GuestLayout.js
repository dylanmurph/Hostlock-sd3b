import React from "react";
import { Outlet } from "react-router-dom";
import GuestNav from "./GuestNav";

const GuestLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <main className="flex-1 p-4 md:p-6">
                <Outlet />
            </main>

            <GuestNav />
        </div>
    );
};

export default GuestLayout;