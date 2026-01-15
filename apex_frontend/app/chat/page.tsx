"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Lightbulb,
  Copy,
  Check,
  History,
  Plus,
  Trash2,
  ChevronLeft
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { chatWithGuide, getChatConversations, getChatMessages, deleteChatConversation, ChatConversation } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

const suggestedQuestions = [
  "How can I improve my coding skills?",
  "What's the best way to learn machine learning?",
  "How do I stay focused while studying?",
  "What career path should I pursue in tech?",
  "How do I build a portfolio project?",
  "Tips for technical interview preparation?"
];

// Use sessionStorage so chat only persists during browser session, not across logins
const CHAT_SESSION_KEY = 'apex_chat_session';

interface ChatSession {
  messages: Message[];
  conversationId: string | null;
  userId: string | null; // Track which user this session belongs to
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save session to sessionStorage whenever messages change (session-only, not persistent)
  useEffect(() => {
    if (sessionRestored && messages.length > 0 && user) {
      const session: ChatSession = {
        messages: messages.map(m => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
        })),
        conversationId,
        userId: user.id
      };
      sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(session));
    }
  }, [messages, conversationId, sessionRestored, user]);

  // Restore session from sessionStorage on mount - only if same user
  useEffect(() => {
    if (!user) {
      setSessionRestored(true);
      return;
    }
    
    const savedSession = sessionStorage.getItem(CHAT_SESSION_KEY);
    if (savedSession) {
      try {
        const session: ChatSession = JSON.parse(savedSession);
        // Only restore if it belongs to the current user
        if (session.messages && session.messages.length > 0 && session.userId === user.id) {
          const restoredMessages = session.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(restoredMessages);
          setConversationId(session.conversationId);
        } else if (session.userId !== user.id) {
          // Different user, clear the session
          sessionStorage.removeItem(CHAT_SESSION_KEY);
        }
      } catch (e) {
        console.error('Failed to restore chat session:', e);
      }
    }
    setSessionRestored(true);
  }, [user]);

  // Load conversations on mount if user is logged in
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Clear session on logout
  useEffect(() => {
    if (!user && sessionRestored) {
      // User logged out - clear session (chat is already saved to DB via API)
      sessionStorage.removeItem(CHAT_SESSION_KEY);
      setMessages([]);
      setConversationId(null);
      setConversations([]);
    }
  }, [user, sessionRestored]);

  const loadConversations = async () => {
    if (!user) return; // Don't try to load if not logged in
    
    try {
      const convos = await getChatConversations();
      setConversations(convos);
      console.log('Loaded conversations:', convos.length);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      // Don't show error to user - history is optional
    }
  };

  const loadConversation = async (convoId: string) => {
    setLoadingHistory(true);
    try {
      const { messages: loadedMessages } = await getChatMessages(convoId);
      setConversationId(convoId);
      
      // Convert to Message format
      const formattedMessages: Message[] = loadedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));
      
      setMessages(formattedMessages);
      setShowHistory(false);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteConversation = async (convoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatConversation(convoId);
      setConversations(prev => prev.filter(c => c.id !== convoId));
      
      if (conversationId === convoId) {
        startNewChat();
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const startNewChat = () => {
    // Current conversation is already saved to DB via chat-guide API calls
    // Just clear the UI state to start fresh
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
    // Clear the session storage for new chat
    sessionStorage.removeItem(CHAT_SESSION_KEY);
    // Refresh conversation list to show the saved conversation
    if (user) {
      loadConversations();
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithGuide(content, undefined, conversationId || undefined);
      
      // Save conversation ID if this is a new conversation
      if (response.conversation_id && !conversationId) {
        setConversationId(response.conversation_id);
        // Refresh conversation list
        loadConversations();
      }
      
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: response.response,
        suggestions: response.suggestions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please make sure the backend server is running and try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen pt-20 pb-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-6rem)] flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 flex-shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showHistory && (
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-lg bg-apex-card border border-apex-border hover:border-neon-cyan/50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
              )}
              <div className="p-2 rounded-xl bg-neon-cyan">
                <Bot className="w-6 h-6 text-black" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-white">AI Study Guide</h1>
                <p className="text-gray-400 text-xs">
                  {conversationId ? "Conversation saved" : "Start a new conversation"}
                </p>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-2">
                <button
                  onClick={startNewChat}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-apex-card border border-apex-border hover:border-neon-cyan/50 transition-colors text-sm text-gray-300"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
                    showHistory 
                      ? "bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan"
                      : "bg-apex-card border-apex-border text-gray-300 hover:border-neon-cyan/50"
                  )}
                >
                  <History className="w-4 h-4" />
                  History
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col glass-card overflow-hidden">
          {/* History View */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Chat History</h3>
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-gray-600 text-sm mt-1">Start chatting to save your history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((convo) => (
                    <motion.div
                      key={convo.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => loadConversation(convo.id)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all group",
                        conversationId === convo.id
                          ? "bg-neon-cyan/10 border border-neon-cyan/30"
                          : "bg-apex-darker border border-apex-border hover:border-neon-cyan/30"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{convo.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(convo.updated_at)}</p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(convo.id, e)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center p-6"
                  >
                    <div className="p-4 rounded-2xl bg-neon-cyan/10 mb-6">
                      <Sparkles className="w-12 h-12 text-neon-cyan" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      How can I help you today?
                    </h2>
                    <p className="text-gray-400 mb-6 max-w-md">
                      Ask me anything about learning, career advice, study techniques, or course recommendations.
                      {user && " Your chat will be saved automatically."}
                    </p>

                    {/* Suggested Questions */}
                    <div className="w-full max-w-lg">
                      <p className="text-sm text-gray-500 mb-3">Try asking:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {suggestedQuestions.slice(0, 4).map((question, index) => (
                          <motion.button
                            key={question}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleSuggestionClick(question)}
                            className="p-3 text-left text-sm text-gray-300 bg-apex-darker rounded-lg border border-apex-border hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all"
                          >
                            <Lightbulb className="w-4 h-4 text-neon-cyan inline mr-2" />
                            {question}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={cn(
                            "flex gap-3",
                            message.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                          {message.role === "assistant" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neon-cyan flex items-center justify-center">
                              <Bot className="w-5 h-5 text-black" />
                            </div>
                          )}
                          
                          <div className={cn(
                            "max-w-[80%] rounded-2xl p-4",
                            message.role === "user"
                              ? "bg-neon-cyan text-black rounded-br-md"
                              : "bg-apex-card border border-apex-border rounded-bl-md"
                          )}>
                            {message.role === "user" ? (
                              <p className="text-sm whitespace-pre-wrap text-black">
                                {message.content}
                              </p>
                            ) : (
                              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:text-gray-200 prose-p:my-3 prose-p:leading-relaxed prose-strong:text-neon-cyan prose-ul:my-3 prose-ul:space-y-1 prose-ol:my-3 prose-ol:space-y-1 prose-li:my-1 prose-code:text-neon-green prose-code:bg-apex-darker prose-code:px-1 prose-code:rounded [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                <ReactMarkdown>
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )}
                            
                            {message.role === "assistant" && (
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-apex-border">
                                <button
                                  onClick={() => copyToClipboard(message.content, message.id)}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                  {copiedId === message.id ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Suggestions */}
                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-apex-border">
                                <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
                                <div className="flex flex-wrap gap-2">
                                  {message.suggestions.map((suggestion, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="px-3 py-1 text-xs bg-apex-darker text-gray-300 rounded-full border border-apex-border hover:border-neon-cyan/50 hover:text-neon-cyan transition-all"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {message.role === "user" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-apex-card border border-apex-border flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Loading Indicator */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neon-cyan flex items-center justify-center">
                          <Bot className="w-5 h-5 text-black" />
                        </div>
                        <div className="bg-apex-card border border-apex-border rounded-2xl rounded-bl-md p-4">
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-sm text-gray-400">Thinking...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 p-4 border-t border-apex-border bg-apex-darker/50">
                <form onSubmit={handleSubmit} className="flex items-end gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything about learning..."
                      rows={1}
                      className="w-full px-4 py-3 bg-apex-card border border-apex-border rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-neon-cyan/50 transition-colors"
                      style={{ minHeight: "48px", maxHeight: "120px" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "flex-shrink-0 p-3 rounded-xl transition-all",
                      input.trim() && !isLoading
                        ? "bg-neon-cyan text-black hover:shadow-neon-cyan"
                        : "bg-apex-card text-gray-500 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
