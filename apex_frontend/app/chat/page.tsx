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
  ChevronLeft,
  Save
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { chatWithGuide, deleteChatConversation } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import ReactMarkdown from "react-markdown";

const suggestedQuestions = [
  "How can I improve my coding skills?",
  "What's the best way to learn machine learning?",
  "How do I stay focused while studying?",
  "What career path should I pursue in tech?",
  "How do I build a portfolio project?",
  "Tips for technical interview preparation?"
];

export default function ChatPage() {
  const { user } = useAuth();
  const {
    messages,
    conversationId,
    conversations,
    savedTranscripts,
    isLoadingHistory,
    addMessage,
    setConversationId,
    loadConversations,
    loadConversation,
    startNewChat,
    saveAndStartNewChat,
    loadTranscript,
    deleteTranscript,
    removeConversation
  } = useChat();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM has updated before scrolling
    const timeout = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timeout);
  }, [messages]);

  // Load conversations on mount if user is logged in
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  const handleDeleteConversation = async (convoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatConversation(convoId);
      removeConversation(convoId);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleStartNewChat = () => {
    startNewChat();
    setShowHistory(false);
  };

  const handleSaveAndStartNewChat = () => {
    saveAndStartNewChat();
    setShowHistory(false);
  };

  const handleLoadConversation = async (convoId: string) => {
    await loadConversation(convoId);
    setShowHistory(false);
  };

  const handleLoadTranscript = (transcriptId: string) => {
    loadTranscript(transcriptId);
    setShowHistory(false);
  };

  const handleDeleteTranscript = (transcriptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTranscript(transcriptId);
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage = {
      id: generateId(),
      role: "user" as const,
      content: content.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
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

      const assistantMessage = {
        id: generateId(),
        role: "assistant" as const,
        content: response.response,
        suggestions: response.suggestions,
        timestamp: new Date(),
      };

      addMessage(assistantMessage);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage = {
        id: generateId(),
        role: "assistant" as const,
        content: "I'm sorry, I'm having trouble connecting right now. Please make sure the backend server is running and try again.",
        timestamp: new Date(),
      };

      addMessage(errorMessage);
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
    <div className="min-h-screen py-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-6rem)] flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 flex-shrink-0"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {showHistory && (
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-lg bg-apex-card border border-apex-border hover:border-neon-cyan/50 transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
              )}
              <div className="p-1.5 sm:p-2 rounded-xl bg-neon-cyan flex-shrink-0">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
              </div>
              <div className="text-left min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-white truncate">AI Study Guide</h1>
                <p className="text-gray-400 text-[10px] sm:text-xs truncate">
                  {conversationId ? "Conversation saved" : "Start a new conversation"}
                </p>
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {messages.length > 0 && (
                  <button
                    onClick={handleSaveAndStartNewChat}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-neon-green/10 border border-neon-green/30 hover:border-neon-green/50 hover:bg-neon-green/20 transition-colors text-sm text-neon-green"
                    title="Save chat and start new"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                )}
                <button
                  onClick={handleStartNewChat}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-apex-card border border-apex-border hover:border-neon-cyan/50 transition-colors text-sm text-gray-300"
                  title="New chat"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New</span>
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg border transition-colors text-sm",
                    showHistory
                      ? "bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan"
                      : "bg-apex-card border-apex-border text-gray-300 hover:border-neon-cyan/50"
                  )}
                  title="Chat history"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
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
              <h3 className="text-sm font-medium text-gray-400 mb-4">Saved Chats</h3>
              {savedTranscripts.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No saved chats yet</p>
                  <p className="text-gray-600 text-sm mt-1">Click "Save" or "New" to save your current chat</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedTranscripts.map((transcript) => (
                    <motion.div
                      key={transcript.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => handleLoadTranscript(transcript.id)}
                      className="p-3 rounded-lg cursor-pointer transition-all group bg-apex-darker border border-apex-border hover:border-neon-cyan/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{transcript.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">{formatDate(transcript.updatedAt.toString())}</p>
                            <span className="text-xs text-gray-600">•</span>
                            <p className="text-xs text-gray-600">{transcript.messages.length} messages</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteTranscript(transcript.id, e)}
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
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isLoadingHistory ? (
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
                            "rounded-2xl p-4",
                            message.role === "user"
                              ? "max-w-[80%] bg-neon-cyan text-black rounded-br-md"
                              : "flex-1 bg-transparent"
                          )}>
                            {message.role === "user" ? (
                              <p className="text-sm whitespace-pre-wrap text-black">
                                {message.content}
                              </p>
                            ) : (
                              <div className="text-sm text-gray-200 leading-7 space-y-4
                                [&>p]:mb-4
                                [&>p:last-child]:mb-0
                                [&_strong]:text-white [&_strong]:font-semibold
                                [&_em]:text-gray-300 [&_em]:italic
                                [&>ul]:space-y-3 [&>ul]:pl-5 [&>ul]:my-4
                                [&>ol]:space-y-3 [&>ol]:pl-5 [&>ol]:my-4
                                [&_li]:leading-7
                                [&_li_p]:mb-2
                                [&_code]:text-neon-green [&_code]:bg-apex-darker [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
                                [&_pre]:bg-apex-darker [&_pre]:border [&_pre]:border-apex-border [&_pre]:rounded-lg [&_pre]:my-4 [&_pre]:p-3 [&_pre]:overflow-x-auto
                                [&_a]:text-neon-cyan [&_a:hover]:underline
                                [&_blockquote]:border-l-2 [&_blockquote]:border-neon-cyan/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-400 [&_blockquote]:my-4
                                [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-3
                                [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-5 [&_h2]:mb-3
                                [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2
                                [&_hr]:border-apex-border [&_hr]:my-6">
                                <ReactMarkdown>
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )}

                            {message.role === "assistant" && (
                              <div className="flex items-center gap-3 mt-4 pt-3">
                                <button
                                  onClick={() => copyToClipboard(message.content, message.id)}
                                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                  {copiedId === message.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Suggestions */}
                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="mt-4 pt-3">
                                <p className="text-xs text-gray-500 mb-3">Suggestions:</p>
                                <div className="flex flex-wrap gap-2">
                                  {message.suggestions.map((suggestion, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="px-3 py-1.5 text-xs bg-apex-card text-gray-300 rounded-full border border-apex-border hover:border-neon-cyan/50 hover:text-neon-cyan transition-all"
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
                        <div className="flex-1 p-4">
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-sm text-gray-400">Thinking...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

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
