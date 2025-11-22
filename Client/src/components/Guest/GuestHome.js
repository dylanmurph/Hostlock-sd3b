import React, { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Calendar, Bell, Settings, MapPin, Home } from "lucide-react"
import api from "../../api"

// TEMP – swap with real data later
const guestData = {
	name: "Emily Clark",
	propertyName: "Dundalk Apartment",
	propertyAddress: "123 Main Street, Dundalk, Ireland",
	checkIn: "2025-11-20 15:00",
	checkOut: "2025-11-25 11:00",
	bookingCode: "ABC12345",
};

function GuestHome() {
	const location = useLocation();
	const isActive = (path) => location.pathname === path

useEffect(() => {
    async function getCurrentBookings() {
      try {
        const res = await api.get("/guest/get/booking");
        const bookings = res.data;
        console.log(bookings);
      } catch (err) {
        console.error("Failed to fetch bookings:", err.response || err.message);
      }
    }
    getCurrentBookings();
  }, []);


	return (
		<div className="min-h-screen bg-slate-50 flex flex-col">
			{/* MAIN CONTENT */}
			<main className="flex-1 px-4 pt-4 pb-24">
				<div className="w-full max-w-sm mx-auto space-y-4">
					{/* Welcome card */}
					<section className="bg-white rounded-2xl shadow-sm border border-slate-200">
						<div className="px-4 py-3">
							<h2 className="text-base font-semibold text-slate-900">
								Welcome back, {guestData.name}! 👋
							</h2>
							<p className="text-xs text-slate-500 mt-1">
								Your stay at {guestData.propertyName}
							</p>
						</div>

						<div className="px-4 pb-4 space-y-3 text-xs text-slate-700">
							{/* Check-in/out */}
							<div className="flex items-start gap-3">
								<Calendar className="w-4 h-4 text-cyan-500 mt-0.5" />
								<div>
									<p>
										<span className="font-medium">Check-in:&nbsp;</span>
										{guestData.checkIn}
									</p>
									<p>
										<span className="font-medium">Check-out:&nbsp;</span>
										{guestData.checkOut}
									</p>
								</div>
							</div>

							{/* Address */}
							<div className="flex items-start gap-3">
								<MapPin className="w-4 h-4 text-cyan-500 mt-0.5" />
								<p>{guestData.propertyAddress}</p>
							</div>
						</div>
					</section>

					{/* Booking card */}
					<section className="bg-white rounded-2xl shadow-sm border border-slate-200">
						<div className="px-4 py-3 border-b border-slate-100">
							<h3 className="text-sm font-semibold text-slate-900">
								Current Booking
							</h3>
						</div>

						<div className="px-4 py-3 space-y-3 text-xs text-slate-700">
							<div className="flex justify-between">
								<span className="text-slate-500">Booking Code</span>
								<span className="font-medium text-slate-900">
									{guestData.bookingCode}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Check-in Time</span>
								<span className="font-medium text-slate-900">15:00</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Check-out Time</span>
								<span className="font-medium text-slate-900">11:00</span>
							</div>
						</div>
					</section>
				</div>
			</main>

			{/* BOTTOM NAV */}
			<nav className="sticky bottom-0 inset-x-0 bg-white border-t shadow-sm">
				<div className="max-w-sm mx-auto flex justify-between px-6 py-2 text-xs">
					<NavItem
						to="/guest/home"
						label="Home"
						icon={Home}
						active={isActive("/guest/home")}
					/>
					<NavItem
						to="/guest/bookings"
						label="Bookings"
						icon={Calendar}
						active={isActive("/guest/bookings")}
					/>
					<NavItem
						to="/guest/alerts"
						label="Alerts"
						icon={Bell}
						active={isActive("/guest/alerts")}
						showDot
					/>
					<NavItem
						to="/guest/settings"
						label="Settings"
						icon={Settings}
						active={isActive("/guest/settings")}
					/>
				</div>
			</nav>
		</div>
	)
}

const NavItem = ({ to, label, icon: Icon, active, showDot }) => (
	<Link
		to={to}
		className={`relative flex flex-col items-center gap-0.5 ${active ? "text-sky-600" : "text-slate-500"
			}`}
	>
		<Icon className="w-5 h-5" />
		{showDot && (
			<span className="absolute -top-0.5 right-3 w-2 h-2 rounded-full bg-red-500" />
		)}
		<span>{label}</span>
	</Link>
)

export default GuestHome