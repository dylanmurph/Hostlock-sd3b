import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Bell, Settings } from "lucide-react";

const GuestNav = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, label, icon: Icon, showDot }) => (
        <Link
            to={to}
            className={`relative flex flex-col items-center gap-1 ${isActive(to) ? "text-sky-600" : "text-slate-500"
                }`}
        >
            <Icon className="w-5 h-5" />
            {showDot && (
                <span className="absolute -top-0.5 right-2 w-2 h-2 rounded-full bg-red-500" />
            )}
            <span className="text-xs">{label}</span>
        </Link>
    );

    return (
        <nav className="sticky bottom-0 inset-x-0 bg-white border-t shadow-sm">
            <div className="max-w-md mx-auto flex justify-between px-6 py-2 text-xs">
                <NavItem to="/guest/home" label="Home" icon={Home} />
                <NavItem to="/guest/bookings" label="Bookings" icon={Calendar} />
                <NavItem to="/guest/alerts" label="Alerts" icon={Bell} showDot />
                <NavItem to="/guest/settings" label="Settings" icon={Settings} />
            </div>
        </nav>
    );
};

export default GuestNav;
