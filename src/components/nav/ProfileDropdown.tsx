import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { meQuery } from "@/lib/api/modules";
import { photoUrl } from "@/lib/api/client";
import {
  ChevronDownIcon,
  CrownIcon,
  GearIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SparklesIcon,
  UserIcon,
} from "@/components/icons/NavIcons";
import type { SessionUser } from "@/lib/api/types";

interface ProfileDropdownProps {
  user?: SessionUser;
  onSignOut: () => void;
}

export function ProfileDropdown({ user, onSignOut }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: me } = useQuery(meQuery());

  const displayName = me?.name || user?.name || "My Account";
  const displayEmail = me?.email || "";
  const avatarSrc = photoUrl(me?.mainPhotoUrl ?? me?.photoUrl);
  const initial = displayName.charAt(0).toUpperCase() || "A";

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation: Escape closes and refocuses trigger
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Close menu upon navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleNavigate = (to: string) => {
    setIsOpen(false);
    navigate({ to });
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="profile-dropdown-container" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`profile-trigger-btn${isOpen ? " profile-trigger-btn--open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User profile and settings menu"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {avatarSrc ? (
            <img 
              src={avatarSrc} 
              alt={displayName} 
              style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--line)" }} 
            />
          ) : (
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--accent)", color: "var(--rose-active)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, fontFamily: "var(--font-serif)" }}>
              {initial}
            </div>
          )}
          <div style={{ fontSize: "0.925rem", color: "#4b5563", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span className="hide-on-mobile">Welcome,</span>
            <span style={{ color: "#111827", fontWeight: 700 }}>
              {displayName}
            </span>
            <span className="hide-on-mobile">👋</span>
          </div>
        </div>
        <span className="profile-trigger-chevron">
          <ChevronDownIcon size={14} />
        </span>
      </button>

      {isOpen && (
        <div
          className="profile-dropdown-menu"
          role="menu"
          aria-label="User navigation options"
        >
          {/* Identity Header */}
          <div className="profile-dropdown-header">
            <div className="profile-header-avatar">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} className="profile-header-img" />
              ) : (
                <span className="profile-header-initial">{initial}</span>
              )}
            </div>
            <div className="profile-header-info">
              <div className="profile-header-name">{displayName}</div>
              {displayEmail && <div className="profile-header-email">{displayEmail}</div>}
              <span className="profile-header-badge">Member</span>
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          {/* Social & Persona Section */}
          <div className="profile-dropdown-group" role="group" aria-label="Profile and Story">
            <button
              type="button"
              role="menuitem"
              className={`profile-menu-item${isActive("/me") ? " profile-menu-item--active" : ""}`}
              onClick={() => handleNavigate("/me")}
            >
              <UserIcon size={18} />
              <span>My Profile</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className={`profile-menu-item${isActive("/story") ? " profile-menu-item--active" : ""}`}
              onClick={() => handleNavigate("/story")}
            >
              <SparklesIcon size={18} />
              <span>My Story & Values</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className={`profile-menu-item${isActive("/billing") ? " profile-menu-item--active" : ""}`}
              onClick={() => handleNavigate("/billing")}
            >
              <CrownIcon size={18} />
              <span>Membership Plans & Boosts</span>
            </button>
          </div>

          <div className="profile-dropdown-divider" />

          {/* Governance & Settings Section */}
          <div className="profile-dropdown-group" role="group" aria-label="Settings and Governance">
            <button
              type="button"
              role="menuitem"
              className={`profile-menu-item${isActive("/settings") ? " profile-menu-item--active" : ""}`}
              onClick={() => handleNavigate("/settings")}
            >
              <GearIcon size={18} />
              <span>Settings & Privacy</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className={`profile-menu-item${isActive("/account-centre") ? " profile-menu-item--active" : ""}`}
              onClick={() => handleNavigate("/account-centre")}
            >
              <ShieldCheckIcon size={18} />
              <span>Accounts Centre</span>
            </button>
          </div>

          <div className="profile-dropdown-divider" />

          {/* Sign Out Action */}
          <div className="profile-dropdown-group">
            <button
              type="button"
              role="menuitem"
              className="profile-menu-item profile-menu-item--danger"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
            >
              <SignOutIcon size={18} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
