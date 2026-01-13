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
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { chatWithGuide } from "@/lib/api";
import { cn } from "@/lib/utils";

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const response = await chatWithGuide(content);
      
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

  const clearChat = () => {
    setMessages([]);
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
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-neon-cyan">
              <Bot className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white">AI Study Guide</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Get personalized study advice and learning recommendations
          </p>
        </motion.div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col glass-card overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
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
                  {messages.map((message, index) => (
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
                        <p className={cn(
                          "text-sm whitespace-pre-wrap",
                          message.role === "user" ? "text-black" : "text-gray-200"
                        )}>
                          {message.content}
                        </p>
                        
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
            {messages.length > 0 && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={clearChat}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Clear chat
                </button>
              </div>
            )}
            
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
        </div>
      </div>
    </div>
  );
}
