import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => string;
  showError: (message: string, title?: string) => string;
  showSuccess: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">): string => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        id,
        duration: 5000,
        ...toast,
      };

      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [removeToast]
  );

  const showError = useCallback(
    (message: string, title: string = "Error") => {
      return showToast({ type: "error", title, message });
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (message: string, title: string = "Success") => {
      return showToast({ type: "success", title, message });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title: string = "Warning") => {
      return showToast({ type: "warning", title, message });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title: string = "Notice") => {
      return showToast({ type: "info", title, message });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        removeToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "1.25rem",
        right: "1.25rem",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        maxWidth: "400px",
        width: "calc(100vw - 2.5rem)",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const styles = getToastStyles(toast.type);

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.85rem",
        padding: "0.9rem 1.15rem",
        borderRadius: "1rem",
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderLeft: `4px solid ${styles.accentColor}`,
        boxShadow: "0 14px 35px -5px rgba(65, 28, 43, 0.14), 0 4px 12px rgba(65, 28, 43, 0.08)",
        color: styles.color,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        animation: "toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "top right",
      }}
      role="alert"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2.1rem",
          height: "2.1rem",
          borderRadius: "0.75rem",
          background: styles.iconBg,
          color: styles.iconColor,
          flexShrink: 0,
          marginTop: "0.1rem",
        }}
      >
        {styles.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.92rem",
              lineHeight: 1.3,
              marginBottom: "0.2rem",
              color: styles.titleColor,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            {toast.title}
          </div>
        )}
        <div
          style={{
            fontSize: "0.85rem",
            lineHeight: 1.45,
            color: styles.color,
            wordBreak: "break-word",
            fontWeight: 500,
          }}
        >
          {toast.message}
        </div>
      </div>

      <button
        onClick={onDismiss}
        type="button"
        aria-label="Close notification"
        style={{
          background: "transparent",
          border: "none",
          color: styles.titleColor,
          opacity: 0.5,
          cursor: "pointer",
          padding: "0.25rem",
          borderRadius: "0.375rem",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "opacity 0.15s, background 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function getToastStyles(type: ToastType) {
  switch (type) {
    case "error":
      return {
        bg: "rgba(255, 253, 250, 0.97)",
        border: "rgba(225, 29, 72, 0.3)",
        accentColor: "#be123c",
        color: "#6b1724",
        titleColor: "#411c2b",
        iconBg: "rgba(225, 29, 72, 0.12)",
        iconColor: "#e11d48",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      };
    case "success":
      return {
        bg: "rgba(255, 253, 250, 0.97)",
        border: "rgba(16, 185, 129, 0.3)",
        accentColor: "#10b981",
        color: "#14532d",
        titleColor: "#411c2b",
        iconBg: "rgba(16, 185, 129, 0.12)",
        iconColor: "#10b981",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ),
      };
    case "warning":
      return {
        bg: "rgba(255, 253, 250, 0.97)",
        border: "rgba(217, 119, 6, 0.3)",
        accentColor: "#d97706",
        color: "#78350f",
        titleColor: "#411c2b",
        iconBg: "rgba(217, 119, 6, 0.12)",
        iconColor: "#d97706",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      };
    case "info":
    default:
      return {
        bg: "rgba(255, 253, 250, 0.97)",
        border: "rgba(177, 81, 101, 0.3)",
        accentColor: "#b15165",
        color: "#55273b",
        titleColor: "#411c2b",
        iconBg: "rgba(177, 81, 101, 0.12)",
        iconColor: "#b15165",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        ),
      };
  }
}
