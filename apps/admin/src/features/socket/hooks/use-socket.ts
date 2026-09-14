import type { ServerToClientEvents } from "@repo/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  connectSocket,
  disconnectSocket,
  getSocket,
  type TypedSocket,
} from "../../../lib/socket-client";

interface UseSocketOptions {
  /** Whether to auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Whether to auto-disconnect on unmount (default: false) */
  autoDisconnect?: boolean;
}

interface UseSocketReturn {
  /** The socket instance */
  socket: TypedSocket;
  /** Whether the socket is connected */
  isConnected: boolean;
  /** Connect the socket manually */
  connect: () => void;
  /** Disconnect the socket manually */
  disconnect: () => void;
}

/**
 * Hook to manage the Socket.IO connection
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, autoDisconnect = false } = options;

  // Get socket instance once via useMemo (stable reference)
  const socket = useMemo(() => getSocket(), []);

  // Initialize state from socket's current connected state
  const [isConnected, setIsConnected] = useState(() => socket.connected);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Auto-connect if enabled
    if (autoConnect && !socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);

      if (autoDisconnect) {
        disconnectSocket();
      }
    };
  }, [socket, autoConnect, autoDisconnect]);

  const connect = useCallback(() => {
    connectSocket();
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
  }, []);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
  };
}

/**
 * Hook to subscribe to a specific socket event
 */
export function useSocketEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E],
): void {
  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    // TypeScript doesn't perfectly infer the handler type here,
    // but we know it's correct based on our generic constraints
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on(event, handler as any);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off(event, handler as any);
    };
  }, [socket, event, handler]);
}
