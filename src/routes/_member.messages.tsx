import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Badge, ErrorState, LoadingState, StateMessage } from "@/components/ui";
import { conversationsQuery } from "@/lib/api/modules";

export const Route = createFileRoute("/_member/messages")({
  component: MessagesLayout,
});

const ChatListSkeleton = () => (
  <div className="stack-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} style={{ padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", gap: "1rem", alignItems: "center", background: "var(--card)" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--border)", animation: "pulse 1.5s infinite", flexShrink: 0, opacity: 0.6 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{ width: "60%", height: "12px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.6 }} />
          <div style={{ width: "80%", height: "10px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.6 }} />
        </div>
      </div>
    ))}
  </div>
);

function MessagesLayout() {
  const navigate = useNavigate();
  const router = useRouterState();
  const { data, isLoading, error } = useQuery(conversationsQuery());

  const isIndex = router.location.pathname === "/messages" || router.location.pathname === "/messages/";

  return (
    <div 
      className="messages-split-layout"
      style={{ 
        display: "flex", 
        height: "calc(100vh - 72px)", // Header is roughly 72px
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        marginTop: "calc(-1 * var(--space-8, 2rem))",
        marginBottom: "calc(-1 * var(--space-16, 4rem))",
        overflow: "hidden", 
        backgroundColor: "var(--background)",
        borderTop: "1px solid var(--border)"
      }}
    >
      <style>{`
        .mobile-back-btn {
          display: none;
        }
        @media (max-width: 768px) {
          .messages-sidebar {
            display: ${isIndex ? 'flex' : 'none'} !important;
            width: 100% !important;
            border-right: none !important;
          }
          .messages-content {
            display: ${isIndex ? 'none' : 'flex'} !important;
          }
          .mobile-back-btn {
            display: flex !important;
          }
        }
      `}</style>
      
      {/* Sidebar: Chat List */}
      <div 
        className="messages-sidebar"
        style={{ 
          width: "350px", 
          minWidth: "350px", 
          borderRight: "1px solid var(--border)", 
          display: "flex", 
          flexDirection: "column", 
          backgroundColor: "var(--card)" 
        }}
      >
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
           <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 400, margin: 0, color: "var(--ink)", letterSpacing: "var(--tracking-tight)" }}>Messages</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }} className="stack-2">
          {isLoading && <ChatListSkeleton />}
          {error && <ErrorState error={error} />}
          {data?.length === 0 && (
            <StateMessage title="No conversations yet">
              Mutual matches will appear here.
            </StateMessage>
          )}

          {data?.map((c) => {
            const lastMsgObj = typeof c.lastMessage === "string" ? null : c.lastMessage;
            const lastText = typeof c.lastMessage === "string" ? c.lastMessage : c.lastMessage?.text || "Started a new conversation";
            const lastTime = lastMsgObj?.createdAt
              ? new Date(lastMsgObj.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";

            const profileName = c.profile?.name?.trim() || "Mutual Match";
            const isActive = router.location.pathname === `/messages/${c.profileId}`;

            return (
              <div
                key={c.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate({ to: "/messages/$profileId", params: { profileId: c.profileId } })}
                onKeyDown={(e) =>
                  e.key === "Enter" && navigate({ to: "/messages/$profileId", params: { profileId: c.profileId } })
                }
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  cursor: "pointer",
                  backgroundColor: isActive ? "var(--accent)" : "transparent",
                  border: isActive ? "1px solid var(--border)" : "1px solid transparent",
                  transition: "all 0.15s",
                }}
                className="chat-list-item"
              >
                <div className="row-3 between align-center" style={{ gap: "1rem" }}>
                  <div className="whatsapp-avatar-wrapper">
                    {c.profile && <Avatar profile={c.profile} />}
                    <span className="whatsapp-online-badge" style={{ background: "var(--rose-active)", borderColor: "var(--card)" }} />
                  </div>
                  <div className="stack-1" style={{ flex: 1, minWidth: 0 }}>
                    <div className="row-2 between align-center">
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: isActive ? 600 : 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {profileName}
                      </h3>
                      {lastTime && (
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500 }}>
                          {lastTime}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lastText}
                    </p>
                  </div>
                  {!!c.unread && c.unread > 0 && (
                    <Badge style={{ background: "var(--rose-active)", color: "#fff", borderRadius: "999px", padding: "0.1rem 0.4rem", fontSize: "0.75rem" }}>
                      {c.unread}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content: Chat View */}
      <div 
        className="messages-content"
        style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, backgroundColor: "var(--background)" }}
      >
        <Outlet />
      </div>
    </div>
  );
}
