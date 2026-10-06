import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarIcon,
  ChatBubbleIcon,
  CompassIcon,
  HeartIcon,
  UserIcon,
} from "@/components/icons/NavIcons";

export function MobileBottomNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const navItems = [
    { label: "Discover", to: "/discover", icon: CompassIcon },
    { label: "Connections", to: "/connections", icon: HeartIcon },
    { label: "Messages", to: "/messages", icon: ChatBubbleIcon },
    { label: "Events", to: "/events", icon: CalendarIcon },
    { label: "Profile", to: "/me", icon: UserIcon },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <button
            key={item.to}
            type="button"
            className={`mobile-bottom-nav-item${isActive ? " mobile-bottom-nav-item--active" : ""}`}
            onClick={() => navigate({ to: item.to })}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="mobile-bottom-nav-icon">
              <Icon size={22} />
            </span>
            <span className="mobile-bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
