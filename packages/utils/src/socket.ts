import type { User } from "./schemas";

// ============================================
// Socket Event Types
// ============================================

/**
 * Events emitted from the server to clients
 */
export interface ServerToClientEvents {
  connected: (data: { message: string }) => void;
}

/**
 * Events emitted from clients to the server
 */
export interface ClientToServerEvents {
  joinRoom: (room: SocketRoom) => void;
  leaveRoom: (room: SocketRoom) => void;
}

/**
 * Inter-server events (for scaling with multiple servers)
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterServerEvents {}

/**
 * Data stored per socket connection
 */
export interface SocketData {
  user: User | null;
}

/** Named rooms available for socket subscriptions. Add entries as features need them. */
export const getRoomName = {
  // e.g. logs: "admin_logs",
} as const;

export type SocketRoom = string;
