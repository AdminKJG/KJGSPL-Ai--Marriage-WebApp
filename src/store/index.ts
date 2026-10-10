import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { Call, CulturalFieldConfig, PlatformConfig, SessionUser } from "@/lib/api/types";

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
}

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, isAuthenticated: false } as AuthState,
  reducers: {
    signedIn(state, action: PayloadAction<SessionUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    signedOut(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

interface UiState {
  socketConnected: boolean;
  isOnline: boolean;
  notificationsDrawerOpen: boolean;
}

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    socketConnected: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    notificationsDrawerOpen: false,
  } as UiState,
  reducers: {
    socketStatus(state, action: PayloadAction<boolean>) {
      state.socketConnected = action.payload;
    },
    networkStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    setNotificationsDrawerOpen(state, action: PayloadAction<boolean>) {
      state.notificationsDrawerOpen = action.payload;
    },
    toggleNotificationsDrawer(state) {
      state.notificationsDrawerOpen = !state.notificationsDrawerOpen;
    },
    openNotificationsDrawer(state) {
      state.notificationsDrawerOpen = true;
    },
    closeNotificationsDrawer(state) {
      state.notificationsDrawerOpen = false;
    },
  },
});

export interface CallingState {
  incomingCall: Call | null;
  activeCall: Call | null;
  token: string | null;
  url: string | null;
  roomName: string | null;
  endedCallIds: string[];
}

const initialCallingState: CallingState = {
  incomingCall: null,
  activeCall: null,
  token: null,
  url: null,
  roomName: null,
  endedCallIds: [],
};

const callingSlice = createSlice({
  name: "calling",
  initialState: initialCallingState,
  reducers: {
    callIncoming(state, action: PayloadAction<Call>) {
      const call = action.payload;
      if (call?.callId && state.endedCallIds.includes(call.callId)) return;
      state.incomingCall = call;
    },
    callAccepted(
      state,
      action: PayloadAction<{ call?: Call; callId?: string; url?: string; roomName?: string; token?: string } | Call | any>
    ) {
      const payload = action.payload;
      if (!payload) return;

      // Socket payloads can send flat Call object OR nested { call: Call, token: "..." }
      const callObj: Call = payload.call ? payload.call : payload;
      const callId = callObj?.callId;

      // Prevent late/delayed socket responses or initiate promise resolutions from re-opening an ended call!
      if (callId && state.endedCallIds.includes(callId)) {
        console.log(`⛔ [Redux] Ignoring callAccepted for already ended callId: ${callId}`);
        state.activeCall = null;
        state.incomingCall = null;
        state.token = null;
        state.url = null;
        state.roomName = null;
        return;
      }

      // Merge active call data so activeCall is NEVER reset to undefined/null
      state.activeCall = {
        ...(state.activeCall ?? {}),
        ...callObj,
        status: "ACCEPTED",
      };

      state.url = payload.url ?? callObj?.url ?? state.url ?? null;
      state.roomName = payload.roomName ?? callObj?.roomName ?? state.roomName ?? null;
      state.token = payload.token ?? callObj?.token ?? state.token ?? null;
      state.incomingCall = null;
    },
    callRejected(state, action: PayloadAction<Call | undefined>) {
      const callId = action.payload?.callId ?? state.activeCall?.callId;
      if (callId && !state.endedCallIds.includes(callId)) {
        state.endedCallIds.push(callId);
      }
      state.incomingCall = null;
      state.activeCall = null;
      state.token = null;
      state.url = null;
      state.roomName = null;
    },
    callEnded(state, action: PayloadAction<Call | undefined>) {
      const callId = action.payload?.callId ?? state.activeCall?.callId;
      if (callId && !state.endedCallIds.includes(callId)) {
        state.endedCallIds.push(callId);
      }
      state.incomingCall = null;
      state.activeCall = null;
      state.token = null;
      state.url = null;
      state.roomName = null;
    },
    callMissed(state, action: PayloadAction<Call | undefined>) {
      const callId = action.payload?.callId ?? state.activeCall?.callId;
      if (callId && !state.endedCallIds.includes(callId)) {
        state.endedCallIds.push(callId);
      }
      state.incomingCall = null;
    },
    clearCall(state) {
      if (state.activeCall?.callId && !state.endedCallIds.includes(state.activeCall.callId)) {
        state.endedCallIds.push(state.activeCall.callId);
      }
      state.incomingCall = null;
      state.activeCall = null;
      state.token = null;
      state.url = null;
      state.roomName = null;
    },
  },
});

export interface ConfigState {
  publishedVersion: number;
  questionnaireVersion: number;
  capabilities: Record<string, boolean | undefined>;
  culturalFields: Record<string, CulturalFieldConfig>;
  loaded: boolean;
}

const initialConfigState: ConfigState = {
  publishedVersion: 1,
  questionnaireVersion: 1,
  capabilities: {},
  culturalFields: {},
  loaded: false,
};

const configSlice = createSlice({
  name: "config",
  initialState: initialConfigState,
  reducers: {
    setConfig(state, action: PayloadAction<PlatformConfig>) {
      state.publishedVersion = action.payload.publishedVersion ?? 1;
      state.questionnaireVersion = action.payload.questionnaireVersion ?? 1;
      state.capabilities = action.payload.capabilities ?? {};
      state.culturalFields = action.payload.culturalFields ?? {};
      state.loaded = true;
    },
  },
});

export const { signedIn, signedOut } = authSlice.actions;
export const {
  socketStatus,
  networkStatus,
  setNotificationsDrawerOpen,
  toggleNotificationsDrawer,
  openNotificationsDrawer,
  closeNotificationsDrawer,
} = uiSlice.actions;
export const { callIncoming, callAccepted, callRejected, callEnded, callMissed, clearCall } =
  callingSlice.actions;
export const { setConfig } = configSlice.actions;

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authSlice.reducer,
      ui: uiSlice.reducer,
      calling: callingSlice.reducer,
      config: configSlice.reducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

