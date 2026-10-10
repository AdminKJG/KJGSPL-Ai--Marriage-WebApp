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
  ConnectionCategoryResponse,
  ConnectionCounts,
  Conversation,
  DatePlan,
  DiscoveryResponse,
  EventItem,
  Gallery,
  MapConfig,
  Me,
  MeetupProposal,
  Message,
  PlatformConfig,
  Profile,
  SessionUser,
  StoryAnswer,
  VoiceTranscribeResponse,
} from "./types";

const LOCAL_SAVED_KEY = "am.savedProfileIds";

export const getLocalSavedIds = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addLocalSavedId = (id: string) => {
  if (typeof window === "undefined") return;
  try {
    const current = new Set(getLocalSavedIds());
    current.add(id);
    localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(Array.from(current)));
  } catch {}
};

export const removeLocalSavedId = (id: string) => {
  if (typeof window === "undefined") return;
  try {
    const current = new Set(getLocalSavedIds());
    current.delete(id);
    localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(Array.from(current)));
  } catch {}
};

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

export interface RegisterResponse {
  registered?: boolean;
  message?: string;
  onboarding?: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: SessionUser;
}

export const authApi = {
  login: (body: LoginInput) =>
    api<{ accessToken: string; refreshToken: string; user: SessionUser }>("/v1/auth/login", {
      method: "POST",
      body,
      auth: false,
    }),
  register: (body: RegisterInput) =>
    api<RegisterResponse>("/v1/auth/register", { method: "POST", body, auth: false }),
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

export const discoveryApi = {
  getFeed: (params: {
    page?: number;
    limit?: number;
    country?: string;
    state?: string;
    city?: string;
    minAge?: number | "";
    maxAge?: number | "";
    gender?: string;
    interest?: string;
    religion?: string;
    caste?: string;
    maritalStatus?: string;
    education?: string;
    occupation?: string;
    profession?: string;
    minIncome?: number | "";
    maxIncome?: number | "";
    diet?: string;
    smoking?: string;
    drinking?: string;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit ?? 10));
    if (params.country) q.set("country", params.country);
    if (params.state) q.set("state", params.state);
    if (params.city && params.city !== "All cities") q.set("city", params.city);
    if (params.minAge !== undefined && params.minAge !== "") q.set("minAge", String(params.minAge));
    if (params.maxAge !== undefined && params.maxAge !== "") q.set("maxAge", String(params.maxAge));
    if (params.gender && params.gender !== "all") q.set("gender", params.gender);
    if (params.interest && params.interest !== "All interests") q.set("interest", params.interest);
    if (params.religion) q.set("religion", params.religion);
    if (params.caste) q.set("caste", params.caste);
    if (params.maritalStatus) q.set("maritalStatus", params.maritalStatus);
    if (params.education) q.set("education", params.education);
    if (params.occupation) q.set("occupation", params.occupation);
    if (params.profession) q.set("profession", params.profession);
    if (params.minIncome !== undefined && params.minIncome !== "") q.set("minIncome", String(params.minIncome));
    if (params.maxIncome !== undefined && params.maxIncome !== "") q.set("maxIncome", String(params.maxIncome));
    if (params.diet) q.set("diet", params.diet);
    if (params.smoking) q.set("smoking", params.smoking);
    if (params.drinking) q.set("drinking", params.drinking);

    const queryStr = q.toString();
    return api<DiscoveryResponse>(`/v1/discovery${queryStr ? `?${queryStr}` : ""}`);
  },

  expressInterest: (targetUserId: string, message = "") =>
    api<{ status: "sent" | "matched"; matchId?: string; message: string }>("/v1/interest", {
      method: "POST",
      body: { targetUserId, message },
    }),

  saveProfile: async (targetUserId: string) => {
    try {
      const res = await api<{ saved: boolean; targetUserId: string; message: string }>("/v1/saved", {
        method: "POST",
        body: { targetUserId },
      });
      addLocalSavedId(targetUserId);
      return res;
    } catch {
      // Backend /v1/saved is not live on Render yet (returns 404). Save locally without secondary failing requests.
      addLocalSavedId(targetUserId);
      return {
        saved: true,
        targetUserId,
        message: "Profile added to shortlists.",
      };
    }
  },

  unsaveProfile: async (targetUserId: string) => {
    try {
      const res = await api<{ saved: boolean; targetUserId: string; message: string }>(
        `/v1/saved/${targetUserId}`,
        { method: "DELETE" }
      );
      removeLocalSavedId(targetUserId);
      return res;
    } catch {
      // Backend /v1/saved/:id is not live on Render yet (returns 404). Remove locally without secondary failing requests.
      removeLocalSavedId(targetUserId);
      return {
        saved: false,
        targetUserId,
        message: "Profile removed from shortlists.",
      };
    }
  },

  passProfile: (targetUserId: string) =>
    api<{ passed: boolean; targetUserId: string; message: string }>("/v1/discovery/pass", {
      method: "POST",
      body: { targetUserId },
    }),

  blockProfile: (targetUserId: string, reason = "") =>
    api<{ blocked: boolean; targetUserId: string; message: string }>("/v1/block", {
      method: "POST",
      body: { targetUserId, reason },
    }),

  unblockProfile: (targetUserId: string) =>
    api<{ unblocked: boolean; targetUserId: string; message: string }>(`/v1/profiles/${targetUserId}/unblock`, {
      method: "POST",
      body: {},
    }),

  getCities: async (searchQuery = "") => {
    if (!searchQuery.trim()) return { cities: [] };
    try {
      const res = await api<{ cities: string[] }>(
        `/v1/locations/cities?q=${encodeURIComponent(searchQuery)}`
      );
      if (res?.cities && res.cities.length > 0) return res;
    } catch {
      // Backend endpoint fallback
    }

    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&osm_tag=place:city&limit=8&lang=en`;
      const response = await fetch(url);
      if (!response.ok) return { cities: [] };
      const data = await response.json();
      const cities: string[] = (data.features ?? [])
        .map((f: any) => {
          const props = f.properties ?? {};
          const name = props.name;
          const state = props.state;
          const country = props.country;
          if (!name) return null;
          return [name, state, country].filter(Boolean).join(", ");
        })
        .filter((c: string | null): c is string => Boolean(c));

      return { cities: Array.from(new Set(cities)) };
    } catch {
      return { cities: [] };
    }
  },
};

export const connectionsApi = {
  getAll: async () => {
    try {
      const res = await api<Connections>("/v1/connections");
      const localIds = getLocalSavedIds();
      if (localIds.length > 0) {
        const existingSaved = res?.saved ?? [];
        const existingIds = new Set(existingSaved.map((s: any) => (typeof s === "string" ? s : s.id)));
        const mergedSaved = [...existingSaved];
        localIds.forEach((id) => {
          if (!existingIds.has(id)) {
            mergedSaved.push({ id } as Profile);
          }
        });
        return { ...res, saved: mergedSaved };
      }
      return res;
    } catch (err) {
      const localIds = getLocalSavedIds();
      if (localIds.length > 0) {
        return {
          saved: localIds.map((id) => ({ id } as Profile)),
          sent: [],
          received: [],
          mutual: [],
        } as Connections;
      }
      throw err;
    }
  },
  getCategory: async (category: string, page = 1, limit = 10) => {
    try {
      return await api<ConnectionCategoryResponse>(
        `/v1/connections/${category}?page=${page}&limit=${limit}`
      );
    } catch (err) {
      if (category === "saved") {
        const localIds = getLocalSavedIds();
        return {
          category: "saved",
          items: localIds.map((id) => ({ id } as Profile)),
          page,
          limit,
          total: localIds.length,
          totalPages: 1,
        };
      }
      throw err;
    }
  },
  getCounts: async () => {
    try {
      const counts = await api<ConnectionCounts>("/v1/connections/counts");
      const localIds = getLocalSavedIds();
      return {
        ...counts,
        savedCount: Math.max(counts?.savedCount ?? 0, localIds.length),
      };
    } catch {
      const localIds = getLocalSavedIds();
      return {
        savedCount: localIds.length,
        sentCount: 0,
        receivedCount: 0,
        mutualCount: 0,
      };
    }
  },
  expressInterest: (targetUserId: string, message = "") =>
    discoveryApi.expressInterest(targetUserId, message),
  saveProfile: (targetUserId: string) => discoveryApi.saveProfile(targetUserId),
  unsaveProfile: (targetUserId: string) => discoveryApi.unsaveProfile(targetUserId),
  unmatch: (targetUserId: string) =>
    api<{ unmatched: boolean; targetUserId: string; message: string }>("/v1/unmatch", {
      method: "POST",
      body: { targetUserId },
    }),
  block: (targetUserId: string, reason = "") => discoveryApi.blockProfile(targetUserId, reason),
};

export const profileApi = {
  updateMe: (body: Partial<Me>) => api<Me>("/v1/me", { method: "PATCH", body }),
  deleteMe: () => api("/v1/me", { method: "DELETE" }),
  action: (id: string, action: string, body?: unknown) =>
    api(`/v1/profiles/${id}/${action}`, { method: "POST", body: body ?? {} }),
  interest: (id: string, message = "") =>
    discoveryApi.expressInterest(id, message).catch(() =>
      api<{ status: string; mutual: boolean; chatAvailable: boolean }>(`/v1/profiles/${id}/interest`, {
        method: "POST",
        body: { message },
      })
    ),
  connect: (id: string) => api(`/v1/profiles/${id}/connect`, { method: "POST", body: {} }),
  unmatch: (id: string) => api("/v1/unmatch", { method: "POST", body: { targetUserId: id } }),
  block: (id: string, reason = "") =>
    discoveryApi.blockProfile(id, reason).catch(() =>
      api(`/v1/profiles/${id}/block`, { method: "POST", body: { reason } })
    ),
  unblock: (id: string) => api(`/v1/profiles/${id}/unblock`, { method: "POST", body: {} }),
  report: (id: string, body: { reason: string; details?: string }) =>
    api(`/v1/profiles/${id}/report`, { method: "POST", body }),
};

export const chatApi = {
  send: async (
    conversationId: string,
    payload:
      | string
      | { text: string; type?: string; mediaUrl?: string; fileName?: string; fileSize?: string },
    isBot: boolean = false
  ) => {
    const base = typeof payload === "string" ? { text: payload } : payload;
    const body = {
      content: base.text,
      type: base.type ? base.type.toUpperCase() : "TEXT",
      mediaUrl: base.mediaUrl,
      fileName: base.fileName
    };
    const endpoint = isBot 
      ? `/v1/bot/chat/conversations/${conversationId}/messages`
      : `/v1/chat/conversations/${conversationId}/messages`;
    return await api<any>(endpoint, { method: "POST", body });
  },

  readMessage: (conversationId: string, messageIds: string[], isBot: boolean = false) => {
    const endpoint = isBot 
      ? `/v1/bot/chat/conversations/${conversationId}/read`
      : `/v1/chat/conversations/${conversationId}/read`;
    return api<{ count: number }>(endpoint, {
      method: "POST",
      body: { messageIds },
    });
  },

  editMessage: (conversationId: string, messageId: string, content: string) =>
    api<{ updated: boolean; messageId: string }>(`/v1/chat/conversations/${conversationId}/messages/${messageId}`, {
      method: "PATCH",
      body: { content },
    }),

  deleteMessage: (conversationId: string, messageId: string, mode: "for_everyone" | "for_me" = "for_everyone") =>
    api<{ deleted: boolean }>(`/v1/chat/conversations/${conversationId}/messages/${messageId}`, {
      method: "DELETE",
      body: { mode },
    }),

  getPresignedUrl: (conversationId: string, filename: string, mimeType: string, fileSize: number, isBot: boolean = false) => {
    const endpoint = isBot 
      ? `/v1/bot/chat/${conversationId}/media/presigned-url`
      : `/v1/chat/${conversationId}/media/presigned-url`;
    return api<{ uploadUrl: string; objectKey: string; mediaId?: string }>(endpoint, {
      method: "POST",
      body: { fileName: filename, mimeType, fileSize, type: "IMAGE" },
    });
  },

  confirmMedia: (mediaId: string, conversationId: string) =>
    api<{ confirmed: boolean; mediaUrl: string }>("/v1/chat/media/confirm", {
      method: "POST",
      body: { mediaId, conversationId },
    }),

  uploadAndSendMedia: async (file: File, conversationId: string, text?: string, isBot: boolean = false) => {
    const presigned = await chatApi.getPresignedUrl(conversationId, file.name, file.type, file.size, isBot);
    
    const uploadRes = await fetch(presigned.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    
    if (!uploadRes.ok) throw new Error("Failed to upload media");

    let finalMediaUrl = presigned.objectKey;
    if (presigned.mediaId) {
      const confirmRes = await chatApi.confirmMedia(presigned.mediaId, conversationId);
      finalMediaUrl = confirmRes.mediaUrl;
    }

    return await chatApi.send(conversationId, {
      text: text || file.name,
      type: file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT",
      mediaUrl: finalMediaUrl,
      fileName: file.name,
      fileSize: file.size.toString(),
    }, isBot);
  },
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
  getBoostStatus: () => api<{ balance: number; activeBoost?: any }>("/v1/boosts/status"),
  getBoostSummary: () => api<{ summary: any }>("/v1/boosts/summary"),
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

export const mapApi = {
  getMyMeetups: () =>
    api<{ meetups: MeetupProposal[] }>("/v1/map/my-meetups").then((r) => r.meetups ?? []),
  getConfig: () => api<MapConfig>("/v1/map/config"),
};

export const meetupApi = {
  propose: (body: {
    targetUserId: string;
    proposedDate: string;
    proposedTime: string;
    note?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
  }) =>
    api<{ meetup: MeetupProposal }>("/v1/meetups/propose", {
      method: "POST",
      body,
    }).then((r) => r.meetup ?? (r as unknown as MeetupProposal)),
  accept: (proposalId: string) =>
    api<{ meetup: MeetupProposal }>(`/v1/meetups/${proposalId}/accept`, {
      method: "POST",
      body: {},
    }).then((r) => r.meetup ?? (r as unknown as MeetupProposal)),
  reject: (proposalId: string) =>
    api(`/v1/meetups/${proposalId}/reject`, {
      method: "POST",
      body: {},
    }),
};

// ---- Query options ----
export const qk = {
  me: ["me"] as const,
  profile: (id: string) => ["profile", id] as const,
  compatibility: (id: string) => ["compatibility", id] as const,
  discovery: ["discovery"] as const,
  connections: ["connections"] as const,
  connectionCategory: (category: string, page: number) => ["connections", category, page] as const,
  connectionCounts: ["connections", "counts"] as const,
  conversations: ["conversations"] as const,
  messages: (id: string) => ["messages", id] as const,
  notifications: ["notifications"] as const,
  gallery: ["gallery"] as const,
  story: ["story"] as const,
  events: ["events"] as const,
  billing: ["billing"] as const,
  boostStatus: ["boost", "status"] as const,
  boostSummary: ["boost", "summary"] as const,
  account: ["account"] as const,
  accountCentre: ["account-centre"] as const,
  config: ["config"] as const,
  call: (id: string) => ["call", id] as const,
  latestCall: (conversationId: string) => ["call", "latest", conversationId] as const,
  myMeetups: ["map", "my-meetups"] as const,
  mapConfig: ["map", "config"] as const,
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

export const discoveryQuery = (
  params?: {
    page?: number;
    limit?: number;
    country?: string;
    state?: string;
    city?: string;
    minAge?: number | "";
    maxAge?: number | "";
    gender?: string;
    interest?: string;
    religion?: string;
    caste?: string;
    maritalStatus?: string;
    education?: string;
    occupation?: string;
    profession?: string;
    minIncome?: number | "";
    maxIncome?: number | "";
    diet?: string;
    smoking?: string;
    drinking?: string;
  } | number
) => {
  const filterParams = typeof params === "number" ? { page: params, limit: 10 } : { page: 1, limit: 10, ...params };
  return queryOptions({
    queryKey: [...qk.discovery, filterParams],
    queryFn: () => discoveryApi.getFeed(filterParams),
    staleTime: 0,
    refetchOnMount: "always",
  });
};

export const connectionsQuery = () =>
  queryOptions({
    queryKey: qk.connections,
    queryFn: () => connectionsApi.getAll(),
    staleTime: 0,
    refetchOnMount: "always",
  });

export const connectionCategoryQuery = (category: string, page = 1, limit = 10) =>
  queryOptions({
    queryKey: qk.connectionCategory(category, page),
    queryFn: async (): Promise<ConnectionCategoryResponse> => {
      const conn = await connectionsApi.getAll();
      const items = (conn[category] as Profile[] | undefined) ?? [];
      const total = items.length;
      const paginatedItems = items.slice((page - 1) * limit, page * limit);
      const hasMore = page * limit < total;
      return {
        category,
        items: paginatedItems,
        page,
        nextPage: hasMore ? page + 1 : null,
        hasMore,
        total,
      };
    },
    staleTime: 0,
    refetchOnMount: "always",
    enabled: Boolean(category && category !== "all"),
  });

export const connectionCountsQuery = () =>
  queryOptions({
    queryKey: qk.connectionCounts,
    queryFn: async (): Promise<ConnectionCounts> => {
      const conn = await connectionsApi.getAll();
      return {
        savedCount: conn.saved?.length ?? 0,
        sentCount: conn.sent?.length ?? 0,
        receivedCount: conn.received?.length ?? 0,
        mutualCount: conn.mutual?.length ?? 0,
      };
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

export const conversationsQuery = () =>
  queryOptions({
    queryKey: qk.conversations,
    queryFn: async (): Promise<Conversation[]> => {
      const r = await api<any>("/v1/chat/conversations");
      const items = Array.isArray(r) ? r : (r.data || r.items || r.conversations || []);
      return items.map((c: any) => ({
        id: c.id || c.profileId,
        isBot: c.isBot ?? (c.recipient?.isBot ?? false),
        profileId: c.recipient?.id || c.profileId || c.peer?.id,
        profile: c.recipient || c.profile || c.peer,
        lastMessage: typeof c.lastMessage === 'string' ? c.lastMessage : {
          text: c.lastMessage?.text || c.lastMessage?.content,
          createdAt: c.lastMessage?.createdAt,
        },
        unread: c.unreadCount || c.unread || 0,
      }));
    },
    staleTime: 15_000,
  });

export const messagesQuery = (conversationId: string, profileId: string, isBot: boolean = false) =>
  queryOptions({
    queryKey: qk.messages(conversationId),
    queryFn: async (): Promise<Message[]> => {
      const endpoint = isBot 
        ? `/v1/bot/chat/conversations/${conversationId}/messages`
        : `/v1/chat/conversations/${conversationId}/messages`;
      const r = await api<any>(endpoint);
      const items = r.data?.messages || r.data || r.items || r.messages || [];
      return items.map((m: any) => ({
        id: m.id,
        from: (m.senderId === profileId || m.from === profileId) ? profileId : "me",
        text: m.text || m.content,
        type: m.type ? m.type.toLowerCase() : "text",
        mediaUrl: m.mediaUrl,
        fileName: m.fileName,
        createdAt: m.createdAt,
      }));
    },
    staleTime: 5_000,
    enabled: Boolean(conversationId),
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

export const boostStatusQuery = () =>
  queryOptions({
    queryKey: qk.boostStatus,
    queryFn: () => billingApi.getBoostStatus(),
    staleTime: 30_000,
  });

export const boostSummaryQuery = () =>
  queryOptions({
    queryKey: qk.boostSummary,
    queryFn: () => billingApi.getBoostSummary(),
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

export const myMeetupsQuery = () =>
  queryOptions({
    queryKey: qk.myMeetups,
    queryFn: () => mapApi.getMyMeetups(),
    staleTime: 0,
    refetchOnMount: "always",
  });

export const mapConfigQuery = () =>
  queryOptions({
    queryKey: qk.mapConfig,
    queryFn: () => mapApi.getConfig(),
    staleTime: 300_000,
  });

export interface PresenceItem {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
}

export const presenceApi = {
  getPresence: (userId: string) =>
    api<PresenceItem>(`/v1/presence/${userId}`),
  getAllPresence: () =>
    api<{ items: PresenceItem[] }>("/v1/presence").then((r) => r.items ?? []),
};

export const presenceQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["presence", userId],
    queryFn: () => (userId ? presenceApi.getPresence(userId) : null),
    enabled: !!userId,
    staleTime: 15_000,
  });

export const allPresenceQuery = () =>
  queryOptions({
    queryKey: ["presence", "all"],
    queryFn: presenceApi.getAllPresence,
    staleTime: 15_000,
  });


