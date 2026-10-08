import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Badge, Card, ErrorState, LoadingState, PageHeader, StateMessage } from "@/components/ui";
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
    <div className="stack-6" style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
      <PageHeader
        title="Messages"
        subtitle="Conversations with your mutual candidate matches."
      />
      {isLoading && <LoadingState count={3} />}
      {error && <ErrorState error={error} />}
      {data?.length === 0 && (
        <StateMessage title="No conversations yet">
          Conversations will appear here automatically as soon as you have a mutual match with a candidate.
        </StateMessage>
      )}

      <div className="stack-3">
        {data?.map((c) => {
          const lastMsgObj = typeof c.lastMessage === "string" ? null : c.lastMessage;
          const lastText = typeof c.lastMessage === "string" ? c.lastMessage : c.lastMessage?.text || "Started a new conversation";
          const lastTime = lastMsgObj?.createdAt
            ? new Date(lastMsgObj.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "";

          const profileName = c.profile?.name?.trim() || "Mutual Match";
          const profileMeta = [
            c.profile?.age ? `${c.profile.age} yrs` : null,
            c.profile?.city,
            c.profile?.occupation,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <Card
              key={c.id}
              interactive
              role="link"
              tabIndex={0}
              onClick={() => navigate({ to: "/messages/$profileId", params: { profileId: c.profileId } })}
              onKeyDown={(e) =>
                e.key === "Enter" && navigate({ to: "/messages/$profileId", params: { profileId: c.profileId } })
              }
              style={{
                padding: "1rem 1.25rem",
                borderRadius: "14px",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div className="row-3 between align-center" style={{ gap: "1rem" }}>
                <div className="row-3 align-center" style={{ gap: "1rem", flex: 1, minWidth: 0 }}>
                  <div className="whatsapp-avatar-wrapper">
                    {c.profile && <Avatar profile={c.profile} large />}
                    <span className="whatsapp-online-badge" />
                  </div>
                  <div className="stack-1" style={{ flex: 1, minWidth: 0 }}>
                    <div className="row-2 between align-center">
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: "var(--foreground, #111827)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {profileName}
                      </h3>
                      {lastTime && (
                        <span style={{ fontSize: "0.75rem", color: "var(--foreground-muted, #888)", fontWeight: 500 }}>
                          {lastTime}
                        </span>
                      )}
                    </div>

                    {profileMeta && (
                      <span style={{ fontSize: "0.8rem", color: "var(--rose, #e11d48)", fontWeight: 500 }}>
                        {profileMeta}
                      </span>
                    )}

                    <p
                      style={{
                        margin: "0.2rem 0 0",
                        fontSize: "0.875rem",
                        color: "var(--foreground-muted, #666)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {lastText}
                    </p>
                  </div>
                </div>

                {!!c.unread && c.unread > 0 && (
                  <Badge variant="rose" style={{ borderRadius: "999px", padding: "0.2rem 0.6rem" }}>
                    {c.unread}
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
