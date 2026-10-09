import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { ProfileDropdown } from "@/components/nav/ProfileDropdown";
import {
  CalendarIcon,
  ChatBubbleIcon,
  CompassIcon,
  GearIcon,
  HeartIcon,
  SparklesIcon,
  UserIcon,
} from "@/components/icons/NavIcons";
import type { SessionUser } from "@/lib/api/types";

interface SidebarNavProps {
  user?: SessionUser;
  unread: number;
  onSignOut: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function SidebarNav({ user, unread, onSignOut, isOpen = false, onClose }: SidebarNavProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const mainNavItems = [
    { label: "Discover", to: "/discover", icon: CompassIcon, badge: "AI" },
    { label: "Connections", to: "/connections", icon: HeartIcon },
    { label: "Messages", to: "/messages", icon: ChatBubbleIcon },
    { label: "Events", to: "/events", icon: CalendarIcon },
  ];

  const accountNavItems = [
    { label: "My Profile", to: "/me", icon: UserIcon },
    { label: "Settings", to: "/settings", icon: GearIcon },
  ];

  const handleNavClick = (to: string) => {
    navigate({ to });
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && <div className="app-sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? "app-sidebar--open" : ""}`}>
        {/* 1. Header / Logo + Text Side by Side */}
        <div className="app-sidebar__header">
          <Link to="/discover" className="app-sidebar__brand-link" onClick={onClose}>
            <img src="/assets/ai_marriage_logo.png" alt="AI Marriage Logo" className="app-sidebar__logo-img" />
            {/* <div className="app-sidebar__brand-title">
              <span style={{ color: "#e11d48", fontWeight: 800 }}>AI</span> Marriage
            </div> */}
          </Link>
          {onClose && (
            <button type="button" className="app-sidebar__close-btn" onClick={onClose} aria-label="Close Sidebar">
              ✕
            </button>
          )}
        </div>

        {/* 2. Main Navigation Links */}
        <nav className="app-sidebar__nav" aria-label="Sidebar Main Navigation">
          <div className="app-sidebar__section-title">MAIN NAVIGATION</div>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to || (item.to !== "/discover" && pathname.startsWith(`${item.to}/`));
            return (
              <button
                key={item.to}
                type="button"
                className={`app-sidebar__link ${isActive ? "app-sidebar__link--active" : ""}`}
                onClick={() => handleNavClick(item.to)}
              >
                <span className="app-sidebar__icon">
                  <Icon size={20} />
                </span>
                <span className="app-sidebar__label">{item.label}</span>
                {item.badge && <span className="app-sidebar__tag">{item.badge}</span>}
              </button>
            );
          })}

          <div className="app-sidebar__section-title" style={{ marginTop: "1.5rem" }}>ACCOUNT</div>
          {accountNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <button
                key={item.to}
                type="button"
                className={`app-sidebar__link ${isActive ? "app-sidebar__link--active" : ""}`}
                onClick={() => handleNavClick(item.to)}
              >
                <span className="app-sidebar__icon">
                  <Icon size={20} />
                </span>
                <span className="app-sidebar__label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 4. Footer Section */}
        <div className="app-sidebar__footer">
          <button
            type="button"
            className="app-sidebar__link"
            style={{ color: "#ef4444" }}
            onClick={() => {
              if (onClose) onClose();
              onSignOut();
            }}
          >
            <span className="app-sidebar__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="app-sidebar__label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
