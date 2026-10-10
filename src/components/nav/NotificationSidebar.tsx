import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Text } from "@/components/ui";
import { ErrorState, LoadingState, StateMessage } from "@/components/ui";
import { notificationApi, notificationsQuery, qk } from "@/lib/api/modules";
import type { AppNotification } from "@/lib/api/types";
import { closeNotificationsDrawer, useAppDispatch, useAppSelector } from "@/store";

export function NotificationSidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isOpen = useAppSelector((state) => state.ui.notificationsDrawerOpen);

  const { data, isLoading, error } = useQuery(notificationsQuery());
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.notifications });

  // Fetch fresh notifications when the drawer opens
  useEffect(() => {
    if (isOpen) {
      invalidate();
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        dispatch(closeNotificationsDrawer());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dispatch]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qk.notifications });
      const previous = qc.getQueryData<{ items: AppNotification[]; unread: number }>(qk.notifications);
      if (previous) {
        qc.setQueryData(qk.notifications, {
          items: previous.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unread: Math.max(0, previous.unread - 1),
        });
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(qk.notifications, context.previous);
    },
    onSettled: invalidate,
  });

  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: qk.notifications });
      const previous = qc.getQueryData<{ items: AppNotification[]; unread: number }>(qk.notifications);
      if (previous) {
        qc.setQueryData(qk.notifications, {
          items: previous.items.map((n) => ({ ...n, read: true })),
          unread: 0,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(qk.notifications, context.previous);
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: notificationApi.remove,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qk.notifications });
      const previous = qc.getQueryData<{ items: AppNotification[]; unread: number }>(qk.notifications);
      if (previous) {
        const itemToRemove = previous.items.find((n) => n.id === id);
        qc.setQueryData(qk.notifications, {
          items: previous.items.filter((n) => n.id !== id),
          unread: itemToRemove && !itemToRemove.read ? Math.max(0, previous.unread - 1) : previous.unread,
        });
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(qk.notifications, context.previous);
    },
    onSettled: invalidate,
  });

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch(closeNotificationsDrawer());
  };

  const handleAction = (n: AppNotification) => {
    if (!n.read) {
      markRead.mutate(n.id);
    }
    dispatch(closeNotificationsDrawer());
    if (n.actionUrl?.startsWith("/")) {
      navigate({ to: n.actionUrl });
    }
  };

  return (
    <div className="notification-drawer-wrapper" role="dialog" aria-modal="true" aria-label="Notifications Drawer">
      {/* Backdrop */}
      <div className="notification-drawer-backdrop" onClick={handleClose} />

      {/* Right Drawer Panel */}
      <aside className="notification-drawer-panel">
        <header className="notification-drawer-header">
          <div className="notification-drawer-title-group">
            <h2 className="notification-drawer-title">Notifications</h2>
            {!!data?.unread && data.unread > 0 && (
              <span className="notification-drawer-badge">{data.unread} unread</span>
            )}
          </div>
          <div className="notification-drawer-actions">
            {!!data?.unread && data.unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                loading={markAll.isPending}
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </Button>
            )}
            <button
              type="button"
              className="notification-drawer-close"
              onClick={handleClose}
              aria-label="Close Notifications"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="notification-drawer-body">
          {isLoading && <LoadingState />}
          {error && <ErrorState error={error} />}
          {!isLoading && !error && data?.items.length === 0 && (
            <div className="notification-drawer-empty">
              <StateMessage title="You're all caught up">
                When you receive new match requests, messages, or updates, they will appear right here.
              </StateMessage>
            </div>
          )}

          <div className="notification-drawer-list">
            {data?.items.map((n) => (
              <Card
                key={n.id}
                variant={n.read ? "surface" : "default"}
                style={{
                  padding: "0.875rem 1rem",
                  borderColor: n.read ? "var(--border)" : "var(--rose-active, #e11d48)",
                  boxShadow: n.read ? "none" : "0 2px 10px rgba(225, 29, 72, 0.08)",
                }}
              >
                <div className="stack-2">
                  <div className="row-2 between wrap" style={{ alignItems: "center" }}>
                    <div className="row-2" style={{ alignItems: "center", gap: "0.5rem" }}>
                      {!n.read && <Badge variant="rose" dot>New</Badge>}
                      <Text variant="caption" style={{ textTransform: "capitalize", fontWeight: 600 }}>
                        {n.type?.replace(/_/g, " ") || "Notification"}
                      </Text>
                    </div>
                    {n.createdAt && (
                      <Text variant="caption" style={{ opacity: 0.7, fontSize: "0.75rem" }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </div>

                  <Text style={{ fontSize: "0.9rem", lineHeight: 1.4 }}>{n.message}</Text>

                  <div className="row-2 between" style={{ marginTop: "0.25rem", alignItems: "center" }}>
                    <div>
                      {n.actionUrl?.startsWith("/") && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAction(n)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                    <div className="row-2" style={{ gap: "0.25rem" }}>
                      {!n.read && (
                        <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                          Mark read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Delete notification"
                        onClick={() => remove.mutate(n.id)}
                        style={{ color: "var(--foreground-muted, #888)" }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
