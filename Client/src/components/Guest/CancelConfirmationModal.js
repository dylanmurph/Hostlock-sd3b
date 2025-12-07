import React from 'react';
import { XCircle, X } from 'lucide-react';

const CancelConfirmationModal = ({ bookingCode, bnbName, onConfirm, onCancel }) => {
    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" 
            onClick={onCancel}
        >
            <div 
                className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <XCircle className="w-6 h-6 text-red-500" />
                        <h3 className="text-lg font-bold text-slate-800">Confirm Cancellation</h3>
                    </div>
                    <button onClick={onCancel} className="text-slate-500 hover:text-slate-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <p className="text-sm text-slate-700 mb-6">
                    Are you sure you want to cancel your booking for **{bnbName}** (Code: {bookingCode})? 
                    This action cannot be undone.
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        Keep Booking
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Yes, Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelConfirmationModal;