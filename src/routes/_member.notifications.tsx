import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { openNotificationsDrawer, useAppDispatch } from "@/store";

export const Route = createFileRoute("/_member/notifications")({
  component: NotificationsRedirect,
});

function NotificationsRedirect() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(openNotificationsDrawer());
    navigate({ to: "/discover", replace: true });
  }, [dispatch, navigate]);

  return null;
}
