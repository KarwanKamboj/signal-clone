import { useEffect, useRef, useCallback } from 'react';
import { WSEvent } from './types';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export function useSignalWebSocket(
  token: string | null,
  onEvent: (event: WSEvent) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!token) return;

    // Prevent multiple connections
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = `${WS_BASE_URL}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to Signal WebSocket server');
      // Send ping every 25s to keep connection alive
    };

    ws.onmessage = (event) => {
      try {
        const payload: WSEvent = JSON.parse(event.data);
        onEvent(payload);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('Signal WebSocket disconnected code:', event.code);
      wsRef.current = null;
      // Auto-reconnect after 3 seconds if not intentionally closed
      if (token) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    wsRef.current = ws;
  }, [token, onEvent]);

  useEffect(() => {
    connect();

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', data: {} }));
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          data: { conversation_id: conversationId, is_typing: isTyping },
        })
      );
    }
  }, []);

  const sendReadReceipt = useCallback((conversationId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'read_receipt',
          data: { conversation_id: conversationId },
        })
      );
    }
  }, []);

  return { sendTyping, sendReadReceipt };
}
