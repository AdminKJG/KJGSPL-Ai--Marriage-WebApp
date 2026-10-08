import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge, Button, Card, Heading, Text } from "@/components/ui";
import { ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { billingApi, billingQuery, qk } from "@/lib/api/modules";
import { openRazorpayCheckout } from "@/lib/razorpay";

export const Route = createFileRoute("/_member/billing")({
  head: () => ({
    meta: [
      { title: "Plans — AI Marriage" },
      { name: "description", content: "Choose a membership plan, activate boosts and review payment receipts." },
      { property: "og:title", content: "Plans — AI Marriage" },
      { property: "og:description", content: "Choose a membership plan, activate boosts and review payment receipts." },
    ],
  }),
  component: BillingPage,
});

const PLANS = [
  {
    id: "plus",
    name: "Plus",
    priceMonthly: "₹1,999",
    priceAnnual: "₹19,990",
    blurb: "Unlimited candidate profiles, full cultural filters and compatibility matrix breakdown.",
  },
  {
    id: "premium",
    name: "Premium",
    priceMonthly: "₹3,999",
    priceAnnual: "₹39,990",
    blurb: "Everything in Plus, full AI Assistant, unlimited 1:1 LiveKit audio/video calling, and monthly boosts.",
  },
];

const money = (minor: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(minor / 100);

function BillingPage() {
  const qc = useQueryClient();
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery(billingQuery());

  const verifyMutation = useMutation({
    mutationFn: billingApi.verify,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: qk.billing });
      qc.invalidateQueries({ queryKey: qk.account });
      setPaymentNotice(`🎉 Payment verified! Your ${res.planId?.toUpperCase() ?? "membership"} subscription is now active.`);
    },
    onError: (err) => {
      setPaymentNotice(`Signature verification failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    },
  });

  const activateBoost = useMutation({
    mutationFn: billingApi.activateBoost,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: qk.billing });
      setPaymentNotice(`🚀 24hr profile boost activated! Remaining boosts: ${res.remainingBoosts}`);
    },
    onError: (err) => {
      setPaymentNotice(err instanceof Error ? err.message : "Failed to activate boost.");
    },
  });

  const directPurchase = useMutation({
    mutationFn: (planId: string) => billingApi.purchase(planId, cycle),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: qk.billing });
      qc.invalidateQueries({ queryKey: qk.account });
      setPaymentNotice(`🎉 ${res.planId.toUpperCase()} subscription activated successfully.`);
    },
  });

  const checkout = useMutation({
    mutationFn: (planId: string) => billingApi.checkout(planId, cycle),
    onSuccess: async (order) => {
      try {
        await openRazorpayCheckout({
          key: order.keyId,
          amount: order.amountMinor,
          currency: order.currency,
          name: `AI Marriage — ${order.planName}`,
          description: `${cycle.toUpperCase()} Membership Subscription`,
          order_id: order.orderId,
          handler: (response) => {
            verifyMutation.mutate({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              subscriptionId: order.subscriptionId,
            });
          },
        });
      } catch (sdkErr) {
        console.warn("Razorpay SDK could not open modal:", sdkErr);
        setPaymentNotice("Razorpay window could not load. You can activate directly using Sandbox mode below.");
      }
    },
  });

  const handleChoosePlan = (planId: string) => {
    setActivePlanId(planId);
    setPaymentNotice(null);
    checkout.mutate(planId);
  };

  const totalBoosts =
    (data?.purchasedBoosts ?? 0) +
    (data?.allowanceBoosts ?? 0) +
    (data?.promotionalBoosts ?? 0);

  return (
    <>
      <PageHeader
        title="Membership Plans"
        subtitle="Upgrade when you're ready — basic discovery and matching are always free."
        actions={
          <div className="row-2 wrap">
            <Button size="sm" variant={cycle === "monthly" ? "primary" : "outline"} onClick={() => setCycle("monthly")}>
              Monthly Billing
            </Button>
            <Button size="sm" variant={cycle === "annual" ? "primary" : "outline"} onClick={() => setCycle("annual")}>
              Annual (2 Months Free)
            </Button>
          </div>
        }
      />

      {paymentNotice && (
        <Card variant="surface">
          <div className="row-2 align-center">
            <Text variant="strong">{paymentNotice}</Text>
          </div>
        </Card>
      )}

      {isLoading && (
        <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} style={{ padding: "2rem" }}>
              <div className="stack-3">
                <div className="skeleton-shimmer" style={{ width: "80px", height: "1.5rem", borderRadius: "4px" }} />
                <div className="skeleton-shimmer" style={{ width: "120px", height: "2.5rem", borderRadius: "8px" }} />
                <div className="skeleton-shimmer" style={{ width: "100%", height: "1rem", borderRadius: "4px" }} />
                <div className="stack-2" style={{ marginTop: "1rem" }}>
                  <div className="skeleton-shimmer" style={{ width: "100%", height: "1rem", borderRadius: "4px" }} />
                  <div className="skeleton-shimmer" style={{ width: "90%", height: "1rem", borderRadius: "4px" }} />
                </div>
                <div className="skeleton-shimmer" style={{ width: "100%", height: "2.5rem", borderRadius: "8px", marginTop: "1rem" }} />
              </div>
            </Card>
          ))}
        </div>
      )}
      {error && <ErrorState error={error} />}

      {data?.subscription && (
        <Card variant="surface">
          <div className="row-2 between wrap">
            <div className="row-2 align-center">
              <Text variant="strong">Active Plan: {data.planId?.toUpperCase() ?? "STANDARD"}</Text>
              <Badge variant="rose">{data.subscription.status}</Badge>
            </div>
            {data.subscription.currentPeriodEnd && (
              <Text variant="small">
                Renews on {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
              </Text>
            )}
          </div>
        </Card>
      )}

      <div className="grid-2">
        {PLANS.map((p) => {
          const isCurrent = data?.planId === p.id;
          const price = cycle === "monthly" ? p.priceMonthly : p.priceAnnual;
          return (
            <Card key={p.id} variant={isCurrent ? "surface" : "default"}>
              <div className="stack-4">
                <div className="row-2 between">
                  <Heading level="h2">{p.name}</Heading>
                  {isCurrent && <Badge variant="rose">Current Plan</Badge>}
                </div>
                <div className="row-1">
                  <Heading level="h3">{price}</Heading>
                  <Text variant="caption">/{cycle === "monthly" ? "month" : "year"}</Text>
                </div>
                <Text>{p.blurb}</Text>

                <div className="stack-2">
                  <Button
                    disabled={isCurrent}
                    loading={checkout.isPending && activePlanId === p.id}
                    onClick={() => handleChoosePlan(p.id)}
                  >
                    {isCurrent ? "Active Plan" : `Upgrade via Razorpay (${price})`}
                  </Button>

                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={directPurchase.isPending && directPurchase.variables === p.id}
                      onClick={() => directPurchase.mutate(p.id)}
                    >
                      Instant Sandbox Activation
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {checkout.error && (
        <p className="ds-field__hint ds-field__hint--error" role="alert">
          {checkout.error.message}
        </p>
      )}

      {/* Boost Section */}
      <Card variant="surface">
        <div className="stack-3">
          <div className="row-2 between wrap">
            <div className="stack-1">
              <Heading level="h3">Discovery Profile Boosts</Heading>
              <Text variant="small">
                Boosts give your profile top priority in member discovery carousels for 24 hours.
              </Text>
            </div>
            <div className="row-2 align-center">
              <Badge variant="rose">{totalBoosts} Boosts Available</Badge>
              <Button
                size="sm"
                loading={activateBoost.isPending}
                onClick={() => activateBoost.mutate()}
              >
                🚀 Use 1 Boost
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Billing Receipts Table */}
      {Array.isArray(data?.history) && data.history.length > 0 && (
        <Card variant="surface">
          <div className="stack-3">
            <Heading level="h3">Transaction History</Heading>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border, #ccc)" }}>
                    <th style={{ padding: "0.5rem" }}>Date</th>
                    <th style={{ padding: "0.5rem" }}>Amount</th>
                    <th style={{ padding: "0.5rem" }}>Payment Reference</th>
                    <th style={{ padding: "0.5rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((h: any) => (
                    <tr key={h.id} style={{ borderBottom: "1px solid var(--border, #eee)" }}>
                      <td style={{ padding: "0.5rem" }}>
                        {h.paidAt || h.createdAt ? new Date(h.paidAt || h.createdAt).toLocaleDateString() : h.id}
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        {money(h.amountMinor ?? h.amount ?? 0, h.currency)}
                      </td>
                      <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>
                        {h.providerReference || h.razorpayPaymentId || "—"}
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <Badge variant="outline">{h.status ?? "paid"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

