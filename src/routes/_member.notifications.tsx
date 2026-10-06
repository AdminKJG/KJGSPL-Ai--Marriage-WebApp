import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Text } from "@/components/ui";
import { ErrorState, LoadingState, PageHeader, StateMessage } from "@/components/ui";
import { notificationApi, notificationsQuery, qk } from "@/lib/api/modules";
import type { AppNotification } from "@/lib/api/types";

export const Route = createFileRoute("/_member/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — AI Marriage" },
      { name: "description", content: "Interests, matches and updates on your account." },
      { property: "og:title", content: "Notifications — AI Marriage" },
      { property: "og:description", content: "Interests, matches and updates on your account." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery(notificationsQuery());
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.notifications });

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

  return (
    <>
      <PageHeader
        title="Notifications"
        actions={
          !!data?.unread && (
            <Button variant="outline" size="sm" loading={markAll.isPending} onClick={() => markAll.mutate()}>
              Mark all read
            </Button>
          )
        }
      />
      {isLoading && <LoadingState />}
      {error && <ErrorState error={error} />}
      {data?.items.length === 0 && <StateMessage title="You're all caught up" />}
      <div className="stack-4">
        {data?.items.map((n) => (
          <Card key={n.id} variant={n.read ? "surface" : "default"}>
            <div className="row-3 between wrap">
              <div className="stack-1 grow">
                <div className="row-2">
                  {!n.read && <Badge variant="rose" dot>New</Badge>}
                  <Text variant="caption">{n.type}</Text>
                </div>
                <Text>{n.message}</Text>
              </div>
              <div className="row-2">
                {n.actionUrl?.startsWith("/") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!n.read) markRead.mutate(n.id);
                      navigate({ to: n.actionUrl as string });
                    }}
                  >
                    Open
                  </Button>
                )}
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                    Mark read
                  </Button>
                )}
                <Button size="sm" variant="ghost" aria-label="Delete notification" onClick={() => remove.mutate(n.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
