import { BellIcon } from "@/components/icons/NavIcons";
import { toggleNotificationsDrawer, useAppDispatch, useAppSelector } from "@/store";

interface NotificationBellProps {
  unread?: number;
}

export function NotificationBell({ unread = 0 }: NotificationBellProps) {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.notificationsDrawerOpen);

  return (
    <button
      type="button"
      className={`header-bell-btn${isOpen ? " header-bell-btn--active" : ""}`}
      onClick={() => dispatch(toggleNotificationsDrawer())}
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
