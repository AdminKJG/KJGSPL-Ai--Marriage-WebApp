import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Heading, Text } from "@/components/ui";
import { ErrorState, LoadingState, PageHeader, StateMessage } from "@/components/ui";
import { eventsApi, eventsQuery, qk } from "@/lib/api/modules";
import type { EventItem } from "@/lib/api/types";

export const Route = createFileRoute("/_member/events")({
  head: () => ({
    meta: [
      { title: "Events — AI Marriage" },
      { name: "description", content: "Curated in-person events for members." },
      { property: "og:title", content: "Events — AI Marriage" },
      { property: "og:description", content: "Curated in-person events for members." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery(eventsQuery());
  const save = useMutation({
    mutationFn: (v: { id: string; saved: boolean }) => eventsApi.save(v.id, v.saved),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.events });
      const previous = qc.getQueryData<EventItem[]>(qk.events);
      if (previous) {
        qc.setQueryData<EventItem[]>(
          qk.events,
          previous.map((e) => (e.id === v.id ? { ...e, saved: v.saved } : e))
        );
      }
      return { previous };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) qc.setQueryData(qk.events, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.events }),
  });
  return (
    <>
      <PageHeader title="Events" subtitle="Meet people in calm, curated settings." />
      {isLoading && <LoadingState />}
      {error && <ErrorState error={error} />}
      {data?.length === 0 && <StateMessage title="No upcoming events" />}
      <div className="grid-cards">
        {data?.map((e) => (
          <Card key={e.id}>
            <div className="stack-4">
              <div className="row-2 wrap">
                {e.category && <Badge>{e.category}</Badge>}
                {e.bookingConfirmed && <Badge variant="ink">Booked</Badge>}
              </div>
              <Heading level="h3">{e.title}</Heading>
              <Text variant="small">
                {[e.venue ?? e.city, e.startsAt && new Date(e.startsAt).toLocaleString()].filter(Boolean).join(" · ")}
              </Text>
              {e.description && <Text>{e.description}</Text>}
              <div>
                <Button size="sm" variant={e.saved ? "outline" : "primary"} onClick={() => save.mutate({ id: e.id, saved: !e.saved })}>
                  {e.saved ? "Saved" : "Save event"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
