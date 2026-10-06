import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, Text } from "@/components/ui";
import { ErrorState, LoadingState, PageHeader, ProfileSummary, StateMessage } from "@/components/ui";
import { conversationsQuery } from "@/lib/api/modules";

export const Route = createFileRoute("/_member/messages/")({
  head: () => ({
    meta: [
      { title: "Messages — AI Marriage" },
      { name: "description", content: "Conversations with your mutual matches." },
      { property: "og:title", content: "Messages — AI Marriage" },
      { property: "og:description", content: "Conversations with your mutual matches." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery(conversationsQuery());
  return (
    <>
      <PageHeader title="Messages" />
      {isLoading && <LoadingState />}
      {error && <ErrorState error={error} />}
      {data?.length === 0 && <StateMessage title="No conversations yet">Chats appear here after a mutual match.</StateMessage>}
      <div className="stack-4">
        {data?.map((c) => {
          const last = typeof c.lastMessage === "string" ? c.lastMessage : c.lastMessage?.text;
          return (
            <Card
              key={c.id}
              interactive
              role="link"
              tabIndex={0}
              onClick={() => navigate({ to: "/messages/$profileId", params: { profileId: c.profileId } })}
              onKeyDown={(e) => e.key === "Enter" && navigate({ to: "/messages/$profileId", params: { profileId: c.profileId } })}
            >
              <div className="row-3 between">
                <div className="stack-2 grow">
                  <ProfileSummary profile={c.profile} />
                  {last && <Text variant="small">{last}</Text>}
                </div>
                {!!c.unread && <Badge variant="rose">{c.unread}</Badge>}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
