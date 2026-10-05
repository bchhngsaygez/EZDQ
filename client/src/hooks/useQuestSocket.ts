import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  BotState,
  UserProfile,
  QuestItemState,
  LogEntry,
  ServerEvent,
  ClientMessage,
} from '../types';

export function useQuestSocket() {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<BotState>('idle');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quests, setQuests] = useState<QuestItemState[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [customStatusActive, setCustomStatusActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setErrorMessage(null);
    };

    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect if unexpectedly closed
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const payload: ServerEvent = JSON.parse(event.data);

        switch (payload.type) {
          case 'state':
            setState(payload.data.state);
            if (payload.data.message) {
              setErrorMessage(payload.data.message);
            }
            break;

          case 'login':
            setProfile(payload.data);
            break;

          case 'status_update':
            setCustomStatusActive(payload.data.active);
            break;

          case 'quests_loaded':
            setQuests(payload.data.quests);
            break;

          case 'quest:start':
            setQuests((prev) => {
              const exists = prev.some((q) => q.id === payload.data.id || q.name === payload.data.name);
              if (exists) {
                return prev.map((q) =>
                  (q.id === payload.data.id || q.name === payload.data.name)
                    ? { ...q, ...payload.data, status: 'running' as const }
                    : q
                );
              }
              return [...prev, payload.data as QuestItemState];
            });
            break;

          case 'quest:progress':
            setQuests((prev) =>
              prev.map((q) =>
                q.id === payload.data.id || q.name === payload.data.name
                  ? {
                      ...q,
                      secondsDone: payload.data.secondsDone,
                      secondsNeeded: payload.data.secondsNeeded,
                      status: 'running' as const,
                    }
                  : q
              )
            );
            break;

          case 'quest:done':
            setQuests((prev) =>
              prev.map((q) =>
                q.id === payload.data.id || q.name === payload.data.name
                  ? {
                      ...q,
                      status: 'done' as const,
                      secondsDone: q.secondsNeeded || q.secondsDone,
                      claimed: true,
                    }
                  : q
              )
            );
            break;

          case 'quest:skip':
            setQuests((prev) =>
              prev.map((q) =>
                q.id === payload.data.id || q.name === payload.data.name
                  ? { ...q, status: 'skip' as const, reason: payload.data.reason }
                  : q
              )
            );
            break;

          case 'quest:error':
            setQuests((prev) =>
              prev.map((q) =>
                q.id === payload.data.id || q.name === payload.data.name
                  ? { ...q, status: 'error' as const, reason: payload.data.message }
                  : q
              )
            );
            break;

          case 'finish':
            setState('idle');
            // Trigger celebration confetti
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#5865F2', '#57F287', '#00F0FF', '#EB459E'],
              });
            } catch {
              /* ignore */
            }
            break;

          case 'log':
            setLogs((prev) => {
              const updated = [...prev, payload.data];
              return updated.length > 800 ? updated.slice(-600) : updated;
            });
            break;

          case 'error':
            setErrorMessage(payload.data.message);
            setState('error');
            break;

          default:
            break;
        }
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const startQuest = useCallback((token: string, setStatus = true, parallel = true, captcha?: import('../types').CaptchaConfig) => {
    setErrorMessage(null);
    sendMessage({
      type: 'START',
      token,
      setStatus,
      parallel,
      captcha,
    });
  }, [sendMessage]);

  const stopQuest = useCallback(() => {
    sendMessage({ type: 'STOP' });
  }, [sendMessage]);

  const claimQuest = useCallback((questId: string) => {
    sendMessage({ type: 'CLAIM', questId });
  }, [sendMessage]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const resetSession = useCallback(() => {
    stopQuest();
    setProfile(null);
    setQuests([]);
    setLogs([]);
    setCustomStatusActive(false);
    setErrorMessage(null);
    setState('idle');
  }, [stopQuest]);

  return {
    connected,
    state,
    profile,
    quests,
    logs,
    customStatusActive,
    errorMessage,
    startQuest,
    stopQuest,
    claimQuest,
    clearLogs,
    resetSession,
  };
}
