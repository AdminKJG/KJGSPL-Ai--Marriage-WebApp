// Member-facing API modules (admin/super admin endpoints intentionally excluded).
import { queryOptions } from "@tanstack/react-query";
import { api } from "./client";
import type {
  AccountCentre,
  AppNotification,
  BillingState,
  Call,
  CompatibilityResult,
  Connections,
  Conversation,
  DatePlan,
  DiscoveryResponse,
  EventItem,
  Gallery,
  Me,
  Message,
  PlatformConfig,
  Profile,
  SessionUser,
  StoryAnswer,
  VoiceTranscribeResponse,
} from "./types";

export interface LoginInput {
  email: string;
  password: string;
  mfaCode?: string;
}
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string;
  adultConfirmed: true;
}

export const authApi = {
  login: (body: LoginInput) =>
    api<{ accessToken: string; refreshToken: string; user: SessionUser }>("/v1/auth/login", {
      method: "POST",
      body,
      auth: false,
    }),
  register: (body: RegisterInput) =>
    api<{ registered: boolean; message: string }>("/v1/auth/register", { method: "POST", body, auth: false }),
  session: () => api<{ user: SessionUser }>("/v1/auth/session"),
  logout: (refreshToken: string | null) =>
    api("/v1/auth/logout", { method: "POST", body: refreshToken ? { refreshToken } : {} }),
  // Password recovery lives on the legacy API contract until /v1 ships it.
  // UI is complete; calls fall back gracefully if the backend flag is off.
  forgotPassword: (email: string) =>
    api<{ sent?: boolean; message?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: { email },
      auth: false,
    }),
  resetPassword: (body: { token: string; password: string }) =>
    api<{ reset?: boolean; message?: string }>("/api/auth/reset-password", {
      method: "POST",
      body,
      auth: false,
    }),
};

export const profileApi = {
  updateMe: (body: Partial<Me>) => api<Me>("/v1/me", { method: "PATCH", body }),
  deleteMe: () => api("/v1/me", { method: "DELETE" }),
  action: (id: string, action: string, body?: unknown) =>
    api(`/v1/profiles/${id}/${action}`, { method: "POST", body: body ?? {} }),
  interest: (id: string) =>
    api<{ status: string; mutual: boolean; chatAvailable: boolean }>(`/v1/profiles/${id}/interest`, {
      method: "POST",
      body: {},
    }),
  connect: (id: string) => api(`/v1/profiles/${id}/connect`, { method: "POST", body: {} }),
  unmatch: (id: string) => api("/v1/unmatch", { method: "POST", body: { targetUserId: id } }),
  block: (id: string) => api(`/v1/profiles/${id}/block`, { method: "POST", body: {} }),
  unblock: (id: string) => api(`/v1/profiles/${id}/unblock`, { method: "POST", body: {} }),
  report: (id: string, body: { reason: string; details?: string }) =>
    api(`/v1/profiles/${id}/report`, { method: "POST", body }),
};

export const chatApi = {
  send: (profileId: string, text: string) =>
    api<Message>(`/v1/messages/${profileId}`, { method: "POST", body: { text } }),
};

export const mediaApi = {
  upload: (base64: string) => api("/v1/media/photos", { method: "POST", body: { base64 } }),
  remove: (id: string) => api(`/v1/media/photos/${id}`, { method: "DELETE" }),
  setMain: (id: string) => api(`/v1/media/photos/${id}/main`, { method: "PATCH", body: {} }),
  reorder: (photoIds: string[]) => api("/v1/media/photos/reorder", { method: "PUT", body: { photoIds } }),
};

export const storyApi = {
  saveAnswer: (id: string, body: StoryAnswer) => api(`/v1/story/answers/${id}`, { method: "PUT", body }),
  deleteAnswer: (id: string) => api(`/v1/story/answers/${id}`, { method: "DELETE" }),
  completeRound: (round: number) => api(`/v1/story/rounds/${round}/complete`, { method: "POST", body: {} }),
  proposeDatePlan: (
    profileId: string,
    plan: {
      activity: string;
      venue: string;
      day: string;
      time: string;
      status: string;
      revision?: number;
    }
  ) =>
    api<{ plan: DatePlan }>(`/v1/story/plans/${profileId}`, {
      method: "PUT",
      body: { ...plan, profileId },
    }),
  cancelDatePlan: (profileId: string) =>
    api<{ cancelled: boolean }>(`/v1/story/plans/${profileId}`, { method: "DELETE" }),
};

