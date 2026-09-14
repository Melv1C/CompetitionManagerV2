import type { Server as HTTPServer } from "node:http";

import {
  User$,
  type ClientToServerEvents,
  type InterServerEvents,
  type ServerToClientEvents,
  type SocketRoom,
  type SocketData,
  type UserRole,
} from "@repo/utils";
import { Server, Socket } from "socket.io";
import { ENV } from "varlock/env";

import { auth } from "./auth";
import { logger } from "./logger";

const useAuth = async (socket: Socket) => {
  if (socket.data.user) return;

  // Convert IncomingHttpHeaders to Web API Headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(socket.request.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  const sessionData = await auth.api.getSession({
    headers,
  });

  const user = sessionData?.user ? User$.safeParse(sessionData.user) : null;

  if (user && !user.success) {
    logger.error("Invalid user data in session for socket", {
      metadata: { error: user.error.message },
    });
    throw user.error;
  }

  socket.data.user = user?.data || null;
};

const getSocketInfo = (socket: Socket) => ({
  id: socket.id,
  data: socket.data,
  connected: socket.connected,
  rooms: Array.from(socket.rooms),
  origin: socket.handshake.headers.origin,
});

const socketRoomPolicies: Record<string, { role: UserRole }> = {
  // Add room policies here when getRoomName entries are added
};

function canAccessRoom(socket: Socket, room: string): room is SocketRoom {
  if (!isKnownRoom(socket, room)) {
    return false;
  }

  const policy = socketRoomPolicies[room];
  if (!policy || socket.data.user?.role !== policy.role) {
    logger.warn(`Unauthorized socket room access attempt: ${room}`, {
      path: "socket.io/roomAccess",
      userId: socket.data.user?.id,
      metadata: {
        socket: getSocketInfo(socket),
        room,
        requiredRole: policy?.role,
      },
    });
    return false;
  }

  return true;
}

function isKnownRoom(socket: Socket, room: string): room is SocketRoom {
  if (!Object.hasOwn(socketRoomPolicies, room)) {
    logger.warn(`Unknown socket room requested: ${room}`, {
      path: "socket.io/roomAccess",
      userId: socket.data.user?.id,
      metadata: {
        socket: getSocketInfo(socket),
        room,
      },
    });
    return false;
  }

  return true;
}

// Type-safe Socket.IO server
export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Singleton instance - will be initialized in index.ts
let io: TypedServer | null = null;

/**
 * Initialize the Socket.IO server with the HTTP server
 */
export function initializeSocketIO(httpServer: HTTPServer): TypedServer {
  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: [ENV.FRONTEND_URL, ENV.ADMIN_URL],
        credentials: true,
      },
    },
  );

  // Set up connection handlers
  io.on("connection", async (socket) => {
    await useAuth(socket);
    logger.debug(`Socket connected: ${socket.id}`, {
      path: "socket.io/connection",
      userId: socket.data.user?.id,
      metadata: {
        socket: getSocketInfo(socket),
      },
    });

    // Send welcome message
    socket.emit("connected", { message: "Connected to server" });

    // Handle join room requests
    socket.on("joinRoom", (room) => {
      if (!canAccessRoom(socket, room)) return;

      socket.join(room);
      logger.debug(`Socket joined room: ${room}`, {
        path: "socket.io/joinRoom",
        userId: socket.data.user?.id,
        metadata: {
          socket: getSocketInfo(socket),
          room,
        },
      });
    });

    // Handle leave room requests
    socket.on("leaveRoom", (room) => {
      if (!isKnownRoom(socket, room)) return;

      socket.leave(room);
      logger.debug(`Socket left room: ${room}`, {
        path: "socket.io/leaveRoom",
        userId: socket.data.user?.id,
        metadata: {
          socket: getSocketInfo(socket),
          room,
        },
      });
    });

    socket.on("disconnect", (reason) => {
      logger.debug(`Socket disconnected: ${socket.id} (${reason})`, {
        userId: socket.data.user?.id,
        path: "socket.io/disconnect",
        metadata: {
          socket: getSocketInfo(socket),
          reason,
        },
      });
    });
  });

  console.log(`🔌 Socket.IO initialized`);

  return io;
}

/**
 * Emit an event to all clients in a specific room
 */
export function emitToRoom<E extends keyof ServerToClientEvents>(
  room: string,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void {
  if (!io) {
    logger.error("Socket.IO not initialized, skipping emit");
    return;
  }

  io.to(room).emit(event, ...args);
}

/**
 * Emit an event to all connected clients
 */
export function emitToAll<E extends keyof ServerToClientEvents>(
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void {
  if (!io) {
    logger.error("Socket.IO not initialized, skipping emit");
    return;
  }
  io.emit(event, ...args);
}
