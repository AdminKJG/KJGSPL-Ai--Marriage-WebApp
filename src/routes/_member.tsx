import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { SiteHeader } from "@/components/ui";
import { BrandLogo } from "@/components/BrandLogo";
import { AppNavLink } from "@/components/ui";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { ProfileDropdown } from "@/components/nav/ProfileDropdown";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { setSessionExpiredHandler, tokenStore } from "@/lib/api/client";
import { authApi, configQuery, notificationsQuery, qk } from "@/lib/api/modules";
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

import { IncomingCallModal } from "@/components/calling/IncomingCallModal";
import { ActiveCallModal } from "@/components/calling/ActiveCallModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const Route = createFileRoute("/_member")({
  ssr: false,
  beforeLoad: ({ location }) => {
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

  const session = useQuery({ queryKey: ["session"], queryFn: authApi.session, retry: false });
  const notifications = useQuery(notificationsQuery());
  const config = useQuery(configQuery());
  const isOnline = useAppSelector((s) => s.ui.isOnline);

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

  async function signOut() {
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

  return (
    <>
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
      <SiteHeader
        brand={<BrandLogo to="/discover" size="sm" />}
        actions={
          <div className="header-utilities">
            <NotificationBell unread={unread} />
            <ProfileDropdown user={session.data?.user} onSignOut={signOut} />
          </div>
        }
      >
        <AppNavLink to="/discover">Discover</AppNavLink>
        <AppNavLink to="/connections">Connections</AppNavLink>
        <AppNavLink to="/messages">Messages</AppNavLink>
        <AppNavLink to="/events">Events</AppNavLink>
      </SiteHeader>
      <main className="app-main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <MobileBottomNav />
      <IncomingCallModal />
      <ActiveCallModal />
    </>
  );
}
