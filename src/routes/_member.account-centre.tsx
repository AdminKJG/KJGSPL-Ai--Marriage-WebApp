import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ChangeEvent } from "react";
import { Badge, Button, Card, Heading, Input, Label, Text } from "@/components/ui";
import { ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { accountApi, accountCentreQuery, billingApi, billingQuery, qk } from "@/lib/api/modules";

export const Route = createFileRoute("/_member/account-centre")({
  head: () => ({
    meta: [
      { title: "Account Centre — AI Marriage" },
      { name: "description", content: "Privacy governance, communication quiet hours, boosts and billing receipts." },
      { property: "og:title", content: "Account Centre — AI Marriage" },
      { property: "og:description", content: "Privacy governance, communication quiet hours, boosts and billing receipts." },
    ],
  }),
  component: AccountCentrePage,
});

type TabType = "governance" | "channels" | "membership" | "receipts";

function AccountCentrePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("governance");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const account = useQuery(accountCentreQuery());
  const billing = useQuery(billingQuery());

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const savePreferences = useMutation({
    mutationFn: accountApi.preferences,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.account });
      showFeedback("Communication preferences updated successfully.");
    },
  });

  const recordConsent = useMutation({
    mutationFn: ({ id, version, accepted }: { id: string; version: number; accepted: boolean }) =>
      accountApi.recordConsent(id, version, accepted),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.account });
      showFeedback("Consent state recorded.");
    },
  });

  const activateBoost = useMutation({
    mutationFn: billingApi.activateBoost,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: qk.billing });
      qc.invalidateQueries({ queryKey: qk.account });
      showFeedback(`Profile boost activated! Remaining boosts: ${data.remainingBoosts}`);
    },
    onError: (err) => {
      showFeedback(err instanceof Error ? err.message : "Failed to activate boost.");
    },
  });

  const data = account.data;
  const billingData = billing.data;

  const prefs = data?.preferences;
  const quietHours = prefs?.quietHours ?? { enabled: false, start: "22:00", end: "08:00" };
  const channels = prefs?.channels ?? { email: true, push: true, sms: false, inApp: true };
  const consents = data?.consents ?? [];
  const policies = data?.configuration?.policies ?? [
    { id: "terms", title: "Terms of Service & Community Safety Standards", version: 1, status: "published" },
    { id: "sensitive", title: "Sensitive Cultural Matching Consent (DPDP Act)", version: 1, status: "published" },
  ];

  const [qhStart, setQhStart] = useState<string>(quietHours.start || "22:00");
  const [qhEnd, setQhEnd] = useState<string>(quietHours.end || "08:00");

  const isConsentGiven = (id: string) => {
    const c = consents.find((x) => x.id === id);
    return c ? c.accepted : false;
  };

  const totalBoosts =
    (billingData?.purchasedBoosts ?? 0) +
    (billingData?.allowanceBoosts ?? 0) +
    (billingData?.promotionalBoosts ?? 0);

  const receipts = data?.receipts?.length ? data.receipts : (billingData?.history ?? []);

  return (
    <>
      <div style={{ marginBottom: "0.75rem" }}>
        <button
          type="button"
          className="auth-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            cursor: "pointer",
            background: "none",
            border: 0,
            padding: 0,
            fontSize: "var(--text-sm)",
            color: "var(--muted)",
          }}
          onClick={() => navigate({ to: "/settings" })}
        >
          ← Back to Settings & Privacy
        </button>
      </div>
      <PageHeader
        title="Account Centre"
        subtitle="Manage data governance, communication quiet hours, profile visibility boosts and official receipts."
        actions={
          <div className="row-2 wrap">
            <Button
              size="sm"
              variant={activeTab === "governance" ? "primary" : "outline"}
              onClick={() => setActiveTab("governance")}
            >
              Privacy & Consents
            </Button>
            <Button
              size="sm"
              variant={activeTab === "channels" ? "primary" : "outline"}
              onClick={() => setActiveTab("channels")}
            >
              Quiet Hours
            </Button>
            <Button
              size="sm"
              variant={activeTab === "membership" ? "primary" : "outline"}
              onClick={() => setActiveTab("membership")}
            >
              Entitlements & Boosts
            </Button>
            <Button
              size="sm"
              variant={activeTab === "receipts" ? "primary" : "outline"}
              onClick={() => setActiveTab("receipts")}
            >
              Receipts {receipts.length > 0 && `(${receipts.length})`}
            </Button>
          </div>
        }
      />

      {feedbackMsg && (
        <Card variant="surface">
          <div className="row-2 align-center" style={{ color: "var(--primary, #4f46e5)" }}>
            <span style={{ fontSize: "1.2rem" }}>✓</span>
            <Text variant="strong">{feedbackMsg}</Text>
          </div>
        </Card>
      )}

      {account.isLoading && (
        <Card variant="surface">
          <div className="stack-4">
            <div className="skeleton-shimmer" style={{ width: "250px", height: "1.75rem", borderRadius: "6px" }} />
            <div className="stack-2">
              <div className="skeleton-shimmer" style={{ width: "100%", height: "3rem", borderRadius: "8px" }} />
              <div className="skeleton-shimmer" style={{ width: "100%", height: "3rem", borderRadius: "8px" }} />
              <div className="skeleton-shimmer" style={{ width: "100%", height: "3rem", borderRadius: "8px" }} />
            </div>
            <div className="skeleton-shimmer" style={{ width: "120px", height: "2.5rem", borderRadius: "8px", marginTop: "1rem" }} />
          </div>
        </Card>
      )}
      {account.error && <ErrorState error={account.error} />}

      <div className="stack-6">
        {/* Tab 1: Privacy & Consents */}
        {activeTab === "governance" && (
          <Card variant="surface">
            <div className="stack-4">
              <div className="row-2 between wrap">
                <Heading level="h2">Data Governance & DPDP Act Consents</Heading>
                {data?.sensitiveMatchingEnabled ? (
                  <Badge variant="rose">Sensitive Matching Enabled</Badge>
                ) : (
                  <Badge variant="outline">Standard Matching Only</Badge>
                )}
              </div>
              <Text variant="small">
                Under DPDP Act and international privacy frameworks, you have sovereignty over which policies and sensitive
                cultural attributes (religion, dietary beliefs, family rhythms) are processed by deterministic matching.
              </Text>

              <div className="stack-3" style={{ marginTop: "0.5rem" }}>
                {policies.map((pol) => {
                  const accepted = isConsentGiven(pol.id);
                  return (
                    <div
                      key={pol.id}
                      className="row-3 between wrap"
                      style={{ padding: "0.85rem 0", borderBottom: "1px solid var(--border, #eee)" }}
                    >
                      <div className="stack-1 grow">
                        <Text variant="strong">{pol.title}</Text>
                        <Text variant="caption">Version {pol.version} · State: {pol.status.toUpperCase()}</Text>
                      </div>
                      <div className="row-2">
                        <Button
                          size="sm"
                          variant={accepted ? "primary" : "outline"}
                          loading={recordConsent.isPending}
                          onClick={() =>
                            recordConsent.mutate({
                              id: pol.id,
                              version: pol.version,
                              accepted: !accepted,
                            })
                          }
                        >
                          {accepted ? "Consent Granted ✓" : "Grant Consent"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Tab 2: Communication & Quiet Hours */}
        {activeTab === "channels" && (
          <div className="grid-2">
            <Card variant="surface">
              <div className="stack-4">
                <Heading level="h3">Delivery Channels</Heading>
                <Text variant="small">Select the channels through which AI Marriage is authorized to contact you.</Text>

                <div className="stack-2">
                  <label className="row-2" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={channels.email ?? false}
                      onChange={(e) =>
                        savePreferences.mutate({
                          channels: { ...channels, email: e.target.checked },
                        })
                      }
                    />
                    <Text>Email Notifications</Text>
                  </label>

                  <label className="row-2" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={channels.push ?? false}
                      onChange={(e) =>
                        savePreferences.mutate({
                          channels: { ...channels, push: e.target.checked },
                        })
                      }
                    />
                    <Text>Mobile Push Notifications</Text>
                  </label>

                  <label className="row-2" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={channels.sms ?? false}
                      onChange={(e) =>
                        savePreferences.mutate({
                          channels: { ...channels, sms: e.target.checked },
                        })
                      }
                    />
                    <Text>SMS Alerts</Text>
                  </label>
                </div>

                <div className="stack-2" style={{ marginTop: "1rem" }}>
                  <Label htmlFor="frequency-select">Summary Cadence</Label>
                  <select
                    id="frequency-select"
                    className="ds-input"
                    value={prefs?.frequency ?? "daily"}
                    onChange={(e) => savePreferences.mutate({ frequency: e.target.value })}
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.375rem",
                      border: "1px solid var(--border, #ccc)",
                    }}
                  >
                    <option value="instant">Instant Real-time Alerts</option>
                    <option value="daily">Daily Digest (Recommended)</option>
                    <option value="weekly">Weekly Summary</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card variant="surface">
              <div className="stack-4">
                <Heading level="h3">Quiet Hours (Do Not Disturb)</Heading>
                <Text variant="small">Mute notification pings and incoming audio/video call rings during your sleep hours.</Text>

                <label className="row-2" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={quietHours.enabled ?? false}
                    onChange={(e) =>
                      savePreferences.mutate({
                        quietHours: { ...quietHours, enabled: e.target.checked },
                      })
                    }
                  />
                  <Text variant="strong">Enable Scheduled Quiet Hours</Text>
                </label>

                {quietHours.enabled && (
                  <div className="stack-3" style={{ marginTop: "0.5rem" }}>
                    <div className="row-2">
                      <div className="stack-1 grow">
                        <Label htmlFor="qh-start">From (Start)</Label>
                        <Input
                          id="qh-start"
                          type="time"
                          value={qhStart}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setQhStart(e.target.value)}
                        />
                      </div>
                      <div className="stack-1 grow">
                        <Label htmlFor="qh-end">To (End)</Label>
                        <Input
                          id="qh-end"
                          type="time"
                          value={qhEnd}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setQhEnd(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={savePreferences.isPending}
                      onClick={() =>
                        savePreferences.mutate({
                          quietHours: { enabled: true, start: qhStart, end: qhEnd },
                        })
                      }
                    >
                      Save Schedule
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Tab 3: Entitlements & Boosts */}
        {activeTab === "membership" && (
          <div className="grid-2">
            <Card variant="surface">
              <div className="stack-4">
                <Heading level="h3">Current Membership</Heading>
                <div className="row-3 wrap">
                  <div className="stack-1">
                    <Text variant="caption">Plan Tier</Text>
                    <Heading level="h2">{data?.currentPlan ?? billingData?.planId ?? "Free"}</Heading>
                  </div>
                  <div className="stack-1">
                    <Text variant="caption">Entitlement Status</Text>
                    <Badge variant={data?.subscription?.status === "ACTIVE" ? "rose" : "default"}>
                      {data?.subscription?.status ?? "Active Standard"}
                    </Badge>
                  </div>
                </div>
                {data?.subscription?.endsAt && (
                  <Text variant="small">
                    Subscription period ends: {new Date(data.subscription.endsAt).toLocaleDateString()}
                  </Text>
                )}
                {billingData?.explanation && (
                  <Text variant="caption">{billingData.explanation}</Text>
                )}
              </div>
            </Card>

            <Card variant="surface">
              <div className="stack-4">
                <div className="row-2 between wrap">
                  <Heading level="h3">Profile Visibility Boosts</Heading>
                  <Badge variant="rose">{totalBoosts} Available</Badge>
                </div>
                <Text variant="small">
                  Activating a boost moves your profile to priority candidate exposure in daily discovery feeds for 24 hours.
                </Text>
                <div>
                  <Button
                    size="sm"
                    loading={activateBoost.isPending}
                    onClick={() => activateBoost.mutate()}
                  >
                    🚀 Activate 24hr Boost
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 4: Billing History & Receipts */}
        {activeTab === "receipts" && (
          <Card variant="surface">
            <div className="stack-4">
              <Heading level="h3">Official Payment Receipts</Heading>
              <Text variant="small">Cryptographically verified Razorpay transactions and VAT-compliant payment receipts.</Text>

              {receipts.length === 0 ? (
                <Text variant="small">No billing transactions recorded yet.</Text>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border, #ccc)" }}>
                        <th style={{ padding: "0.5rem" }}>Receipt ID</th>
                        <th style={{ padding: "0.5rem" }}>Date</th>
                        <th style={{ padding: "0.5rem" }}>Amount</th>
                        <th style={{ padding: "0.5rem" }}>Payment Reference</th>
                        <th style={{ padding: "0.5rem" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipts.map((rcpt) => (
                        <tr key={rcpt.id} style={{ borderBottom: "1px solid var(--border, #eee)" }}>
                          <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{rcpt.id}</td>
                          <td style={{ padding: "0.5rem" }}>{new Date(rcpt.paidAt).toLocaleDateString()}</td>
                          <td style={{ padding: "0.5rem" }}>
                            {rcpt.amountMinor != null
                              ? new Intl.NumberFormat("en-IN", { style: "currency", currency: rcpt.currency || "INR" }).format(
                                  rcpt.amountMinor / 100
                                )
                              : rcpt.amount != null
                              ? `₹${rcpt.amount / 100}`
                              : "—"}
                          </td>
                          <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>
                            {rcpt.providerReference || rcpt.razorpayPaymentId || "—"}
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <Badge variant="rose">PAID</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
