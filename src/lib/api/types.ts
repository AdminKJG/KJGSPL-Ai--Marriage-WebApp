export interface Prompt {
  question: string;
  answer: string;
}

export interface Profile {
  id: string;
  name: string;
  age?: number;
  city?: string;
  gender?: string;
  occupation?: string;
  education?: string;
  bio?: string;
  interests?: string[];
  values?: string[];
  lifestyle?: string[];
  futurePlans?: string;
  prompts?: Prompt[];
  languages?: string[];
  intention?: string;
  visibility?: string;
  photoUrl?: string | null;
  mainPhotoUrl?: string | null;
  cultural?: Record<string, string | null>;
  [key: string]: unknown;
}

export interface Me extends Profile {
  email?: string;
  dateOfBirth?: string;
  preferences?: { minAge?: number; maxAge?: number; gender?: string; city?: string };
  blocked?: Profile[];
  blockedUsers?: Profile[];
}

export interface SessionUser {
  id: string;
  name?: string;
  role: string;
}

export interface DiscoveryResponse {
  items: Profile[];
  exposedToday?: number;
  dailyLimit?: number;
  reason?: string;
  page: number;
  hasMore: boolean;
  nextPage: number | null;
}

export interface Connections {
  saved?: Profile[];
  sent?: Profile[];
  received?: Profile[];
  mutual?: Profile[];
  [key: string]: unknown;
}

export interface Conversation {
  id: string;
  profileId: string;
  profile: Profile;
  lastMessage?: { text: string; createdAt: string } | string | null;
  unread?: number;
}

export interface Message {
  id: string;
  text: string;
  from: string;
  createdAt: string;
  type?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  actionUrl?: string | null;
  read: boolean;
  createdAt?: string;
}

export interface Photo {
  id: string;
  slot: number;
  isMain: boolean;
  isApproved: boolean;
  url: string;
  moderationStatus: string;
}

export interface Gallery {
  totalCount: number;
  maxSlots: number;
  mainPhotoId: string | null;
  photos: Photo[];
}

export interface EventItem {
  id: string;
  title: string;
  city?: string;
  venue?: string;
  description?: string;
  category?: string;
  startsAt?: string;
  saved?: boolean;
  bookingConfirmed?: boolean;
}

export interface StoryAnswer {
  id?: string;
  questionId: string;
  choiceId?: string;
  transcript?: string;
  reviewed?: boolean;
  useForMatching?: boolean;
  shareTranscript?: boolean;
  questionnaireVersion?: number;
  source?: "typed" | "recorded" | "demo" | string;
}

export type CallKind = "AUDIO" | "VIDEO";
export type CallStatus =
  | "RINGING"
  | "ACCEPTED"
  | "REJECTED"
  | "MISSED"
  | "CANCELED"
  | "ENDED"
  | "FAILED";

export interface Call {
  callId: string;
  conversationId?: string;
  callerId: string;
  calleeId: string;
  kind: CallKind;
  status: CallStatus;
  startedAt?: string | null;
  answeredAt?: string | null;
  endedAt?: string | null;
  durationSec?: number | null;
  url?: string;
  roomName?: string;
  token?: string;
  from?: string;
}

export interface Subscription {
  status: string;
  planId?: string;
  currentPeriodEnd?: string;
  endsAt?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface Receipt {
  id: string;
  subscriptionId?: string;
  razorpayPaymentId?: string;
  amount?: number;
  amountMinor?: number;
  currency: string;
  paidAt: string;
  providerReference?: string;
  kind?: string;
}

export interface BillingState {
  mode?: string;
  planId?: string;
  subscription?: Subscription;
  history?: Receipt[];
  purchasedBoosts?: number;
  allowanceBoosts?: number;
  promotionalBoosts?: number;
  paymentsEnabled?: boolean;
  explanation?: string;
}

export interface PolicyItem {
  id: string;
  title: string;
  version: number;
  status: string;
}

export interface PolicyConsent {
  id: string;
  version: number;
  accepted: boolean;
  at?: string;
}

export interface NotificationPreferences {
  frequency?: string;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  channels?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
}

export interface AccountCentre {
  revision?: number;
  configuration?: {
    policies: PolicyItem[];
  };
  preferences?: NotificationPreferences;
  consents?: PolicyConsent[];
  currentPlan?: string;
  subscription?: Subscription;
  receipts?: Receipt[];
  delivery?: Record<string, { deliver: boolean; reason: string }>;
  sensitiveMatchingEnabled?: boolean;
  checkoutAvailable?: boolean;
}

export interface DatePlan {
  profileId: string;
  activity: string;
  venue: string;
  day: string;
  time: string;
  status: "draft" | "pending" | "accepted" | "declined" | "cancelled" | string;
  revision?: number;
  proposerId?: string;
  receiverId?: string;
  canRespond?: boolean;
  updatedAt?: string;
  bookingConfirmed?: boolean;
  simulatedResponse?: boolean;
}

export interface CompatibilityCategory {
  id: string;
  label: string;
  weight: number;
  score: number;
}

export interface CompatibilityResult {
  eligibility: "PASS" | "FAIL" | "UNRESOLVED" | string;
  score: number;
  coverage: number;
  categories: CompatibilityCategory[];
  reasons: string[];
  differences: string[];
  lowerBound?: number;
  upperBound?: number;
  configVersion?: number;
  modelCalled?: boolean;
  computationMode?: string;
  missingRequirements?: string[];
  profileId?: string;
  illustrative?: boolean;
  demo?: boolean;
  label?: string;
  compatibility?: number;
  overall?: number;
  explanation?: string;
  [key: string]: unknown;
}

export interface StoryQuestionChoice {
  id: string;
  label: string;
}

export interface StoryQuestion {
  id: string;
  roundIndex?: number;
  title: string;
  prompt?: string;
  choices: StoryQuestionChoice[];
}

export interface CulturalFieldConfig {
  label: string;
  options: string[];
}

export interface MasterItem {
  id: string;
  kind?: string;
  label?: string;
  weight?: number;
  status: string;
}

export interface PlatformConfig {
  publishedVersion?: number;
  questionnaireVersion?: number;
  mode?: string;
  demo?: boolean;
  currency?: string;
  paymentsEnabled?: boolean;
  matchingMode?: string;
  matchingPolicy?: string;
  illustrative?: boolean;
  capabilities?: {
    emailVerified?: boolean;
    photoUpload?: boolean;
    eventBookings?: boolean;
    voiceUpload?: boolean;
    localLlm?: boolean;
    [key: string]: boolean | undefined;
  };
  storyQuestions?: StoryQuestion[];
  culturalFields?: Record<string, CulturalFieldConfig>;
  masters?: {
    geography?: MasterItem[];
    scoring?: MasterItem[];
    [key: string]: MasterItem[] | undefined;
  };
  disclosure?: string;
}

export interface VoiceTranscribeResponse {
  text: string;
  language: string;
  duration?: number;
  modelRevision?: string;
}

