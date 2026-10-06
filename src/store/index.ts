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
}

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    socketConnected: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  } as UiState,
  reducers: {
    socketStatus(state, action: PayloadAction<boolean>) {
      state.socketConnected = action.payload;
    },
    networkStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
  },
});

export interface CallingState {
  incomingCall: Call | null;
  activeCall: Call | null;
  token: string | null;
  url: string | null;
  roomName: string | null;
}

const initialCallingState: CallingState = {
  incomingCall: null,
  activeCall: null,
  token: null,
  url: null,
  roomName: null,
};

const callingSlice = createSlice({
  name: "calling",
  initialState: initialCallingState,
  reducers: {
    callIncoming(state, action: PayloadAction<Call>) {
      state.incomingCall = action.payload;
    },
    callAccepted(
      state,
      action: PayloadAction<{ call: Call; url?: string; roomName?: string; token?: string }>
    ) {
      state.activeCall = action.payload.call;
      state.url = action.payload.url ?? action.payload.call.url ?? null;
      state.roomName = action.payload.roomName ?? action.payload.call.roomName ?? null;
      state.token = action.payload.token ?? action.payload.call.token ?? null;
      state.incomingCall = null;
    },
    callRejected(state, _action: PayloadAction<Call | undefined>) {
      state.incomingCall = null;
      state.activeCall = null;
      state.token = null;
      state.url = null;
      state.roomName = null;
    },
    callEnded(state, _action: PayloadAction<Call | undefined>) {
      state.incomingCall = null;
      state.activeCall = null;
      state.token = null;
      state.url = null;
      state.roomName = null;
    },
    callMissed(state, _action: PayloadAction<Call | undefined>) {
      state.incomingCall = null;
    },
    clearCall(state) {
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
export const { socketStatus, networkStatus } = uiSlice.actions;
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

