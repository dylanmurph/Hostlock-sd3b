import React, { useState, useEffect } from "react";
import api from "../../api";
import { Search, Plus, Edit, Trash2, Key, Users } from "lucide-react";

import MessageBanner from './MessageBanner';
import ConfirmationModal from './ConfirmationModal';
import EditModal from './EditModal';
import GuestDetailsModal from './GuestDetailsModal'; 


export function HostGuests() {
    const [searchQuery, setSearchQuery] = useState("");
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState([]);

    const [message, setMessage] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [editModal, setEditModal] = useState(null);
    const [guestDetailsModal, setGuestDetailsModal] = useState(null);

    const [formData, setFormData] = useState({
        email: "",
        bookingCode: "",
        checkIn: "",
        checkOut: "",
        property: "",
    });

    const showMessage = (msg) => setMessage(msg);

    const refreshGuests = async () => {
        setLoading(true);
        try {
            const resGuests = await api.get("/host/get/bookings");

            const mappedGuests = resGuests.data
                .map((g) => ({
                    id: g.bookingId, 
                    guestId: g.guestId, 
                    name: g.guestName || g.email,
                    email: g.email || "",
                    bookingCode: g.bookingCode || "",
                    checkIn: g.checkIn ? g.checkIn.substring(0, 16) : "",
                    checkOut: g.checkOut ? g.checkOut.substring(0, 16) : "",
                    nfcId: g.fob_label || "",
                    property: g.bnbName || "",
                    status: g.status || "Active",
                }));

            setGuests(mappedGuests);

            const resProps = await api.get("/host/bnbs");
            setProperties(resProps.data);

        } catch (err) {
            console.error("Failed to initialize data:", err);
            showMessage({ type: 'error', text: 'Failed to load guest and property data.' });
        } finally {
            setLoading(false);
        }
    };

    
    useEffect(() => {
        refreshGuests();
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
            return showMessage({ 
                type: 'error', 
                text: `All fields are required to create a booking.` 
            });
        }

        try {
            await api.post("/booking/createBooking", {
                email,
                bookingCode,
                checkIn,
                checkOut,
                property,
            });

            document.getElementById('add-guest-details').open = false;

            await refreshGuests();

            setFormData({
                email: "",
                bookingCode: "",
                checkIn: "",
                checkOut: "",
                property: "",
            });

            showMessage({ type: 'success', text: "Guest booking created successfully!" });

        } catch (err) {
            console.error("Create booking error:", err);
            const backendError = err.response?.data;
            showMessage({ 
                type: 'error', 
                text: backendError?.error || 'Failed to create booking. Please check details.' 
            });
        }
    };

    const confirmDelete = (bookingId) => {
        setConfirmAction({
            message: `Are you sure you want to delete booking ID ${bookingId}? This action cannot be undone.`,
            action: handleDeleteExecution,
            itemId: bookingId
        });
    };

    const handleDeleteExecution = async (bookingId) => {
        setConfirmAction(null);
        try {
            await api.delete(`/bookings/${bookingId}`);

            showMessage({ type: 'success', text: "Booking deleted successfully!" });
            setGuests((prev) => prev.filter((guest) => guest.id !== bookingId));

        } catch (err) {
            console.error("Delete booking error:", err);
            showMessage({ type: 'error', text: "Failed to delete booking." });
        }
    };

    const openEditModal = (guest, type) => {
        setEditModal({ type, guest });
    };

    const openGuestDetailsModal = (guest) => {
        setGuestDetailsModal(guest);
    }

    const handleModalSubmit = async (bookingId, type, value) => {
        setEditModal(null); 

        try {
            const endpoint = type === 'edit' 
                ? `/bookings/${bookingId}`
                : `/bookings/${bookingId}/fob_assign`;
            
            const payload = type === 'edit' 
                ? { bookingCode: value } 
                : { fobUID: value };
            
            if (type === 'edit') {
                await api.put(endpoint, payload);
            } else {
                await api.post(endpoint, payload);
            }

            showMessage({ type: 'success', text: `${type === 'edit' ? 'Booking Code' : 'Fob UID'} updated successfully!` });
            await refreshGuests();

        } catch (err) {
            console.error(`${type} update error:`, err);
            showMessage({ type: 'error', text: `Failed to update ${type}.` });
        }
    };

    const filteredGuests = guests.filter((guest) => {
        const email = guest.email || "";
        const bookingCode = guest.bookingCode || "";
        return (
            guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    if (loading) return <div className="p-6 text-center">Loading guests...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">

                {/* 1. MESSAGE BANNER (DECOUPLED) */}
                <MessageBanner
                    message={message}
                    onClose={() => setMessage(null)}
                />

                {/* Header + Add Guest Form */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-slate-900 mb-2 text-lg font-semibold">
                            Guest Management
                        </h1>
                        <p className="text-slate-600 text-sm md:text-base">
                            Manage guest access and bookings
                        </p>
                    </div>

                    <details id="add-guest-details" className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
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
                                    type="email"
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
                                placeholder="Search by name, email, booking code..."
                                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Guests Cards (Mobile View) */}
                <div className="md:hidden space-y-3">
                    <div className="text-sm text-slate-600 px-1">
                        {filteredGuests.length} bookings found
                    </div>

                    {filteredGuests.map((guest) => {
                        const badgeClasses =
                            guest.status === "Active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700";

                        return (
                            <section
                                key={guest.id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm"
                            >
                                <div className="px-4 py-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{guest.name}</p>
                                            <p className="text-xs text-slate-500">{guest.bookingCode}</p>
                                        </div>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClasses}`}
                                        >
                                            {guest.status}
                                        </span>
                                    </div>

                                    <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Email:</span>
                                            <span>{guest.email}</span>
                                        </div>
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
                                            <span className="text-slate-500">Fob ID:</span>
                                            <span>{guest.nfcId || "N/A"}</span>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="grid grid-cols-4 gap-2 pt-2">
                                        <button
                                            onClick={() => openEditModal(guest, 'edit')}
                                            className="col-span-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => openEditModal(guest, 'fob')}
                                            className="col-span-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-50"
                                        >
                                            <Key className="w-4 h-4" />
                                            Fob
                                        </button>
                                        <button
                                            onClick={() => openGuestDetailsModal(guest)}
                                            className="col-span-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-200 text-xs text-indigo-600 hover:bg-indigo-50"
                                        >
                                            <Users className="w-4 h-4" />
                                            Guests
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(guest.id)}
                                            className="col-span-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Del
                                        </button>
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>
                
                {/* Desktop Table (Omitted for brevity) */}

            </main>

            {/* 2. CONFIRMATION MODAL (DECOUPLED) */}
            <ConfirmationModal
                action={confirmAction}
                onCancel={() => setConfirmAction(null)}
                onConfirm={handleDeleteExecution}
            />

            {/* 3. EDIT/FOB MODAL (DECOUPLED) */}
            <EditModal
                modalData={editModal}
                onCancel={() => setEditModal(null)}
                onSubmit={handleModalSubmit}
            />

            {/* 4. GUEST DETAILS MODAL (DECOUPLED) */}
            <GuestDetailsModal
                booking={guestDetailsModal}
                onCancel={() => setGuestDetailsModal(null)}
                refreshParentData={refreshGuests}
                showMessage={showMessage}
            />
        </div>
    );
}

export default HostGuests;