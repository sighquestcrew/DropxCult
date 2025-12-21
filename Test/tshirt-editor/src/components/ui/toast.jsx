"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "success", duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (message) => addToast(message, "success"),
        error: (message) => addToast(message, "error"),
        warning: (message) => addToast(message, "warning"),
        info: (message) => addToast(message, "info"),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
                            animate-in slide-in-from-right fade-in duration-300
                            ${t.type === "success" ? "bg-green-600 text-white" : ""}
                            ${t.type === "error" ? "bg-red-600 text-white" : ""}
                            ${t.type === "warning" ? "bg-yellow-500 text-black" : ""}
                            ${t.type === "info" ? "bg-blue-600 text-white" : ""}
                        `}
                    >
                        {t.type === "success" && <CheckCircle size={18} />}
                        {t.type === "error" && <XCircle size={18} />}
                        {t.type === "warning" && <AlertCircle size={18} />}
                        {t.type === "info" && <AlertCircle size={18} />}
                        <span className="text-sm font-medium">{t.message}</span>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="ml-2 hover:opacity-70"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}
