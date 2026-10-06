import type { Socket } from "socket.io-client";
import { API_BASE_URL, tokenStore } from "./api/client";

let socket: Socket | null = null;

// Dynamically imported so socket.io never runs during server rendering.
export async function connectSocket(): Promise<Socket | null> {
  const token = tokenStore.getAccess();
  if (!token) return null;
  if (socket) return socket;
  const { io } = await import("socket.io-client");
  socket = io(API_BASE_URL, {
    auth: { token },
    extraHeaders: { "ngrok-skip-browser-warning": "true" },
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
