import React from "react";
import { XCircle, CheckCircle, X } from "lucide-react";

const MessageBanner = ({ message, onClose }) => {
    if (!message) return null;

    const classes = message.type === 'success'
        ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
        : 'bg-red-100 border-red-400 text-red-700';

    const Icon = message.type === 'success' ? CheckCircle : XCircle;

    return (
        <div className={`p-3 mb-4 rounded-lg border flex items-center justify-between transition-opacity ${classes}`}>
            <div className="flex items-center gap-2">
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{message.text}</span>
            </div>
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default MessageBanner;