export const notificationApi = {
  markRead: (id: string) => api(`/v1/notifications/${id}/read`, { method: "PATCH", body: {} }),
  markAllRead: () => api("/v1/notifications/read-all", { method: "PATCH", body: {} }),
  remove: (id: string) => api(`/v1/notifications/${id}`, { method: "DELETE" }),
};

export const eventsApi = {
  save: (id: string, saved: boolean) => api(`/v1/events/${id}/save`, { method: "POST", body: { saved } }),
};

export const billingApi = {
  quote: (planId: string, billingCycle: string) =>
    api<{
      quoteId?: string;
      productId?: string;
      amount: number;
      currency: string;
      renewalAmount?: number;
      listedAmount?: number;
    }>("/v1/billing/quote", { method: "POST", body: { planId, productId: planId, billingCycle, period: billingCycle } }),
  checkout: (planId: string, billingCycle: string = "monthly") =>
    api<{
      success?: boolean;
      keyId?: string;
      orderId: string;
      gatewaySubscriptionId?: string;
      subscriptionId?: string;
      amountMinor: number;
      currency: string;
      planName: string;
    }>("/v1/billing/checkout", {
      method: "POST",
      body: { planId, billingCycle },
    }),
  verify: (body: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    subscriptionId?: string;
  }) =>
    api<{ success: boolean; verified: boolean; planId?: string }>("/v1/billing/verify", {
      method: "POST",
      body,
    }),
  purchase: (productId: string, period = "monthly") =>
    api<{ success: boolean; purchased: boolean; planId: string; subscriptionId?: string }>(
      "/v1/billing/purchase",
      { method: "POST", body: { productId, period } }
    ),
  activateBoost: () =>
    api<{ success: boolean; action: string; activated: boolean; remainingBoosts: number }>(
      "/v1/boosts/activate",
      { method: "POST", body: {} }
    ),
};

export const accountApi = {
  preferences: (body: Record<string, unknown>) =>
    api<{ saved: boolean; preferences: any }>("/v1/account-centre/preferences", { method: "PATCH", body }),
  recordConsent: (id: string, version: number, accepted: boolean) =>
    api<{ saved: boolean }>("/v1/account-centre/consent", {
      method: "POST",
      body: { id, version, accepted },
    }),
};

export const callsApi = {
  initiate: (targetUserId: string, kind: "AUDIO" | "VIDEO" = "AUDIO") =>
    api<{ call: Call }>("/v1/calls", { method: "POST", body: { targetUserId, kind } }),
  accept: (callId: string) => api<{ call: Call }>(`/v1/calls/${callId}/accept`, { method: "POST", body: {} }),
  decline: (callId: string) => api<{ call: Call }>(`/v1/calls/${callId}/decline`, { method: "POST", body: {} }),
  end: (callId: string) => api<{ call: Call }>(`/v1/calls/${callId}/end`, { method: "POST", body: {} }),
  get: (callId: string) => api<{ call: Call }>(`/v1/calls/${callId}`),
  latestForConversation: (conversationId: string) =>
    api<{ call: Call }>(`/v1/calls/conversation/${conversationId}/latest`),
};

export const voiceApi = {
  transcribe: (audioBase64: string, language?: string) =>
    api<VoiceTranscribeResponse>("/v1/voice/transcribe", {
      method: "POST",
      body: { audio: audioBase64, language, product: "ai-marriage" },
    }),
};

export const aiApi = {
  assist: (body: {
    kind: "bio" | "icebreaker" | "date" | "clarify";
    text?: string;
    questionId?: string;
    allowLocalModel?: boolean;
    complexInput?: boolean;
  }) =>
    api<{ choices?: { text: string; tone?: string }[]; suggestions?: string[]; modelCalled?: boolean }>(
      "/v1/assist",
      { method: "POST", body }
    ),
};

