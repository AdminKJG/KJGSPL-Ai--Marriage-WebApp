import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Avatar, Badge, Button, Card, ErrorState, Heading, PageHeader, Text } from "@/components/ui";
import { meQuery, profileApi, qk } from "@/lib/api/modules";

export const Route = createFileRoute("/_member/blocked")({
  head: () => ({
    meta: [
      { title: "Blocked Members — AI Marriage" },
      { name: "description", content: "View and manage members you have blocked." },
      { property: "og:title", content: "Blocked Members — AI Marriage" },
      { property: "og:description", content: "View and manage members you have blocked." },
    ],
  }),
  component: BlockedMembersPage,
});

const BlockedSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} style={{ padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--card)", display: "flex", gap: "1rem", alignItems: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--border)", animation: "pulse 1.5s infinite", flexShrink: 0, opacity: 0.6 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{ width: "40%", height: "16px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.6 }} />
          <div style={{ width: "60%", height: "12px", background: "var(--border)", borderRadius: "4px", animation: "pulse 1.5s infinite", opacity: 0.6 }} />
        </div>
        <div style={{ width: "90px", height: "36px", background: "var(--border)", borderRadius: "8px", animation: "pulse 1.5s infinite", opacity: 0.6 }} />
      </div>
    ))}
  </div>
);

function BlockedMembersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useQuery(meQuery());
  const [searchQuery, setSearchQuery] = useState("");

  const unblock = useMutation({
    mutationFn: profileApi.unblock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.connections });
    },
  });

  const blockedList: any[] = useMemo(() => {
    return (me.data as any)?.blockedProfiles ?? [];
  }, [me.data]);

  useEffect(() => {
    qc.invalidateQueries({ queryKey: qk.me });
  }, [qc]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return blockedList;
    const q = searchQuery.toLowerCase().trim();
    return blockedList.filter((b: any) => {
      const name = b.name?.toLowerCase() || "";
      const city = b.city?.toLowerCase() || "";
      const occupation = b.occupation?.toLowerCase() || "";
      return name.includes(q) || city.includes(q) || occupation.includes(q);
    });
  }, [blockedList, searchQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
      <style>{`
        .blocked-card-item {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .blocked-card-item:hover {
          border-color: rgba(186, 107, 120, 0.35) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04) !important;
        }
        .blocked-search-input:focus {
          border-color: var(--rose-active) !important;
          box-shadow: 0 0 0 3px rgba(186, 107, 120, 0.15) !important;
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/settings" })} style={{ paddingLeft: 0, marginBottom: "0.5rem", color: "var(--muted-foreground)" }}>
            ← Back to Settings
          </Button>
          <PageHeader
            title="Blocked Members"
            subtitle="View and manage members you have blocked from contacting or seeing your profile."
          />
        </div>
        {blockedList.length > 0 && (
          <Badge variant="rose" style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}>
            {blockedList.length} {blockedList.length === 1 ? "Member Blocked" : "Members Blocked"}
          </Badge>
        )}
      </div>

      {/* Search Bar if items > 0 */}
      {blockedList.length > 0 && (
        <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
          <svg 
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", width: "16px", height: "16px", pointerEvents: "none" }} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="blocked-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blocked members..."
            style={{
              width: "100%",
              padding: "0.6rem 2.2rem 0.6rem 2.4rem",
              fontSize: "0.875rem",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
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
                padding: "2px"
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {me.isLoading && <BlockedSkeleton />}
      {me.error && <ErrorState error={me.error} />}

      {!me.isLoading && !me.error && blockedList.length === 0 && (
        <Card variant="surface" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(186, 107, 120, 0.12)", color: "var(--rose-active)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <svg style={{ width: 28, height: 28 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <Heading level="h3" style={{ margin: "0 0 0.5rem", fontSize: "1.2rem", fontWeight: 600 }}>No Blocked Members</Heading>
          <Text style={{ color: "var(--muted-foreground)", maxWidth: "420px", margin: "0 auto 1.5rem", fontSize: "0.9rem" }}>
            You haven&apos;t blocked any members. When you block a member, they will appear in this list.
          </Text>
          <Button variant="primary" onClick={() => navigate({ to: "/discover" })}>
            Explore Profiles →
          </Button>
        </Card>
      )}

      {!me.isLoading && !me.error && blockedList.length > 0 && filteredList.length === 0 && (
        <Card variant="surface" style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
          <Text style={{ margin: 0, fontWeight: 500 }}>No members found matching &quot;{searchQuery}&quot;</Text>
        </Card>
      )}

      {!me.isLoading && !me.error && filteredList.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
          {filteredList.map((b: any) => {
            const meta = [b.age ? `${b.age} yrs` : null, b.city, b.occupation].filter(Boolean).join(" · ");

            return (
              <Card key={b.id} variant="surface" className="blocked-card-item" style={{ padding: "1.15rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                    <Avatar profile={b} />
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.name}
                      </h3>
                      {meta && (
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.825rem", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {meta}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    loading={unblock.isPending}
                    onClick={() => unblock.mutate(b.id)}
                    style={{ color: "var(--rose-active)", borderColor: "rgba(186, 107, 120, 0.4)", flexShrink: 0 }}
                  >
                    Unblock
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
