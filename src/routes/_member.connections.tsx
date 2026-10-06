import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Heading } from "@/components/ui";
import { ErrorState, LoadingState, PageHeader, ProfileSummary, StateMessage } from "@/components/ui";
import { connectionsQuery, profileApi, qk } from "@/lib/api/modules";
import type { Profile } from "@/lib/api/types";

export const Route = createFileRoute("/_member/connections")({
  head: () => ({
    meta: [
      { title: "Connections — AI Marriage" },
      { name: "description", content: "Interests you've sent, received, and your mutual matches." },
      { property: "og:title", content: "Connections — AI Marriage" },
      { property: "og:description", content: "Interests you've sent, received, and your mutual matches." },
    ],
  }),
  component: ConnectionsPage,
});

const SECTIONS: { key: string; title: string }[] = [
  { key: "mutual", title: "Mutual matches" },
  { key: "received", title: "Interests received" },
  { key: "sent", title: "Interests sent" },
  { key: "saved", title: "Saved" },
];

function ConnectionsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery(connectionsQuery());
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.connections });
  const accept = useMutation({ mutationFn: profileApi.interest, onSuccess: invalidate });
  const unmatch = useMutation({ mutationFn: profileApi.unmatch, onSuccess: invalidate });

  const lists = SECTIONS.map((s) => ({ ...s, items: (data?.[s.key] as Profile[] | undefined) ?? [] }));
  const empty = data && lists.every((l) => l.items.length === 0);

  return (
    <>
      <PageHeader title="Connections" subtitle="Chat opens once interest is mutual." />
      {isLoading && <LoadingState />}
      {error && <ErrorState error={error} />}
      {empty && <StateMessage title="No connections yet">Send interest from Discover to get started.</StateMessage>}
      {lists
        .filter((l) => l.items.length > 0)
        .map((l) => (
          <section key={l.key} className="stack-4">
            <Heading level="h3">{l.title}</Heading>
            <div className="grid-cards">
              {l.items.map((p) => (
                <Card key={p.id}>
                  <div className="stack-4">
                    <ProfileSummary profile={p} />
                    <div className="row-2 wrap">
                      <Button size="sm" variant="outline" onClick={() => navigate({ to: "/profile/$id", params: { id: p.id } })}>
                        View
                      </Button>
                      {l.key === "received" && (
                        <Button size="sm" onClick={() => accept.mutate(p.id)}>
                          Accept
                        </Button>
                      )}
                      {l.key === "mutual" && (
                        <>
                          <Button size="sm" onClick={() => navigate({ to: "/messages/$profileId", params: { profileId: p.id } })}>
                            Message
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => unmatch.mutate(p.id)}>
                            Unmatch
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
    </>
  );
}
