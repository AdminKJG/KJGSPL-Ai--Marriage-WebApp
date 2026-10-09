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
  { 
    key: "emailNotifications", 
    label: "Email Notifications", 
    desc: "Receive email updates for new matches and messages",
    icon: (
      <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ) 
  },
  { 
    key: "pushNotifications", 
    label: "Push Notifications", 
    desc: "Get instant browser and mobile alerts",
    icon: (
      <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ) 
  },
  { 
    key: "discoveryEnabled", 
    label: "Show me in Discover", 
    desc: "Allow other members to discover your profile",
    icon: (
      <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ) 
  },
];

const SettingsSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
    <div style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--card)", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ width: "200px", height: "20px", borderRadius: "6px", background: "var(--border)", animation: "pulse 1.5s infinite", opacity: 0.6 }} />
      <div style={{ width: "350px", height: "14px", borderRadius: "4px", background: "var(--border)", animation: "pulse 1.5s infinite", opacity: 0.6 }} />
    </div>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} style={{ padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--card)", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ width: "150px", height: "18px", borderRadius: "4px", background: "var(--border)", animation: "pulse 1.5s infinite", opacity: 0.6 }} />
        <div style={{ height: "48px", borderRadius: "10px", background: "var(--border)", animation: "pulse 1.5s infinite", opacity: 0.5 }} />
        <div style={{ height: "48px", borderRadius: "10px", background: "var(--border)", animation: "pulse 1.5s infinite", opacity: 0.5 }} />
      </div>
    ))}
  </div>
);

