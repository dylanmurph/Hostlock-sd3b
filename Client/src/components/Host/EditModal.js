import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const EditModal = ({ modalData, onCancel, onSubmit }) => {
    const isEdit = modalData?.type === 'edit';
    const initialValue = isEdit ? modalData?.guest.bookingCode : modalData?.guest.nfcId || '';
    const [inputValue, setInputValue] = useState(initialValue);

    useEffect(() => {
        setInputValue(initialValue);
    }, [modalData?.guest.id, modalData?.type, initialValue]);


    if (!modalData) return null;

    const { type, guest } = modalData;
    const title = isEdit ? `Edit Booking for ${guest.name}` : `Assign Fob for ${guest.name}`;
    const label = isEdit ? 'New Booking Code' : 'Fob UID (NFC ID)';
    const placeholder = isEdit ? 'BK-2025-XXXX' : 'e.g., AABBCCDD';
    const submitText = isEdit ? 'Update Booking' : 'Assign Fob';

    const handleBackdropClick = (e) => {
        if (e.target.id === 'edit-modal-backdrop') {
            onCancel();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(guest.id, type, inputValue);
    };

    return (
        <div id="edit-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={handleBackdropClick}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <button onClick={onCancel} className="text-slate-500 hover:text-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-600 mb-1 block">{label}</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder={placeholder}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700"
                    >
                        {submitText}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditModal;