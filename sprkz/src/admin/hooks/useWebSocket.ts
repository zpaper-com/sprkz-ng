import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (onMessage: (event: string, data: unknown) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/admin`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Admin WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);
          onMessage(type, data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('Admin WebSocket disconnected - server not available');
        // Don't auto-reconnect to avoid console spam during development
      };

      wsRef.current.onerror = (error) => {
        console.log('Admin WebSocket error (expected during development):', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.log('WebSocket server not available (expected during development)');
      setIsConnected(false);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
  };
};