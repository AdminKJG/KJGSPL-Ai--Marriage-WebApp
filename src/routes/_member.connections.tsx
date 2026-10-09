import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Heading, Input, Text } from "@/components/ui";
import { ErrorState, LoadingState, PageHeader, StateMessage } from "@/components/ui";
import {
  connectionCategoryQuery,
  connectionCountsQuery,
  connectionsApi,
  connectionsQuery,
  discoveryApi,
  getLocalSavedIds,
  qk,
} from "@/lib/api/modules";
import type { ConnectionCounts, Profile } from "@/lib/api/types";
import { getProfilePhotoUrl } from "@/lib/api/client";

export const Route = createFileRoute("/_member/connections")({
  head: () => ({
    meta: [
      { title: "Connections — AI Marriage" },
      { name: "description", content: "Manage your mutual matches, interests sent & received, and saved shortlists." },
      { property: "og:title", content: "Connections — AI Marriage" },
      { property: "og:description", content: "Manage your mutual matches, interests sent & received, and saved shortlists." },
    ],
  }),
  component: ConnectionsPage,
});

type CategoryKey = "mutual" | "received" | "sent" | "saved";

const TAB_CONFIG: { key: CategoryKey; title: string; icon: string; description: string }[] = [
  { key: "mutual", title: "Mutual Matches", icon: "💕", description: "Reciprocal matches — messaging is unlocked!" },
  { key: "received", title: "Interests Received", icon: "📥", description: "Members who expressed interest in you." },
  { key: "sent", title: "Interests Sent", icon: "📤", description: "Requests you have sent awaiting response." },
  { key: "saved", title: "Saved Shortlists", icon: "⭐", description: "Profiles bookmarked for later review." },
];

