import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { conversationsQuery } from "@/lib/api/modules";
import { useEffect } from "react";
import { LoadingState, StateMessage } from "@/components/ui";

export const Route = createFileRoute("/_member/messages/")({
  component: MessagesIndexRedirect,
});

const ChatThreadSkeleton = () => (
  <div className="stack-4" style={{ width: "100%", height: "100%", padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "4rem" }}>
    <div style={{ alignSelf: "flex-start", width: "fit-content", maxWidth: "70%", display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
      <div style={{ padding: "0.85rem 1.1rem", background: "var(--card)", borderRadius: "16px 16px 16px 4px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: "180px" }}>
        <div style={{ width: "100%", height: "12px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.5 }} />
        <div style={{ width: "70%", height: "12px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.5 }} />
      </div>
    </div>
    
    <div style={{ alignSelf: "flex-end", width: "fit-content", maxWidth: "70%", display: "flex", gap: "0.5rem", alignItems: "flex-end", marginTop: "1rem" }}>
      <div style={{ padding: "0.85rem 1.1rem", background: "var(--rose-active, #f43f5e)", borderRadius: "16px 16px 4px 16px", display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: "220px", opacity: 0.4 }}>
        <div style={{ width: "100%", height: "12px", background: "var(--background)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.8 }} />
        <div style={{ width: "85%", height: "12px", background: "var(--background)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.8 }} />
      </div>
    </div>

    <div style={{ alignSelf: "flex-start", width: "fit-content", maxWidth: "70%", display: "flex", gap: "0.5rem", alignItems: "flex-end", marginTop: "1rem" }}>
      <div style={{ padding: "0.85rem 1.1rem", background: "var(--card)", borderRadius: "16px 16px 16px 4px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: "120px" }}>
        <div style={{ width: "100%", height: "12px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.5 }} />
      </div>
    </div>
  </div>
);

function MessagesIndexRedirect() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(conversationsQuery());

  useEffect(() => {
    // Only auto-redirect on desktop (where both panes are visible)
    if (data && data.length > 0 && window.innerWidth > 768) {
      navigate({ 
        to: "/messages/$profileId", 
        params: { profileId: data[0].profileId }, 
        replace: true 
      });
    }
  }, [data, navigate]);

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--background)" }}>
        <ChatThreadSkeleton />
      </div>
    );
  }

  if (data?.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "var(--background)" }}>
        <StateMessage title="No conversations yet">
          Explore profiles and get mutual matches to start chatting.
        </StateMessage>
      </div>
    );
  }

  return null;
}
