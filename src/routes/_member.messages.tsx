import { useState, useMemo } from "react";
import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Badge, ErrorState, StateMessage } from "@/components/ui";
import { conversationsQuery, allPresenceQuery, type PresenceItem } from "@/lib/api/modules";

export const Route = createFileRoute("/_member/messages")({
  component: MessagesLayout,
});

const ChatListSkeleton = () => (
  <div className="stack-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} style={{ padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", gap: "1rem", alignItems: "center", background: "var(--card)" }}>
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
  const presenceQueryData = useQuery(allPresenceQuery());
  const [searchQuery, setSearchQuery] = useState("");

  const presenceMap = useMemo(() => {
    const map = new Map<string, boolean>();
    presenceQueryData.data?.forEach((item: PresenceItem) => map.set(item.userId, item.online));
    return map;
  }, [presenceQueryData.data]);

  const isIndex = router.location.pathname === "/messages" || router.location.pathname === "/messages/";

  const filteredConversations = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();
    return data.filter((c) => {
      const profileName = c.profile?.name?.toLowerCase() || "";
      const lastText = (typeof c.lastMessage === "string" ? c.lastMessage : c.lastMessage?.text || "").toLowerCase();
      return profileName.includes(q) || lastText.includes(q);
    });
  }, [data, searchQuery]);

  return (
    <div 
      className="messages-split-layout"
      style={{ 
        display: "flex", 
        height: "calc(100vh - 77px)", 
        width: "100%",
        maxWidth: "100%",
        margin: 0,
        overflow: "hidden", 
        backgroundColor: "var(--background)",
        borderTop: "1px solid var(--border)"
      }}
    >
      <style>{`
        .mobile-back-btn {
          display: none;
        }
        .chat-list-item {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .chat-list-item:hover {
          background-color: var(--accent) !important;
          transform: translateY(-1px);
        }
        .chat-search-input:focus {
          border-color: var(--rose-active) !important;
          box-shadow: 0 0 0 3px rgba(186, 107, 120, 0.15) !important;
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
        <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", fontWeight: 500, margin: 0, color: "var(--ink)", letterSpacing: "var(--tracking-tight)" }}>Messages</h2>
            {data && data.length > 0 && (
              <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "var(--accent)", color: "var(--rose-active)", border: "1px solid var(--border)" }}>
                {data.length} {data.length === 1 ? 'chat' : 'chats'}
              </span>
            )}
          </div>
          
          {/* Search Bar */}
          <div style={{ position: "relative", width: "100%" }}>
            <svg 
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", width: "16px", height: "16px", pointerEvents: "none" }} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="chat-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats by name or message..."
              style={{
                width: "100%",
                padding: "0.55rem 2.2rem 0.55rem 2.25rem",
                fontSize: "0.85rem",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--background)",
                color: "var(--ink)",
                outline: "none",
                transition: "all 0.2s ease"
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%"
                }}
              >
                <svg style={{ width: "14px", height: "14px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }} className="stack-2">
          {isLoading && <ChatListSkeleton />}
          {error && <ErrorState error={error} />}
          {!isLoading && !error && data?.length === 0 && (
            <StateMessage title="No conversations yet">
              Mutual matches will appear here.
            </StateMessage>
          )}

          {!isLoading && !error && data && data.length > 0 && filteredConversations.length === 0 && (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--muted)" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>No chats found</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>No match for &quot;{searchQuery}&quot;</p>
            </div>
          )}

          {filteredConversations.map((c) => {
            const lastMsgObj = typeof c.lastMessage === "string" ? null : c.lastMessage;
            const lastText = typeof c.lastMessage === "string" ? c.lastMessage : c.lastMessage?.text || "Started a new conversation";
            const lastTime = lastMsgObj?.createdAt
              ? new Date(lastMsgObj.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";

            const profileName = c.profile?.name?.trim() || "Mutual Match";
            const isActive = router.location.pathname === `/messages/${c.profileId}`;
            const isUserOnline = c.isBot || presenceMap.get(c.profileId) === true;

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
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  cursor: "pointer",
                  backgroundColor: isActive ? "var(--accent)" : "transparent",
                  border: isActive ? "1px solid rgba(186, 107, 120, 0.3)" : "1px solid transparent",
                  boxShadow: isActive ? "0 2px 8px rgba(0, 0, 0, 0.04)" : "none",
                }}
                className="chat-list-item"
              >
                <div className="row-3 between align-center" style={{ gap: "0.85rem" }}>
                  <div className="whatsapp-avatar-wrapper" style={{ flexShrink: 0 }}>
                    {c.profile && <Avatar profile={c.profile} />}
                    <span
                      className="whatsapp-online-badge"
                      style={{
                        background: isUserOnline ? "#10b981" : "#71717a",
                        borderColor: "var(--card)",
                      }}
                    />
                  </div>
                  <div className="stack-1" style={{ flex: 1, minWidth: 0 }}>
                    <div className="row-2 between align-center" style={{ gap: "0.5rem" }}>
                      <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: isActive ? 600 : 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {profileName}
                      </h3>
                      {lastTime && (
                        <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500, flexShrink: 0 }}>
                          {lastTime}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.825rem", color: isActive ? "var(--ink)" : "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lastText}
                    </p>
                  </div>
                  {!!c.unread && c.unread > 0 && (
                    <Badge style={{ background: "var(--rose-active)", color: "#fff", borderRadius: "999px", padding: "0.15rem 0.45rem", fontSize: "0.72rem", fontWeight: 600, flexShrink: 0 }}>
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

