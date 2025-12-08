import React, { useState, useEffect } from "react";
import api from "../../api";
import { Plus, Trash2, X } from "lucide-react";

const GuestDetailsModal = ({ booking, onCancel, refreshParentData, showMessage }) => {
    const [currentGuests, setCurrentGuests] = useState([]);
    const [newGuestEmail, setNewGuestEmail] = useState("");
    const [loadingGuests, setLoadingGuests] = useState(false);

    const [guestDirectory, setGuestDirectory] = useState([]);

    // fetch ALL guests for dropdown (once)
    useEffect(() => {
        const fetchGuestDirectory = async () => {
            try {
                const res = await api.get("/host/guests");
                setGuestDirectory(res.data || []);
            } catch (err) {
                console.error("Failed to load guest directory:", err);
                // not fatal, modal still works, just no dropdown options
            }
        };

        fetchGuestDirectory();
    }, []);

    const fetchGuests = async () => {
        if (!booking) {
            setCurrentGuests([]);
            return;
        }

        setLoadingGuests(true);
        try {
            const res = await api.get(`/bookings/${booking.id}/guests`);
            setCurrentGuests(res.data);
        } catch (error) {
            console.error("Failed to fetch all associated guests:", error);
            showMessage({
                type: "error",
                text:
                    error.response?.data?.error ||
                    "Failed to load all guests for this booking.",
            });
            setCurrentGuests([]);
        } finally {
            setLoadingGuests(false);
        }
    };

    useEffect(() => {
        fetchGuests();
        setNewGuestEmail("");
    }, [booking]);

    if (!booking) return null;

    const handleAddSecondaryGuest = async (e) => {
        e.preventDefault();
        if (!newGuestEmail) return;

        try {
            const res = await api.post(
                `/bookings/${booking.id}/add_guest`,
                { email: newGuestEmail }
            );

            showMessage({
                type: "success",
                text: `Secondary guest ${newGuestEmail} added to booking!`,
            });
            setNewGuestEmail("");

            setCurrentGuests((prev) => [
                ...prev,
                {
                    id: res.data.guestId,
                    email: res.data.email,
                    name: res.data.email,
                    isPrimaryGuest: false,
                },
            ]);
            refreshParentData();
        } catch (error) {
            console.error("Add Guest Error:", error);
            showMessage({
                type: "error",
                text: error.response?.data?.error || "Failed to add guest.",
            });
        }
    };

    const handleRemoveSecondaryGuest = async (guestId) => {
        try {
            await api.post(`/bookings/${booking.id}/remove_guest`, { guestId });

            showMessage({
                type: "success",
                text: "Secondary guest removed successfully.",
            });

            setCurrentGuests((prev) => prev.filter((g) => g.id !== guestId));
            refreshParentData();
        } catch (error) {
            console.error("Remove Guest Error:", error);
            showMessage({
                type: "error",
                text:
                    error.response?.data?.error || "Failed to remove guest.",
            });
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target.id === "guest-details-backdrop") {
            onCancel();
        }
    };

    return (
        <div
            id="guest-details-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white rounded-lg shadow-2xl p-6 max-w-lg w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-800">
                        Manage Guests for Booking: {booking.bookingCode}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="text-slate-500 hover:text-slate-800"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <h4 className="text-md font-semibold text-slate-700 mt-6 mb-2">
                    Current Guests
                </h4>

                {loadingGuests ? (
                    <p className="text-sm text-slate-500">Loading guests...</p>
                ) : (
                    <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {currentGuests.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">
                                No guests associated with this booking.
                            </p>
                        ) : (
                            currentGuests.map((guest) => (
                                <li
                                    key={guest.id}
                                    className="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-slate-50"
                                >
                                    <div className="text-sm">
                                        <p className="font-medium">
                                            {guest.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {guest.email}
                                        </p>
                                        <span className="text-xs font-semibold text-cyan-600">
                                            {guest.isPrimaryGuest
                                                ? " (Primary Guest)"
                                                : " (Secondary Guest)"}
                                        </span>
                                    </div>
                                    {!guest.isPrimaryGuest && (
                                        <button
                                            onClick={() =>
                                                handleRemoveSecondaryGuest(
                                                    guest.id
                                                )
                                            }
                                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                                            title="Remove secondary guest"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                )}

                <h4 className="text-md font-semibold text-slate-700 mt-6 mb-2">
                    Add Secondary Guest
                </h4>
                <form
                    onSubmit={handleAddSecondaryGuest}
                    className="flex gap-2"
                >
                    <select
                        value={newGuestEmail}
                        onChange={(e) => setNewGuestEmail(e.target.value)}
                        className="flex-grow px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        required
                    >
                        <option value="">Select a guest</option>
                        {guestDirectory.map((g) => (
                            <option key={g.id} value={g.email}>
                                {(g.name || g.email) + " (" + g.email + ")"}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Add Guest
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GuestDetailsModal;