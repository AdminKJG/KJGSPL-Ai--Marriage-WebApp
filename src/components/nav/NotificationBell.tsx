import { useNavigate, useRouterState } from "@tanstack/react-router";
import { BellIcon } from "@/components/icons/NavIcons";

interface NotificationBellProps {
  unread?: number;
}

export function NotificationBell({ unread = 0 }: NotificationBellProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = pathname === "/notifications" || pathname.startsWith("/notifications/");

  return (
    <button
      type="button"
      className={`header-bell-btn${isActive ? " header-bell-btn--active" : ""}`}
      onClick={() => navigate({ to: "/notifications" })}
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      title={unread > 0 ? `${unread} unread notifications` : "Notifications"}
    >
      <BellIcon size={20} />
      {unread > 0 && (
        <span className="header-bell-badge" aria-hidden="true">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}