const ConnectionsSkeleton = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "1.2rem" }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i} style={{ borderRadius: "16px", padding: "1.2rem", position: "relative" }}>
         <div className="stack-3" style={{ opacity: 0.65 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div style={{ width: "80px", height: "1.25rem", background: "var(--border, #e5e7eb)", borderRadius: "9999px", animation: "pulse 1.5s infinite" }} />
               <div style={{ width: "1.5rem", height: "1.5rem", background: "var(--border, #e5e7eb)", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
            </div>
            <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
               <div style={{ width: "64px", height: "64px", borderRadius: "14px", background: "var(--border, #e5e7eb)", animation: "pulse 1.5s infinite" }} />
               <div className="stack-2" style={{ flex: 1, paddingTop: "0.25rem" }}>
                  <div style={{ width: "70%", height: "1rem", background: "var(--border, #e5e7eb)", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
                  <div style={{ width: "90%", height: "0.75rem", background: "var(--border, #e5e7eb)", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
                  <div style={{ width: "50%", height: "0.75rem", background: "var(--border, #e5e7eb)", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
               </div>
            </div>
            <div style={{ width: "100%", height: "2rem", background: "var(--border, #e5e7eb)", borderRadius: "4px", animation: "pulse 1.5s infinite", marginTop: "0.5rem" }} />
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
               <div style={{ flex: 1, height: "2.25rem", background: "var(--border, #e5e7eb)", borderRadius: "9999px", animation: "pulse 1.5s infinite" }} />
               <div style={{ flex: 1, height: "2.25rem", background: "var(--border, #e5e7eb)", borderRadius: "9999px", animation: "pulse 1.5s infinite" }} />
            </div>
         </div>
      </Card>
    ))}
  </div>
);

function ConnectionsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<CategoryKey>("mutual");
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [minAlignment, setMinAlignment] = useState<number>(0);
  const [statusBanner, setStatusBanner] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);

  // Modals state
  const [unmatchTarget, setUnmatchTarget] = useState<Profile | null>(null);
  const [blockTarget, setBlockTarget] = useState<Profile | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [interestTarget, setInterestTarget] = useState<{ profile: Profile; isAccepting: boolean } | null>(null);
  const [customNote, setCustomNote] = useState("");

  // Queries
  const { data: allData, isLoading: isAllLoading, error: allError } = useQuery(connectionsQuery());
  const { data: countsData } = useQuery(connectionCountsQuery());
  const { data: categoryData, isLoading: isCategoryLoading } = useQuery(
    connectionCategoryQuery(activeTab, page, 12)
  );

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: qk.connections });
    qc.invalidateQueries({ queryKey: qk.connectionCounts });
    qc.invalidateQueries({ queryKey: qk.conversations });
    qc.invalidateQueries({ queryKey: qk.discovery });
  };

  const showNotification = (text: string, type: "success" | "info" | "error" = "success") => {
    setStatusBanner({ type, text });
    setTimeout(() => setStatusBanner(null), 5000);
  };

  // Mutations
  const interestMutation = useMutation({
    mutationFn: ({ targetUserId, message }: { targetUserId: string; message?: string }) =>
      connectionsApi.expressInterest(targetUserId, message),
    onSuccess: (res) => {
      invalidateAll();
      if (res?.status === "matched") {
        showNotification("It's a Match! 🎉 You can now chat directly.", "success");
      } else {
        showNotification("Express interest sent successfully!", "success");
      }
      setInterestTarget(null);
      setCustomNote("");
    },
    onError: () => {
      showNotification("Could not send interest request. Please try again.", "error");
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (targetUserId: string) => connectionsApi.unsaveProfile(targetUserId),
    onSuccess: () => {
      invalidateAll();
      showNotification("Profile removed from saved shortlists.", "info");
    },
  });

  const saveMutation = useMutation({
    mutationFn: (targetUserId: string) => connectionsApi.saveProfile(targetUserId),
    onSuccess: () => {
      invalidateAll();
      showNotification("Profile added to saved shortlists.", "success");
    },
  });

  const unmatchMutation = useMutation({
    mutationFn: (targetUserId: string) => connectionsApi.unmatch(targetUserId),
    onSuccess: () => {
      invalidateAll();
      showNotification("Connection unmatched successfully.", "info");
      setUnmatchTarget(null);
    },
    onError: () => {
      showNotification("Failed to unmatch connection.", "error");
    },
  });

  const passMutation = useMutation({
    mutationFn: (targetUserId: string) => discoveryApi.passProfile(targetUserId),
    onSuccess: () => {
      invalidateAll();
      showNotification("Passed profile for today.", "info");
    },
  });

  const blockMutation = useMutation({
    mutationFn: ({ targetUserId, reason }: { targetUserId: string; reason: string }) =>
      connectionsApi.block(targetUserId, reason),
    onSuccess: () => {
      invalidateAll();
      showNotification("Member blocked and removed from connections.", "info");
      setBlockTarget(null);
      setBlockReason("");
    },
  });

  // Calculate Badge Counts
  const counts: ConnectionCounts = {
    mutualCount: countsData?.mutualCount ?? allData?.mutual?.length ?? 0,
    receivedCount: countsData?.receivedCount ?? allData?.received?.length ?? 0,
    sentCount: countsData?.sentCount ?? allData?.sent?.length ?? 0,
    savedCount: countsData?.savedCount ?? allData?.saved?.length ?? 0,
  };

  const getTabBadgeCount = (key: CategoryKey): number => {
    switch (key) {
      case "mutual":
        return counts.mutualCount ?? 0;
      case "received":
        return counts.receivedCount ?? 0;
      case "sent":
        return counts.sentCount ?? 0;
      case "saved":
        return counts.savedCount ?? 0;
      default:
        return (
          (counts.mutualCount ?? 0) +
          (counts.receivedCount ?? 0) +
          (counts.sentCount ?? 0) +
          (counts.savedCount ?? 0)
        );
    }
  };

  const getProfilesForCategory = (cat: CategoryKey): Profile[] => {
    if (categoryData?.category === cat) {
      return categoryData.items ?? [];
    }
    return (allData?.[cat] as Profile[] | undefined) ?? [];
  };

  // Filter profiles based on search query & min alignment
  const filterProfiles = (profiles: Profile[]): Profile[] => {
    return profiles.filter((p) => {
      const name = (p.name || `${p.firstName || ""} ${p.lastName || ""}`).toLowerCase();
      const city = (p.city || "").toLowerCase();
      const occ = (p.occupation || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || city.includes(q) || occ.includes(q);
      const matchesAlignment = !minAlignment || (p.alignment ?? 0) >= minAlignment;

      return matchesSearch && matchesAlignment;
    });
  };

  const sectionsToRender = [
    {
      key: activeTab,
      title: TAB_CONFIG.find((t) => t.key === activeTab)?.title || "Connections",
      icon: TAB_CONFIG.find((t) => t.key === activeTab)?.icon || "🔗",
      description: TAB_CONFIG.find((t) => t.key === activeTab)?.description || "",
    },
  ];

  const isLoading = isAllLoading || isCategoryLoading;

  return (
    <div className="connections-page-container stack-6" style={{ width: "100%" }}>
      {/* Header */}
      <PageHeader
        title="Connections Centre"
        subtitle="Manage your mutual matches, express interests, received requests, and saved shortlists."
      />

      {/* Status Alert Banner */}
      {statusBanner && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            borderRadius: "12px",
            background:
              statusBanner.type === "success"
                ? "#f0fdf4"
                : statusBanner.type === "error"
                ? "#fef2f2"
                : "#eff6ff",
            border: `1px solid ${
              statusBanner.type === "success"
                ? "#86efac"
                : statusBanner.type === "error"
                ? "#fca5a5"
                : "#bfdbfe"
            }`,
            color:
              statusBanner.type === "success"
                ? "#166534"
                : statusBanner.type === "error"
                ? "#991b1b"
                : "#1e40af",
            fontSize: "0.9rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <span>{statusBanner.text}</span>
          <button
            onClick={() => setStatusBanner(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "inherit" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Summary Header Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          onClick={() => { setActiveTab("mutual"); setPage(1); }}
          style={{
            padding: "1.2rem",
            borderRadius: "16px",
            background: activeTab === "mutual" ? "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)" : "#ffffff",
            border: activeTab === "mutual" ? "2px solid #f43f5e" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1.5rem" }}>💕</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e11d48" }}>{counts.mutualCount}</span>
          </div>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>Mutual Matches</p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>Chat unlocked</p>
        </div>

        <div
          onClick={() => { setActiveTab("received"); setPage(1); }}
          style={{
            padding: "1.2rem",
            borderRadius: "16px",
            background: activeTab === "received" ? "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)" : "#ffffff",
            border: activeTab === "received" ? "2px solid #ea580c" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1.5rem" }}>📥</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ea580c" }}>{counts.receivedCount}</span>
          </div>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>Received Requests</p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>Awaiting your decision</p>
        </div>

        <div
          onClick={() => { setActiveTab("sent"); setPage(1); }}
          style={{
            padding: "1.2rem",
            borderRadius: "16px",
            background: activeTab === "sent" ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "#ffffff",
            border: activeTab === "sent" ? "2px solid #16a34a" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1.5rem" }}>📤</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#16a34a" }}>{counts.sentCount}</span>
          </div>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>Sent Requests</p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>Pending member response</p>
        </div>

        <div
          onClick={() => { setActiveTab("saved"); setPage(1); }}
          style={{
            padding: "1.2rem",
            borderRadius: "16px",
            background: activeTab === "saved" ? "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)" : "#ffffff",
            border: activeTab === "saved" ? "2px solid #ca8a04" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1.5rem" }}>⭐</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ca8a04" }}>{counts.savedCount}</span>
          </div>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>Saved Shortlists</p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>Bookmarked candidates</p>
        </div>
      </div>


      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f8fafc",
          padding: "0.85rem 1.1rem",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ flex: 1, minWidth: "240px" }}>
          <Input
            id="connections-search"
            placeholder="🔍 Search connections by name, occupation, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", background: "#ffffff" }}
          />
        </div>

      </div>

      {/* Loading state */}
      {isLoading && <ConnectionsSkeleton />}

      {/* Error state */}
      {allError && <ErrorState error={allError} />}

      {/* Main Connection Sections */}
      {!isLoading && !allError && (
        <div className="stack-6">
          {sectionsToRender.map((sec) => {
            const rawProfiles = getProfilesForCategory(sec.key);
            const profiles = filterProfiles(rawProfiles);

            if (profiles.length === 0) {
              return (
                <StateMessage
                  key={sec.key}
                  title={`No ${sec.title} found`}
                >
                  {searchQuery
                    ? "No candidates matched your search criteria."
                    : `You currently have no profiles in ${sec.title.toLowerCase()}. Head to Discover to explore curated profiles!`}
                </StateMessage>
              );
            }

            return (
              <section key={sec.key} className="stack-4">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Heading level="h3" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span>{sec.icon}</span> {sec.title}
                      <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                        ({profiles.length})
                      </span>
                    </Heading>
                    <Text variant="small" style={{ margin: "0.2rem 0 0", color: "#64748b" }}>
                      {sec.description}
                    </Text>
                  </div>


                </div>

                {/* Candidate Cards Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                    gap: "1.2rem",
                  }}
                >
                  {profiles.map((p) => {
                    const photo = getProfilePhotoUrl(p);
                    const displayName = p.name || [p.firstName, p.lastName].filter(Boolean).join(" ") || "Member";
                    const isSaved = (allData?.saved ?? []).some((s) => s.id === p.id) || getLocalSavedIds().includes(p.id);

                    return (
                      <Card key={p.id} style={{ borderRadius: "16px", padding: "1.2rem", position: "relative" }}>
                        <div className="stack-3">
                          {/* Alignment Badge & Quick Save */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {p.alignment != null ? (
                              <span
                                style={{
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "9999px",
                                  background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
                                  color: "#e11d48",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                }}
                              >
                                ⚡ {p.alignment}% Match
                              </span>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Verified Profile</span>
                            )}

                            {/* Bookmark Toggle */}
                            <button
                              type="button"
                              title={isSaved ? "Remove from Saved" : "Save Profile"}
                              onClick={() => {
                                if (isSaved) {
                                  unsaveMutation.mutate(p.id);
                                } else {
                                  saveMutation.mutate(p.id);
                                }
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "1.2rem",
                                padding: "0.2rem",
                              }}
                            >
                              {isSaved ? "⭐" : "☆"}
                            </button>
                          </div>

                          {/* Profile Main Info */}
                          <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
                            <div
                              style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "14px",
                                overflow: "hidden",
                                background: "#f1f5f9",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1.5px solid #e2e8f0",
                              }}
                            >
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={displayName}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#64748b" }}>
                                  {displayName[0]?.toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: "1.05rem",
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {displayName}
                                {p.isVerified && <span title="Verified Member" style={{ color: "#0284c7" }}>✓</span>}
                              </h4>
                              <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                                {[p.age && `${p.age} yrs`, p.city, p.occupation].filter(Boolean).join(" · ")}
                              </p>
                              {p.education && (
                                <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>
                                  🎓 {p.education}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bio / Intention preview */}
                          {(p.bio || p.intention) && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.8rem",
                                color: "#475569",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                fontStyle: "italic",
                              }}
                            >
                              "{p.intention || p.bio}"
                            </p>
                          )}

                          {/* Action Buttons Row */}
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              flexWrap: "wrap",
                              paddingTop: "0.5rem",
                              borderTop: "1px solid #f1f5f9",
                            }}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate({ to: "/profile/$id", params: { id: p.id } })}
                              style={{ flex: 1 }}
                            >
                              View Profile
                            </Button>

                            {/* Mutual Actions */}
                            {sec.key === "mutual" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="rose"
                                  onClick={() => navigate({ to: "/messages/$profileId", params: { profileId: p.id } })}
                                  style={{ flex: 1 }}
                                >
                                  💬 Message
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setUnmatchTarget(p)}
                                  title="Unmatch profile"
                                  style={{ color: "#ef4444" }}
                                >
                                  💔
                                </Button>
                              </>
                            )}

                            {/* Received Actions */}
                            {sec.key === "received" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="rose"
                                  onClick={() => setInterestTarget({ profile: p, isAccepting: true })}
                                  style={{ flex: 1 }}
                                >
                                  ❤️ Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => passMutation.mutate(p.id)}
                                  title="Pass for now"
                                >
                                  Pass
                                </Button>
                              </>
                            )}

                            {/* Sent Actions */}
                            {sec.key === "sent" && (
                              <span
                                style={{
                                  padding: "0.4rem 0.8rem",
                                  borderRadius: "8px",
                                  background: "#f1f5f9",
                                  color: "#64748b",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                }}
                              >
                                ⏳ Pending Response
                              </span>
                            )}

                            {/* Saved Actions */}
                            {sec.key === "saved" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="rose"
                                  onClick={() => setInterestTarget({ profile: p, isAccepting: false })}
                                  style={{ flex: 1 }}
                                >
                                  💌 Connect
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => unsaveMutation.mutate(p.id)}
                                  title="Remove from saved"
                                >
                                  Unsave
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Paginated Category Navigation Controls */}
          {categoryData && categoryData.hasMore && (
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
              <Button
                disabled={page <= 1}
                onClick={() => setPage((prev: number) => Math.max(1, prev - 1))}
                variant="outline"
              >
                ← Previous Page
              </Button>

              <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.9rem", fontWeight: 600 }}>
                Page {categoryData.page}
              </span>

              <Button
                disabled={!categoryData.hasMore}
                onClick={() => setPage((prev: number) => prev + 1)}
                variant="outline"
              >
                Next Page →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 1. Unmatch Confirmation Modal */}
      {unmatchTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "1.5rem",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>
              Unmatch with {unmatchTarget.name || "Member"}?
            </h3>
            <p style={{ margin: "0.75rem 0 1.25rem", fontSize: "0.875rem", color: "#64748b", lineHeight: 1.5 }}>
              Are you sure you want to unmatch? This active connection will be terminated and direct messaging will be revoked.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setUnmatchTarget(null)}>
                Cancel
              </Button>
              <Button
                style={{ background: "#ef4444", color: "#ffffff" }}
                onClick={() => unmatchMutation.mutate(unmatchTarget.id)}
              >
                Confirm Unmatch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Express Interest / Accept Request Modal */}
      {interestTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "1.5rem",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>
              {interestTarget.isAccepting
                ? `Accept Connection Request from ${interestTarget.profile.name || "Member"}`
                : `Express Interest in ${interestTarget.profile.name || "Member"}`}
            </h3>
            <p style={{ margin: "0.5rem 0 1rem", fontSize: "0.85rem", color: "#64748b" }}>
              Include an optional personal message to introduce yourself.
            </p>

            <textarea
              rows={3}
              placeholder="Hi! I liked your profile and compatibility alignment..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.875rem",
                marginBottom: "1.25rem",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setInterestTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="rose"
                onClick={() =>
                  interestMutation.mutate({
                    targetUserId: interestTarget.profile.id,
                    message: customNote,
                  })
                }
              >
                {interestTarget.isAccepting ? "Accept Request" : "Send Interest"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Block Member Modal */}
      {blockTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "1.5rem",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>
              Block {blockTarget.name || "Member"}?
            </h3>
            <p style={{ margin: "0.5rem 0 1rem", fontSize: "0.85rem", color: "#64748b" }}>
              They will be permanently hidden and removed from your connections list.
            </p>

            <Input
              id="block-reason-input"
              placeholder="Reason (optional, e.g. inappropriate behavior)"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              style={{ width: "100%", marginBottom: "1.25rem" }}
            />

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setBlockTarget(null)}>
                Cancel
              </Button>
              <Button
                style={{ background: "#dc2626", color: "#ffffff" }}
                onClick={() => blockMutation.mutate({ targetUserId: blockTarget.id, reason: blockReason })}
              >
                Block Member
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
