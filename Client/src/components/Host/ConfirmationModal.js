import React from "react";
import { X } from "lucide-react";

const ConfirmationModal = ({ action, onCancel, onConfirm }) => {
    if (!action) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Confirm Action</h3>
                <p className="text-sm text-slate-600 mb-6">{action.message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        // Note: action.itemId is passed to onConfirm for execution
                        onClick={() => onConfirm(action.itemId)}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;