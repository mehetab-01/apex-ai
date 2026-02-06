"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { getChatConversations, getChatMessages, ChatConversation } from "@/lib/api";

// Storage keys
const CHAT_STATE_KEY = "apex_chat_state";
const SESSION_KEY = "apex_chat_session_info";
const TRANSCRIPTS_KEY = "apex_chat_transcripts";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

// Saved transcript structure for local history
export interface SavedTranscript {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface StoredChatState {
  messages: ChatMessage[];
  conversationId: string | null;
  visitorId: string | null;
}

interface SessionInfo {
  visitorId: string;
  userId: string;
  loginTime: number;
}

interface ChatContextType {
  messages: ChatMessage[];
  conversationId: string | null;
  conversations: ChatConversation[];
  savedTranscripts: SavedTranscript[];
  isLoadingHistory: boolean;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setConversationId: (id: string | null) => void;
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  startNewChat: () => void;
  saveAndStartNewChat: () => void;
  loadTranscript: (transcriptId: string) => void;
  deleteTranscript: (transcriptId: string) => void;
  clearChatOnLogout: () => void;
  removeConversation: (conversationId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Generate unique visitor ID
const generateVisitorId = () => `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessagesState] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationIdState] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [savedTranscripts, setSavedTranscripts] = useState<SavedTranscript[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const currentUserIdRef = useRef<string | null>(null);
  const currentVisitorIdRef = useRef<string | null>(null);

  // Generate unique transcript ID
  const generateTranscriptId = () => `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Generate title from first user message
  const generateTitle = (msgs: ChatMessage[]): string => {
    const firstUserMsg = msgs.find(m => m.role === "user");
    if (firstUserMsg) {
      const title = firstUserMsg.content.slice(0, 50);
      return title.length < firstUserMsg.content.length ? `${title}...` : title;
    }
    return "New Conversation";
  };

  // Load transcripts from localStorage
  const loadTranscripts = useCallback((): SavedTranscript[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(TRANSCRIPTS_KEY);
      if (stored) {
        const transcripts: SavedTranscript[] = JSON.parse(stored);
        return transcripts.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          messages: t.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
      }
    } catch {
      // Invalid data
    }
    return [];
  }, []);

  // Save transcripts to localStorage
  const saveTranscripts = useCallback((transcripts: SavedTranscript[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TRANSCRIPTS_KEY, JSON.stringify(transcripts));
  }, []);

