import React, { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
    id: number;
    type: ToastType;
    message: string;
}

let _nextId = 1;
let _addToast: ((type: ToastType, message: string) => void) | null = null;

/**
 * Call from anywhere to show a toast notification.
 *  toast.success("Patient saved!");
 *  toast.error("Something went wrong");
 */
export const toast = {
    success: (message: string) => _addToast?.("success", message),
    error: (message: string) => _addToast?.("error", message),
    info: (message: string) => _addToast?.("info", message),
};

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    _addToast = (type: ToastType, message: string) => {
        const id = _nextId++;
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    const dismiss = (id: number) =>
        setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-4 transition-all duration-300 ${t.type === "success"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : t.type === "error"
                                ? "bg-red-50 border-red-200 text-red-800"
                                : "bg-sky-50 border-sky-200 text-sky-900"
                        }`}
                >
                    {t.type === "success" ? (
                        <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600" />
                    ) : t.type === "error" ? (
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600" />
                    ) : (
                        <Info className="h-5 w-5 flex-shrink-0 mt-0.5 text-sky-600" />
                    )}
                    <span className="text-sm font-medium flex-1">{t.message}</span>
                    <button
                        onClick={() => dismiss(t.id)}
                        className="flex-shrink-0 hover:opacity-70"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
