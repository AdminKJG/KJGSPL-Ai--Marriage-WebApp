import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Card, Heading, Label, Text } from "@/components/ui";
import { PageHeader, ProfileSummary } from "@/components/ui";
import { CrownIcon, ShieldCheckIcon, SignOutIcon } from "@/components/icons/NavIcons";
import { accountApi, accountQuery, authApi, meQuery, profileApi, qk } from "@/lib/api/modules";
import { tokenStore } from "@/lib/api/client";
import { signedOut, useAppDispatch } from "@/store";

export const Route = createFileRoute("/_member/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AI Marriage" },
      { name: "description", content: "Notification preferences, blocked members and account controls." },
      { property: "og:title", content: "Settings — AI Marriage" },
      { property: "og:description", content: "Notification preferences, blocked members and account controls." },
    ],
  }),
  component: SettingsPage,
});

const PREFS = [
  { key: "emailNotifications", label: "Email notifications" },
  { key: "pushNotifications", label: "Push notifications" },
  { key: "discoveryEnabled", label: "Show me in Discover" },
];

function SettingsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const account = useQuery(accountQuery());
  const me = useQuery(meQuery());
  const prefs: Record<string, any> = account.data?.preferences ?? {};
  const savePref = useMutation({
    mutationFn: accountApi.preferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.account }),
  });
  
  const meSettings: Record<string, any> = (me.data?.settings as Record<string, any>) ?? {};
  const saveMeSettings = useMutation({
    mutationFn: (settings: any) => profileApi.updateMe({ settings: { ...meSettings, ...settings } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
  const unblock = useMutation({
    mutationFn: profileApi.unblock,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
  const [confirm, setConfirm] = useState(false);
  const del = useMutation({
    mutationFn: profileApi.deleteMe,
    onSuccess: () => {
      tokenStore.clear();
      qc.clear();
      dispatch(signedOut());
      navigate({ to: "/", replace: true });
    },
  });

  const blocked = me.data?.blocked ?? me.data?.blockedUsers ?? [];

  async function handleSignOut() {
    const refresh = tokenStore.getRefresh();
    authApi.logout(refresh).catch(() => {});
    await qc.cancelQueries();
    qc.clear();
    tokenStore.clear();
    dispatch(signedOut());
    navigate({ to: "/login", replace: true });
  }

  return (
    <>
      <PageHeader
        title="Settings & Privacy"
        subtitle="Manage your privacy governance, notification preferences, and account controls."
      />

      {(account.isLoading || me.isLoading) && (
        <Card variant="surface" style={{ borderLeft: "4px solid var(--rose-active)" }}>
          <div className="stack-3">
            <div className="skeleton-shimmer" style={{ width: "200px", height: "1.75rem", borderRadius: "6px" }} />
            <div className="stack-2">
              <div className="skeleton-shimmer" style={{ width: "100%", height: "4rem", borderRadius: "8px" }} />
              <div className="skeleton-shimmer" style={{ width: "100%", height: "4rem", borderRadius: "8px" }} />
              <div className="skeleton-shimmer" style={{ width: "100%", height: "4rem", borderRadius: "8px" }} />
            </div>
          </div>
        </Card>
      )}

      {/* Instagram/Meta-Style Accounts Centre Card */}
      <Card variant="surface" style={{ borderLeft: "4px solid var(--rose-active)" }}>
        <div className="stack-3">
          <div className="row-2 between wrap">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "9999px",
                  background: "rgba(184, 50, 80, 0.1)",
                  color: "var(--rose-active)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheckIcon size={22} />
              </div>
              <div>
                <Heading level="h3" style={{ fontSize: "1.125rem", margin: 0 }}>
                  Accounts Centre
                </Heading>
                <Text variant="small" style={{ color: "var(--muted)", margin: 0 }}>
                  Privacy governance (DPDP Act), communication quiet hours, sensitive consents & receipts
                </Text>
              </div>
            </div>
            <Button size="sm" variant="primary" onClick={() => navigate({ to: "/account-centre" })}>
              Open Accounts Centre →
            </Button>
          </div>
        </div>
      </Card>

      {/* Membership & Boosts Quick Card */}
      <Card variant="surface">
        <div className="row-2 between wrap">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "9999px",
                background: "rgba(65, 28, 43, 0.06)",
                color: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CrownIcon size={22} />
            </div>
            <div>
              <Heading level="h3" style={{ fontSize: "1.125rem", margin: 0 }}>
                Membership Plans & Boosts
              </Heading>
              <Text variant="small" style={{ color: "var(--muted)", margin: 0 }}>
                Manage membership tiers, allowance boosts, and billing invoices
              </Text>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/billing" })}>
            View Plans →
          </Button>
        </div>
      </Card>

      <Card variant="surface">
        <div className="stack-4">
          <Heading level="h3">Preferences</Heading>
          {PREFS.map((p) => (
            <div key={p.key} className="row-2">
              <input
                id={p.key}
                type="checkbox"
                checked={!!prefs[p.key]}
                onChange={(e) => savePref.mutate({ [p.key]: e.target.checked })}
              />
              <Label htmlFor={p.key}>{p.label}</Label>
            </div>
          ))}
          {savePref.error && <p className="ds-field__hint ds-field__hint--error" role="alert">{savePref.error.message}</p>}
        </div>
      </Card>

      <Card variant="surface">
        <div className="stack-4">
          <Heading level="h3">Privacy & Experience</Heading>
          
          <div className="row-2">
            <input
              id="profileVisibility"
              type="checkbox"
              checked={meSettings.profileVisibility !== "hidden"}
              onChange={(e) => saveMeSettings.mutate({ profileVisibility: e.target.checked ? "visible" : "hidden" })}
            />
            <Label htmlFor="profileVisibility">Profile Visible to Others</Label>
          </div>

          <div className="row-2">
            <input
              id="practiceInteractions"
              type="checkbox"
              checked={!!meSettings.practiceInteractions}
              onChange={(e) => saveMeSettings.mutate({ practiceInteractions: e.target.checked })}
            />
            <Label htmlFor="practiceInteractions">Enable Practice Interactions</Label>
          </div>

          <div className="row-2">
            <input
              id="sound"
              type="checkbox"
              checked={!!meSettings.sound}
              onChange={(e) => saveMeSettings.mutate({ sound: e.target.checked })}
            />
            <Label htmlFor="sound">Enable App Sounds</Label>
          </div>
          
          {saveMeSettings.error && <p className="ds-field__hint ds-field__hint--error" role="alert">{saveMeSettings.error.message}</p>}
        </div>
      </Card>

      <Card variant="surface">
        <div className="stack-4">
          <Heading level="h3">Blocked members</Heading>
          {blocked.length === 0 && <Text variant="small">You haven't blocked anyone.</Text>}
          {blocked.map((b) => (
            <div key={b.id} className="row-3 between">
              <ProfileSummary profile={b} />
              <Button size="sm" variant="ghost" onClick={() => unblock.mutate(b.id)}>
                Unblock
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Session / Log Out Card */}
      <Card variant="surface">
        <div className="row-2 between wrap">
          <div>
            <Heading level="h3" style={{ fontSize: "1.125rem", margin: 0 }}>
              Session & Access
            </Heading>
            <Text variant="small" style={{ color: "var(--muted)" }}>
              Sign out of this browser session on AI Marriage.
            </Text>
          </div>
          <Button size="sm" variant="outline" onClick={handleSignOut}>
            <SignOutIcon size={16} style={{ marginRight: "0.375rem" }} />
            Sign out
          </Button>
        </div>
      </Card>

      <Card variant="surface">
        <div className="stack-4">
          <Heading level="h3">Delete account</Heading>
          <Text variant="small">This permanently removes your profile, photos and conversations.</Text>
          {del.error && <p className="ds-field__hint ds-field__hint--error" role="alert">{del.error.message}</p>}
          <div className="row-2">
            {!confirm ? (
              <Button variant="outline" onClick={() => setConfirm(true)}>
                Delete my account
              </Button>
            ) : (
              <>
                <Button variant="rose" loading={del.isPending} onClick={() => del.mutate()}>
                  Yes, delete permanently
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
