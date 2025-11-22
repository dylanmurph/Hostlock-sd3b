import React, { useEffect, useState } from "react";
import api from "../../api";

function GuestHome() {
	const storedUser = JSON.parse(localStorage.getItem("user"));
	const userName = storedUser?.name || "Guest";

	const [bookings, setBookings] = useState([]);

	useEffect(() => {
		async function getCurrentBookings() {
			try {
				const res = await api.get("/guest/get/booking");
				setBookings(res.data || []);
			} catch (err) {
				console.error("Failed to fetch bookings:", err.response || err.message);
			}
		}
		getCurrentBookings();
	}, []);

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col">
			<main className="flex-1 px-4 pt-4 pb-24">
				<div className="w-full max-w-sm mx-auto space-y-4">
					{/* Welcome card */}
					<section className="bg-white rounded-2xl shadow-sm border border-slate-200">
						<div className="px-4 py-3">
							<h2 className="text-base font-semibold text-slate-900">
								Welcome back, {userName}! 👋
							</h2>
							{bookings.length === 0 && (
								<p className="text-xs text-slate-500 mt-1">
									You currently have no bookings.
								</p>
							)}
						</div>
					</section>

					{/* Booking cards */}
					{bookings.map((booking, idx) => (
						<section
							key={idx}
							className="bg-white rounded-2xl shadow-sm border border-slate-200"
						>
							<div className="px-4 py-3 border-b border-slate-100">
								<h3 className="text-sm font-semibold text-slate-900">
									Booking {idx + 1}
								</h3>
							</div>

							<div className="px-4 py-3 space-y-3 text-xs text-slate-700">
								<div className="flex justify-between">
									<span className="text-slate-500">Booking Code</span>
									<span className="font-medium text-slate-900">
										{booking.bookingCode}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Check-in</span>
									<span className="font-medium text-slate-900">
										{booking.checkIn} {booking.checkInTime}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Check-out</span>
									<span className="font-medium text-slate-900">
										{booking.checkOut} {booking.checkOutTime}
									</span>
								</div>
							</div>
						</section>
					))}
				</div>
			</main>
		</div>
	);
}

export default GuestHome;