function ToggleSwitch({ id, checked, onChange, disabled }: { id: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }) {
  return (
    <label className="settings-toggle" htmlFor={id}>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} disabled={disabled} />
      <span className="settings-toggle-slider" />
    </label>
  );
}

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
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  async function handleSignOut() {
    setShowSignOutConfirm(false);
    const refresh = tokenStore.getRefresh();
    authApi.logout(refresh).catch(() => {});
    await qc.cancelQueries();
    qc.clear();
    tokenStore.clear();
    dispatch(signedOut());
    navigate({ to: "/login", replace: true });
  }

  const isLoading = account.isLoading || me.isLoading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
      <style>{`
        .settings-toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .settings-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .settings-toggle-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: var(--border);
          transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 999px;
        }
        .settings-toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .settings-toggle input:checked + .settings-toggle-slider {
          background-color: var(--rose-active);
        }
        .settings-toggle input:checked + .settings-toggle-slider:before {
          transform: translateX(20px);
        }
        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          background: var(--background);
          border: 1px solid var(--border);
          transition: all 0.2s ease;
          gap: 1rem;
        }
        .settings-row:hover {
          border-color: rgba(186, 107, 120, 0.3);
        }
      `}</style>

      <PageHeader
        title="Settings & Privacy"
        subtitle="Manage your privacy governance, notification preferences, and account controls."
      />

      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <>
          {/* Accounts Centre Card */}
          <Card variant="surface" style={{ borderLeft: "4px solid var(--rose-active)" }}>
            <div className="row-2 between wrap" style={{ gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flex: 1, minWidth: "260px" }}>
                <div
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                    borderRadius: "12px",
                    background: "rgba(186, 107, 120, 0.12)",
                    color: "var(--rose-active)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <ShieldCheckIcon size={24} />
                </div>
                <div>
                  <Heading level="h3" style={{ fontSize: "1.1rem", margin: 0, fontWeight: 600 }}>
                    Accounts Centre
                  </Heading>
                  <Text variant="small" style={{ color: "var(--muted-foreground)", margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
                    Privacy governance (DPDP Act), communication quiet hours, sensitive consents & receipts
                  </Text>
                </div>
              </div>
              <Button size="sm" variant="primary" onClick={() => navigate({ to: "/account-centre" })}>
                Open Accounts Centre →
              </Button>
            </div>
          </Card>

          {/* Membership & Boosts Card */}
          <Card variant="surface">
            <div className="row-2 between wrap" style={{ gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flex: 1, minWidth: "260px" }}>
                <div
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                    borderRadius: "12px",
                    background: "var(--accent)",
                    color: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <CrownIcon size={24} />
                </div>
                <div>
                  <Heading level="h3" style={{ fontSize: "1.1rem", margin: 0, fontWeight: 600 }}>
                    Membership Plans & Boosts
                  </Heading>
                  <Text variant="small" style={{ color: "var(--muted-foreground)", margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
                    Manage membership tiers, allowance boosts, and billing invoices
                  </Text>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate({ to: "/billing" })}>
                View Plans →
              </Button>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card variant="surface">
            <div className="stack-4">
              <Heading level="h3" style={{ fontSize: "1.1rem", fontWeight: 600 }}>Notification Preferences</Heading>
              <div className="stack-2">
                {PREFS.map((p) => (
                  <div key={p.key} className="settings-row">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ color: "var(--muted-foreground)", display: "flex" }}>{p.icon}</div>
                      <div>
                        <Label htmlFor={p.key} style={{ margin: 0, fontWeight: 500, cursor: "pointer", fontSize: "0.9rem" }}>{p.label}</Label>
                        <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{p.desc}</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      id={p.key}
                      checked={!!prefs[p.key]}
                      onChange={(e) => savePref.mutate({ [p.key]: e.target.checked })}
                      disabled={savePref.isPending}
                    />
                  </div>
                ))}
              </div>
              {savePref.error && <p className="ds-field__hint ds-field__hint--error" role="alert">{savePref.error.message}</p>}
            </div>
          </Card>

          {/* Privacy & Experience Controls */}
          <Card variant="surface">
            <div className="stack-4">
              <Heading level="h3" style={{ fontSize: "1.1rem", fontWeight: 600 }}>Privacy & Experience</Heading>
              <div className="stack-2">
                <div className="settings-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <svg style={{ width: 18, height: 18, color: "var(--muted-foreground)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <div>
                      <Label htmlFor="profileVisibility" style={{ margin: 0, fontWeight: 500, cursor: "pointer", fontSize: "0.9rem" }}>Profile Visible to Others</Label>
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Control whether your profile appears in search & recommendations</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="profileVisibility"
                    checked={meSettings.profileVisibility !== "hidden"}
                    onChange={(e) => saveMeSettings.mutate({ profileVisibility: e.target.checked ? "visible" : "hidden" })}
                    disabled={saveMeSettings.isPending}
                  />
                </div>

                <div className="settings-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <svg style={{ width: 18, height: 18, color: "var(--muted-foreground)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <Label htmlFor="practiceInteractions" style={{ margin: 0, fontWeight: 500, cursor: "pointer", fontSize: "0.9rem" }}>Enable Practice Interactions</Label>
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Try practice conversation prompts with AI assistance</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="practiceInteractions"
                    checked={!!meSettings.practiceInteractions}
                    onChange={(e) => saveMeSettings.mutate({ practiceInteractions: e.target.checked })}
                    disabled={saveMeSettings.isPending}
                  />
                </div>

                <div className="settings-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <svg style={{ width: 18, height: 18, color: "var(--muted-foreground)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <div>
                      <Label htmlFor="sound" style={{ margin: 0, fontWeight: 500, cursor: "pointer", fontSize: "0.9rem" }}>Enable App Sounds</Label>
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Play sound effects for notifications and chat updates</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="sound"
                    checked={!!meSettings.sound}
                    onChange={(e) => saveMeSettings.mutate({ sound: e.target.checked })}
                    disabled={saveMeSettings.isPending}
                  />
                </div>
              </div>
              {saveMeSettings.error && <p className="ds-field__hint ds-field__hint--error" role="alert">{saveMeSettings.error.message}</p>}
            </div>
          </Card>

          {/* Blocked Members Card */}
          <Card variant="surface">
            <div className="row-2 between wrap" style={{ gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flex: 1, minWidth: "260px" }}>
                <div
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                    borderRadius: "12px",
                    background: "rgba(186, 107, 120, 0.12)",
                    color: "var(--rose-active)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <Heading level="h3" style={{ fontSize: "1.1rem", margin: 0, fontWeight: 600 }}>
                      Blocked Members
                    </Heading>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.15rem 0.55rem", borderRadius: "999px", background: "var(--accent)", color: "var(--rose-active)", border: "1px solid var(--border)" }}>
                      {blocked.length} {blocked.length === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <Text variant="small" style={{ color: "var(--muted-foreground)", margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
                    View and manage accounts you have blocked from contacting you
                  </Text>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate({ to: "/blocked" })}>
                View Blocked List →
              </Button>
            </div>
          </Card>

          {/* Session & Sign Out */}
          <Card variant="surface">
            <div className="row-2 between wrap" style={{ gap: "1rem" }}>
              <div>
                <Heading level="h3" style={{ fontSize: "1.1rem", margin: 0, fontWeight: 600 }}>
                  Session & Access
                </Heading>
                <Text variant="small" style={{ color: "var(--muted-foreground)", margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
                  Sign out of your active session on AI Marriage.
                </Text>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowSignOutConfirm(true)}>
                <SignOutIcon size={16} style={{ marginRight: "0.375rem" }} />
                Sign out
              </Button>
            </div>
          </Card>

          {showSignOutConfirm && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0, 0, 0, 0.55)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
              }}
              onClick={() => setShowSignOutConfirm(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "var(--card, #ffffff)",
                  border: "1px solid var(--border)",
                  borderRadius: "18px",
                  padding: "1.75rem",
                  maxWidth: "420px",
                  width: "100%",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "rgba(186, 107, 120, 0.12)",
                      color: "var(--rose-active, #ba6b78)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      flexShrink: 0,
                    }}
                  >
                    🚪
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)" }}>
                      Are you sure you want to log out?
                    </h3>
                    <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                      You will need to sign in again to access your messages and matches.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSignOutConfirm(false)}
                    style={{ padding: "0.6rem 1.25rem", borderRadius: "10px" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="rose"
                    onClick={handleSignOut}
                    style={{
                      padding: "0.6rem 1.25rem",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, var(--rose-active) 0%, #f43f5e 100%)",
                      fontWeight: 600,
                    }}
                  >
                    Yes, Log out
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone: Delete Account */}
          <Card variant="surface" style={{ borderLeft: "4px solid var(--rose-active)", backgroundColor: "rgba(186, 107, 120, 0.04)" }}>
            <div className="stack-4">
              <Heading level="h3" style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)" }}>Delete Account</Heading>
              <Text variant="small" style={{ color: "var(--muted-foreground)" }}>This permanently removes your profile, photos, matches and conversations.</Text>
              {del.error && <p className="ds-field__hint ds-field__hint--error" role="alert">{del.error.message}</p>}
              <div className="row-2">
                {!confirm ? (
                  <Button variant="outline" onClick={() => setConfirm(true)} style={{ color: "var(--rose-active)", borderColor: "rgba(186, 107, 120, 0.4)" }}>
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
      )}
    </div>
  );
}


