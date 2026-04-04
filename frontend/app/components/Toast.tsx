"use client";

import React, { useEffect, useRef } from "react";

export interface Toast {
  id: string;
  icon: string;
  text: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, onRemove]);

  return (
    <div className="toast" onClick={() => onRemove(toast.id)}>
      <span className="toast-icon">{toast.icon}</span>
      <span className="toast-text">{toast.text}</span>
    </div>
  );
}
