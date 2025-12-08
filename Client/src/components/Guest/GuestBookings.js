import React, { useEffect, useState } from "react";
import api from "../../api";
import { Calendar, Clock, XCircle } from "lucide-react";

import CancelConfirmationModal from "./CancelConfirmationModal";

function GuestBookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [bnbs, setBnbs] = useState({}); // store bnb info by id
  const [loading, setLoading] = useState(true);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);

        // 1) Fetch guest bookings
        const res = await api.get("/guest/get/booking");
        const bookingData = res.data || [];
        setBookings(bookingData);

        if (bookingData.length === 0) {
          setLoading(false);
          return;
        }

        // 2) Fetch BnB info for these bookings
        const bnbIds = [...new Set(bookingData.map((b) => b.bnb_id))];
        const bnbPromises = bnbIds.map((id) => api.get(`/bnbs/${id}`));
        const bnbResults = await Promise.all(bnbPromises);

        const bnbMap = {};
        bnbResults.forEach((r) => {
          bnbMap[r.data.id] = r.data;
        });
        setBnbs(bnbMap);
      } catch (err) {
        console.error(
          "Failed to fetch bookings:",
          err.response || err.message
        );
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  // Open cancel modal
  const handleCancelBooking = (booking) => {
    setBookingToCancel(booking);
  };

  // Execute cancel after confirm
  const handleExecuteCancel = async () => {
    if (!bookingToCancel) return;
    const bookingCode = bookingToCancel.bookingCode;

    setBookingToCancel(null); // close modal immediately

    try {
      await api.delete(`/guest/booking/${bookingCode}`);

      // Remove booking from local list
      setBookings((prev) =>
        prev.filter((b) => b.bookingCode !== bookingCode)
      );
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      alert(
        err.response?.data?.error ||
        "Failed to cancel booking. Try again later."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 px-4 pt-4 pb-24">
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              My Bookings
            </h1>
            <p className="text-xs text-slate-500">
              View your current and upcoming stays
            </p>
          </div>

          {loading && (
            <p className="text-xs text-slate-500 text-center">Loading…</p>
          )}

          {!loading && bookings.length === 0 && (
            <p className="text-xs text-slate-500 text-center">
              You have no bookings yet.
            </p>
          )}

          {!loading &&
            bookings.map((booking) => {
              const bnb = bnbs[booking.bnb_id] || {};
              return (
                <div
                  key={booking.bookingCode}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        {bnb.name || "Loading..."}
                      </h2>
                    </div>
                  </div>

                  <div className="px-4 py-3 space-y-3 text-xs text-slate-700">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 mt-0.5 text-cyan-500" />
                      <div>
                        <div>
                          <span className="font-medium">Check-in:&nbsp;</span>
                          {booking.checkIn} {booking.checkInTime}
                        </div>
                        <div>
                          <span className="font-medium">Check-out:&nbsp;</span>
                          {booking.checkOut} {booking.checkOutTime}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-500" />
                      <div>
                        <span className="text-slate-500 mr-1">
                          Booking Code:
                        </span>
                        <span className="font-medium">
                          {booking.bookingCode}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelBooking(booking)}
                      className="mt-1 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 self-end"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Booking
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </main>

      {bookingToCancel && (
        <CancelConfirmationModal
          bookingCode={bookingToCancel.bookingCode}
          bnbName={bnbs[bookingToCancel.bnb_id]?.name || "Booking"}
          onConfirm={handleExecuteCancel}
          onCancel={() => setBookingToCancel(null)}
        />
      )}
    </div>
  );
}

export default GuestBookings;