  // Get user ID from localStorage
  const getUserId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const userStr = localStorage.getItem("apex_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || null;
      }
    } catch {
      // Invalid data
    }
    return null;
  }, []);

  // Get or create session info for this browser session
  const getSessionInfo = useCallback((userId: string): SessionInfo | null => {
    if (typeof window === "undefined") return null;

    try {
      // Check sessionStorage first (same tab session)
      const sessionStr = sessionStorage.getItem(SESSION_KEY);
      if (sessionStr) {
        const session: SessionInfo = JSON.parse(sessionStr);
        // Same user in same tab - return existing session
        if (session.userId === userId) {
          return session;
        }
      }
    } catch {
      // Invalid session
    }
    return null;
  }, []);

  // Create new session
  const createSession = useCallback((userId: string): SessionInfo => {
    const session: SessionInfo = {
      visitorId: generateVisitorId(),
      userId,
      loginTime: Date.now()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }, []);

  // Save chat state
  const saveChatState = useCallback((msgs: ChatMessage[], convId: string | null, visitorId: string) => {
    if (typeof window === "undefined" || !visitorId) return;

    const state: StoredChatState = {
      messages: msgs.map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
      })),
      conversationId: convId,
      visitorId
    };
    localStorage.setItem(CHAT_STATE_KEY, JSON.stringify(state));
  }, []);

  // Load chat state for visitor
  const loadChatState = useCallback((visitorId: string): StoredChatState | null => {
    if (typeof window === "undefined") return null;

    try {
      const stateStr = localStorage.getItem(CHAT_STATE_KEY);
      if (stateStr) {
        const state: StoredChatState = JSON.parse(stateStr);
        // Only restore if same visitor session
        if (state.visitorId === visitorId) {
          return {
            ...state,
            messages: state.messages.map(m => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          };
        }
      }
    } catch {
      // Invalid state
    }
    return null;
  }, []);

  // Initialize on mount
  useEffect(() => {
    const userId = getUserId();
    currentUserIdRef.current = userId;

    // Load saved transcripts
    const transcripts = loadTranscripts();
    setSavedTranscripts(transcripts);

    if (userId) {
      // Check for existing session (same tab, page navigation)
      let session = getSessionInfo(userId);

      if (session) {
        // Existing session - try to restore chat
        currentVisitorIdRef.current = session.visitorId;
        const savedState = loadChatState(session.visitorId);
        if (savedState && savedState.messages.length > 0) {
          setMessagesState(savedState.messages);
          setConversationIdState(savedState.conversationId);
        }
      } else {
        // New login/session - create fresh session with empty chat
        session = createSession(userId);
        currentVisitorIdRef.current = session.visitorId;
        // Clear any old chat state
        localStorage.removeItem(CHAT_STATE_KEY);
      }
    }

    setIsReady(true);
  }, [getUserId, getSessionInfo, createSession, loadChatState, loadTranscripts]);

  // Watch for user logout
  useEffect(() => {
    if (!isReady) return;

    const checkUser = () => {
      const userId = getUserId();
      const prevUserId = currentUserIdRef.current;

      if (userId !== prevUserId) {
        if (!userId) {
          // User logged out - clear everything
          setMessagesState([]);
          setConversationIdState(null);
          setConversations([]);
          currentVisitorIdRef.current = null;
          localStorage.removeItem(CHAT_STATE_KEY);
          sessionStorage.removeItem(SESSION_KEY);
        } else if (userId && !prevUserId) {
          // User just logged in - create new session
          const session = createSession(userId);
          currentVisitorIdRef.current = session.visitorId;
          setMessagesState([]);
          setConversationIdState(null);
          setConversations([]);
        }
        currentUserIdRef.current = userId;
      }
    };

    const interval = setInterval(checkUser, 500);
    return () => clearInterval(interval);
  }, [isReady, getUserId, createSession]);

  // Save state when messages change
  useEffect(() => {
    if (isReady && currentVisitorIdRef.current && messages.length > 0) {
      saveChatState(messages, conversationId, currentVisitorIdRef.current);
    }
  }, [messages, conversationId, isReady, saveChatState]);

  const setMessages = useCallback((msgs: ChatMessage[]) => {
    setMessagesState(msgs.map(m => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
    })));
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessagesState(prev => [...prev, {
      ...message,
      timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
    }]);
  }, []);

  const setConversationId = useCallback((id: string | null) => {
    setConversationIdState(id);
  }, []);

  const loadConversations = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const convos = await getChatConversations();
      setConversations(convos);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, [getUserId]);

  const loadConversation = useCallback(async (convoId: string) => {
    setIsLoadingHistory(true);
    try {
      const { messages: loadedMessages } = await getChatMessages(convoId);
      const formattedMessages: ChatMessage[] = loadedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));
      setMessagesState(formattedMessages);
      setConversationIdState(convoId);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Save current chat as transcript and start new chat
  const saveAndStartNewChat = useCallback(() => {
    if (messages.length > 0) {
      const now = new Date();
      const newTranscript: SavedTranscript = {
        id: generateTranscriptId(),
        title: generateTitle(messages),
        messages: messages,
        createdAt: now,
        updatedAt: now
      };

      const updatedTranscripts = [newTranscript, ...savedTranscripts];
      setSavedTranscripts(updatedTranscripts);
      saveTranscripts(updatedTranscripts);
    }

    setMessagesState([]);
    setConversationIdState(null);
    localStorage.removeItem(CHAT_STATE_KEY);
  }, [messages, savedTranscripts, saveTranscripts]);

  const startNewChat = useCallback(() => {
    // Auto-save current chat as transcript if there are messages
    if (messages.length > 0) {
      const now = new Date();
      const newTranscript: SavedTranscript = {
        id: generateTranscriptId(),
        title: generateTitle(messages),
        messages: messages,
        createdAt: now,
        updatedAt: now
      };

      const updatedTranscripts = [newTranscript, ...savedTranscripts];
      setSavedTranscripts(updatedTranscripts);
      saveTranscripts(updatedTranscripts);
    }

    setMessagesState([]);
    setConversationIdState(null);
    localStorage.removeItem(CHAT_STATE_KEY);
    loadConversations();
  }, [messages, savedTranscripts, saveTranscripts, loadConversations]);

  // Load a saved transcript
  const loadTranscript = useCallback((transcriptId: string) => {
    const transcript = savedTranscripts.find(t => t.id === transcriptId);
    if (transcript) {
      setMessagesState(transcript.messages);
      setConversationIdState(null); // Local transcripts don't have backend conversation IDs
    }
  }, [savedTranscripts]);

  // Delete a saved transcript
  const deleteTranscript = useCallback((transcriptId: string) => {
    const updatedTranscripts = savedTranscripts.filter(t => t.id !== transcriptId);
    setSavedTranscripts(updatedTranscripts);
    saveTranscripts(updatedTranscripts);
  }, [savedTranscripts, saveTranscripts]);

  const clearChatOnLogout = useCallback(() => {
    setMessagesState([]);
    setConversationIdState(null);
    setConversations([]);
    currentVisitorIdRef.current = null;
    localStorage.removeItem(CHAT_STATE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    // Note: We keep transcripts on logout as they may be useful
  }, []);

  const removeConversation = useCallback((convoId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convoId));
    if (conversationId === convoId) {
      setMessagesState([]);
      setConversationIdState(null);
      localStorage.removeItem(CHAT_STATE_KEY);
    }
  }, [conversationId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        conversationId,
        conversations,
        savedTranscripts,
        isLoadingHistory,
        setMessages,
        addMessage,
        setConversationId,
        loadConversations,
        loadConversation,
        startNewChat,
        saveAndStartNewChat,
        loadTranscript,
        deleteTranscript,
        clearChatOnLogout,
        removeConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
