import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button, SiteHeader } from "@/components/ui";
import { BrandLogo } from "@/components/BrandLogo";
import { AppNavLink } from "@/components/ui";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { ProfileDropdown } from "@/components/nav/ProfileDropdown";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { setSessionExpiredHandler, tokenStore } from "@/lib/api/client";
import { authApi, configQuery, meQuery, notificationsQuery, qk } from "@/lib/api/modules";
import type { Call } from "@/lib/api/types";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import {
  callAccepted,
  callEnded,
  callIncoming,
  callMissed,
  callRejected,
  networkStatus,
  setConfig,
  signedIn,
  signedOut,
  socketStatus,
  useAppDispatch,
  useAppSelector,
} from "@/store";

import { NotificationSidebar } from "@/components/nav/NotificationSidebar";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { IncomingCallModal } from "@/components/calling/IncomingCallModal";
import { ActiveCallModal } from "@/components/calling/ActiveCallModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function SignOutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card, #ffffff)",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          padding: "1.75rem",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(186, 107, 120, 0.12)",
              color: "var(--rose-active, #ba6b78)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
              flexShrink: 0,
            }}
          >
            🚪
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)" }}>
              Are you sure you want to log out?
            </h3>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
              You will need to sign in again to access your messages and matches.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            style={{ padding: "0.6rem 1.25rem", borderRadius: "10px" }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="rose"
            onClick={onConfirm}
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--rose-active) 0%, #f43f5e 100%)",
              fontWeight: 600,
            }}
          >
            Yes, Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_member")({
  ssr: false,
  beforeLoad: ({ location }) => {
    if (location.pathname.includes("/onboarding")) {
      return;
    }
    if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: MemberLayout,
});

function MemberLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const session = useQuery({ queryKey: ["session"], queryFn: authApi.session, retry: false });
  const { data: me } = useQuery(meQuery());
  const notifications = useQuery(notificationsQuery());
  const config = useQuery(configQuery());
  const isOnline = useAppSelector((s) => s.ui.isOnline);

  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);

  // Auto-redirect incomplete onboarding users straight to /onboarding
  useEffect(() => {
    if (me && (me as any).onboardingComplete === false && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [me, pathname, navigate]);

  useEffect(() => {
    const handleOnline = () => dispatch(networkStatus(true));
    const handleOffline = () => dispatch(networkStatus(false));
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [dispatch]);

  useEffect(() => {
    if (session.data?.user) dispatch(signedIn(session.data.user));
  }, [session.data, dispatch]);

  useEffect(() => {
    if (config.data) {
      dispatch(setConfig(config.data));
    }
  }, [config.data, dispatch]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      dispatch(signedOut());
      queryClient.clear();
      navigate({ to: "/login", replace: true });
    });
  }, [dispatch, navigate, queryClient]);

  useEffect(() => {
    let active = true;
    connectSocket().then((s) => {
      if (!s || !active) return;
      s.on("connect", () => dispatch(socketStatus(true)));
      s.on("disconnect", () => dispatch(socketStatus(false)));
      s.on("message_received", () => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        queryClient.invalidateQueries({ queryKey: qk.conversations });
      });

      // Realtime Calling Events
      s.on("call:incoming", (call: Call) => {
        dispatch(callIncoming(call));
      });
      s.on("call:token", (data: { call: Call; url?: string; roomName?: string; token?: string }) => {
        dispatch(callAccepted(data));
      });
      s.on("call:accepted", (data: { call: Call; url?: string; roomName?: string; token?: string }) => {
        dispatch(callAccepted(data));
      });
      s.on("call:rejected", (call: Call) => {
        dispatch(callRejected(call));
      });
      s.on("call:ended", (call: Call) => {
        dispatch(callEnded(call));
      });
      s.on("call:missed", (call: Call) => {
        dispatch(callMissed(call));
      });
    });
    return () => {
      active = false;
      disconnectSocket();
    };
  }, [dispatch, queryClient]);

  async function performSignOut() {
    setConfirmSignOutOpen(false);
    const refresh = tokenStore.getRefresh();
    authApi.logout(refresh).catch(() => {});
    await queryClient.cancelQueries();
    queryClient.clear();
    tokenStore.clear();
    disconnectSocket();
    dispatch(signedOut());
    navigate({ to: "/login", replace: true });
  }

  const unread = notifications.data?.unread ?? 0;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOnboardingPage = pathname.includes("/onboarding");

  return (
    <div className="member-layout-body">
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: "var(--rose, #e11d48)",
            color: "#ffffff",
            textAlign: "center",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <span>⚠️</span>
          <span>You appear to be offline. Reconnecting to AI Marriage server...</span>
        </div>
      )}

      {/* Sidebar Navigation - Hidden on onboarding */}
      {!isOnboardingPage && (
        <SidebarNav
          user={session.data?.user}
          unread={unread}
          onSignOut={() => setConfirmSignOutOpen(true)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Top Header Bar - Hidden on onboarding */}
      {!isOnboardingPage && (
        <header className="desktop-top-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Hamburger Toggle Button for Sidebar Drawer */}
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Sidebar Navigation"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div style={{ fontSize: "0.95rem", color: "#4b5563", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>Welcome back,</span>
              <span style={{ color: "#111827", fontWeight: 700 }}>
                {me?.name || me?.firstName || session.data?.user?.name || "Member"}
              </span>
              <span>👋</span>
            </div>
          </div>

          <div className="desktop-top-header__actions">
            <NotificationBell unread={unread} />
            <ProfileDropdown user={session.data?.user} onSignOut={() => setConfirmSignOutOpen(true)} />
          </div>
        </header>
      )}

      <main className="app-main" style={isOnboardingPage ? { padding: 0, margin: 0, width: "100%", maxWidth: "100%" } : undefined}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      {!isOnboardingPage && <NotificationSidebar />}
      {!isOnboardingPage && <MobileBottomNav />}
      <IncomingCallModal />
      <ActiveCallModal />
      <SignOutConfirmModal
        isOpen={confirmSignOutOpen}
        onClose={() => setConfirmSignOutOpen(false)}
        onConfirm={performSignOut}
      />
    </div>
  );
}