// ---- Query options ----
export const qk = {
  me: ["me"] as const,
  profile: (id: string) => ["profile", id] as const,
  compatibility: (id: string) => ["compatibility", id] as const,
  discovery: ["discovery"] as const,
  connections: ["connections"] as const,
  conversations: ["conversations"] as const,
  messages: (id: string) => ["messages", id] as const,
  notifications: ["notifications"] as const,
  gallery: ["gallery"] as const,
  story: ["story"] as const,
  events: ["events"] as const,
  billing: ["billing"] as const,
  account: ["account"] as const,
  accountCentre: ["account-centre"] as const,
  config: ["config"] as const,
  call: (id: string) => ["call", id] as const,
  latestCall: (conversationId: string) => ["call", "latest", conversationId] as const,
};

export const meQuery = () =>
  queryOptions({ queryKey: qk.me, queryFn: () => api<Me>("/v1/me"), staleTime: 60_000 });

export const profileQuery = (id: string) =>
  queryOptions({
    queryKey: qk.profile(id),
    queryFn: () => api<Profile>(`/v1/profiles/${id}`),
    staleTime: 60_000,
  });

export const compatibilityQuery = (id: string) =>
  queryOptions({
    queryKey: qk.compatibility(id),
    queryFn: () => api<CompatibilityResult>(`/v1/profiles/${id}/compatibility`),
    staleTime: 120_000,
    retry: false,
  });

export const discoveryQuery = (page = 1) =>
  queryOptions({
    queryKey: [...qk.discovery, page],
    queryFn: () => api<DiscoveryResponse>(`/v1/discovery?page=${page}&limit=20`),
    staleTime: 30_000,
  });

export const connectionsQuery = () =>
  queryOptions({
    queryKey: qk.connections,
    queryFn: () => api<Connections>("/v1/connections"),
    staleTime: 30_000,
  });

export const conversationsQuery = () =>
  queryOptions({
    queryKey: qk.conversations,
    queryFn: () => api<{ items: Conversation[] }>("/v1/messages").then((r) => r.items ?? []),
    staleTime: 15_000,
  });

export const messagesQuery = (profileId: string) =>
  queryOptions({
    queryKey: qk.messages(profileId),
    queryFn: () => api<{ items: Message[] }>(`/v1/messages/${profileId}`).then((r) => r.items ?? []),
    staleTime: 5_000,
  });

export const notificationsQuery = () =>
  queryOptions({
    queryKey: qk.notifications,
    queryFn: () =>
      api<{ notifications: AppNotification[]; unreadCount?: number }>("/v1/notifications").then((r) => ({
        items: r.notifications ?? [],
        unread: r.unreadCount ?? (r.notifications ?? []).filter((n) => !n.read).length,
      })),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

export const galleryQuery = () =>
  queryOptions({
    queryKey: qk.gallery,
    queryFn: () => api<Gallery>("/v1/media/gallery"),
    staleTime: 120_000,
  });

export const storyQuery = () =>
  queryOptions({
    queryKey: qk.story,
    queryFn: () =>
      api<{
        answers?: StoryAnswer[];
        completedRounds?: number[];
        datePlans?: DatePlan[];
        questions?: any[];
        questionnaireVersion?: number;
        disclosure?: string;
      }>("/v1/story"),
    staleTime: 60_000,
  });

export const eventsQuery = () =>
  queryOptions({
    queryKey: qk.events,
    queryFn: () => api<{ items: EventItem[] }>("/v1/events").then((r) => r.items ?? []),
    staleTime: 60_000,
  });

export const billingQuery = () =>
  queryOptions({
    queryKey: qk.billing,
    queryFn: () => api<BillingState>("/v1/billing"),
    staleTime: 60_000,
  });

export const accountQuery = () =>
  queryOptions({
    queryKey: qk.account,
    queryFn: () => api<AccountCentre>("/v1/account-centre"),
    staleTime: 60_000,
  });

export const accountCentreQuery = () =>
  queryOptions({
    queryKey: qk.accountCentre,
    queryFn: () => api<AccountCentre>("/v1/account-centre"),
    staleTime: 60_000,
  });

export const configQuery = () =>
  queryOptions({
    queryKey: qk.config,
    queryFn: () => api<PlatformConfig>("/v1/config"),
    staleTime: 300_000,
  });

export const callQuery = (callId: string) =>
  queryOptions({
    queryKey: qk.call(callId),
    queryFn: () => callsApi.get(callId).then((r) => r.call),
    enabled: !!callId,
    staleTime: 10_000,
  });

