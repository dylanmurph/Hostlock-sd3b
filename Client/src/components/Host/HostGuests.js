import React, { useState, useEffect } from "react";
import api from "../../api";
import { Search, Plus, Edit, Trash2 } from "lucide-react";

export function HostGuests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);

  const [formData, setFormData] = useState({
    email: "",
    bookingCode: "",
    checkIn: "",
    checkOut: "",
    property: "",
  });

  // Fetch guests + properties on mount
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const res = await api.get("/host/get/bookings");

        const mappedGuests = res.data.map((g) => ({
          bookingId: g.bookingId,
          email: g.email,
          name: g.guestName || g.email,
          bookingCode: g.bookingCode || "",
          checkIn: `${g.checkIn} ${g.checkInTime || ""}`.trim(),
          checkOut: `${g.checkOut} ${g.checkOutTime || ""}`.trim(),
          nfcId: g.fobUID || "",
          property: g.bnbName || "",
          status: g.status || "Active",
        }));

        setGuests(mappedGuests);
      } catch (err) {
        console.error("Failed to fetch guests:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProperties = async () => {
      try {
        const res = await api.get("/host/bnbs");
        setProperties(res.data);
      } catch (err) {
        console.error("Failed to fetch host properties:", err);
      }
    };

    fetchGuests();
    fetchProperties();
  }, []);

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddGuest = async () => {
    const { email, bookingCode, checkIn, checkOut, property } = formData;
    if (!email || !bookingCode || !checkIn || !checkOut || !property) {
      return alert("Please fill in all required fields.");
    }

    try {
      const res = await api.post("/booking/createBooking", {
        email,
        bookingCode,
        checkIn,
        checkOut,
        property,
      });

      const b = res.data;

      const mapped = {
        bookingId: b.bookingId,
        email: b.email,
        name: b.email,
        bookingCode: b.bookingCode,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nfcId: b.fobUID || "",
        property: b.bnbName || "",
        status: b.status || "Active",
      };

      setGuests((prev) => [mapped, ...prev]);

      setFormData({
        email: "",
        bookingCode: "",
        checkIn: "",
        checkOut: "",
        property: "",
      });

      alert("Guest booking created successfully!");
    } catch (err) {
      console.error("Create booking error:", err);
      alert(
        err.response?.data?.error ||
          "Failed to create booking. Check console for details."
      );
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this booking?"
    );
    if (!confirm) return;

    try {
      await api.delete(`/booking/${bookingId}`);
      setGuests((prev) =>
        prev.filter((guest) => guest.bookingId !== bookingId)
      );
      alert("Booking deleted.");
    } catch (err) {
      console.error("Failed to delete booking:", err);
      alert(
        err.response?.data?.error ||
          "Failed to delete booking. Check console for details."
      );
    }
  };

  const filteredGuests = guests.filter((guest) => {
    const email = guest.email || "";
    const bookingCode = guest.bookingCode || "";
    return (
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) return <div className="p-6 text-center">Loading guests...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header + Add Guest */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-slate-900 mb-2 text-lg font-semibold">
              Guest Management
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              Manage guest access and bookings
            </p>
          </div>

          {/* Add Guest Form */}
          <details className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
            <summary className="flex items-center justify-center gap-2 px-4 py-2 cursor-pointer text-sm font-medium text-slate-800">
              <Plus className="w-4 h-4" />
              Add Guest
            </summary>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  Email
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="guest@example.com"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  Booking Code
                </label>
                <input
                  name="bookingCode"
                  value={formData.bookingCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="BK-2025-XXXX"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">
                    Check-in
                  </label>
                  <input
                    name="checkIn"
                    type="datetime-local"
                    value={formData.checkIn}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">
                    Check-out
                  </label>
                  <input
                    name="checkOut"
                    type="datetime-local"
                    value={formData.checkOut}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">
                  Property
                </label>
                <select
                  name="property"
                  value={formData.property}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Select a property</option>
                  {properties.map((bnb) => (
                    <option key={bnb.id} value={bnb.id}>
                      {bnb.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAddGuest}
                className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700"
              >
                Add Guest
              </button>
            </div>
          </details>
        </div>

        {/* Search Bar */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Search by booking code or email..."
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Guests Cards - Mobile (and simple view) */}
        <div className="space-y-3">
          <div className="text-sm text-slate-600 px-1">
            {filteredGuests.length} guests found
          </div>

          {filteredGuests.map((guest) => {
            const badgeClasses =
              guest.status === "Active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700";

            return (
              <section
                key={guest.bookingId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="px-4 py-4 space-y-3">
                  {/* Header: Email + Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{guest.email}</p>
                      <p className="text-xs text-slate-500">
                        {guest.bookingCode}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClasses}`}
                    >
                      {guest.status}
                    </span>
                  </div>

                  {/* Booking details */}
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Check-in:</span>
                      <span>{guest.checkIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Check-out:</span>
                      <span>{guest.checkOut}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Property:</span>
                      <span>{guest.property}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fob UID:</span>
                      <span>{guest.nfcId}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(guest.bookingId)}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default HostGuests;