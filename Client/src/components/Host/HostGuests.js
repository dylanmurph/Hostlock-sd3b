import React, { useState, useEffect } from "react";
import api from "../../api"; // Axios instance
import { Search, Plus, Edit, Trash2, Key } from "lucide-react";

export function HostGuests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    bookingCode: "",
    checkIn: "",
    checkOut: "",
    property: "",
  });

  // Fetch guests on mount
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const res = await api.get("/host/get/bookings");

        const flattened = res.data.map((g) => ({
          email: g.user?.email || "",
          bookingCode: g.booking?.bookingCode || "",
          checkIn: g.booking?.checkIn || "",
          checkOut: g.booking?.checkOut || "",
          bnbName: g.bnb?.name || "",
          fobUID: g.fob?.uid || "",
          bookingId: g.booking?.id || g.id
        }));

        setGuests(flattened);
      } catch (err) {
        console.error("Failed to fetch guests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuests();
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

      // Add new guest to state
      setGuests((prev) => [res.data, ...prev]);

      // Reset form
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
      alert("Failed to create booking. Check console for details.");
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
                <label className="text-sm text-slate-600 mb-1 block">Email</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="guest@example.com"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Booking Code</label>
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
                  <label className="text-sm text-slate-600 mb-1 block">Check-in</label>
                  <input
                    name="checkIn"
                    type="datetime-local"
                    value={formData.checkIn}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Check-out</label>
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
                <label className="text-sm text-slate-600 mb-1 block">Property</label>
                <select
                  name="property"
                  value={formData.property}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Select a property</option>
                  <option>Sunset Beach Villa</option>
                  <option>Downtown Loft</option>
                  <option>Mountain Retreat Cabin</option>
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
                placeholder="Search by email, booking code..."
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Guests Table */}
        <section className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 pt-4">
            <h2 className="text-sm font-semibold text-slate-900">All Guests</h2>
            <p className="text-xs text-slate-500 mb-4">{filteredGuests.length} guests found</p>
          </div>
          <div className="px-4 pb-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Booking Code</th>
                  <th className="py-2 pr-4">Check-in / Check-out</th>
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4">Fob UID</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest.bookingId} className="border-b border-slate-100 last:border-none">
                    <td className="py-2 pr-4">{guest.email}</td>
                    <td className="py-2 pr-4">{guest.bookingCode}</td>
                    <td className="py-2 pr-4">
                      <div className="text-xs">
                        <div>{guest.checkIn}</div>
                        <div className="text-slate-500">{guest.checkOut}</div>
                      </div>
                    </td>
                    <td className="py-2 pr-4">{guest.bnbName}</td>
                    <td className="py-2 pr-4">{guest.fobUID}</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HostGuests;