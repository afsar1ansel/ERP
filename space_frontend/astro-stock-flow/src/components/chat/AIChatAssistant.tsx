import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Bot,
  User,
  Send,
  Code2,
  Table,
  Copy,
  Check,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Database,
  Terminal,
  FileJson,
  RotateCcw
} from "lucide-react";
import { BASE_URL } from "@/hooks/baseUrls";

// Interfaces for API response and chat messages
export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sql?: string | null;
  data?: Record<string, any>[] | null;
  errFlag?: boolean;
  timestamp: string;
}

interface AIChatAssistantProps {
  mode?: "floating" | "standalone";
}

const SHOW_DEV_TOOLS = false; // Set to false so normal users do not see SQL / Table inspect accordions

const QUICK_SUGGESTIONS = [
  "Finished Goods Inventory",
  "Total Production Count",
  "List Active Employees",
  "Raw Material Stock"
];

// Lightweight Markdown Renderer Component for Executive Tables & Formatted Text
const FormattedMarkdown: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;

  const renderTableBlock = (rowsRaw: string[], key: number) => {
    const rows = rowsRaw.filter(
      (line) => !line.match(/^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)*\|?$/)
    );
    if (rows.length === 0) return null;

    const parseRowCells = (rowStr: string) =>
      rowStr
        .split("|")
        .map((cell) => cell.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    const headers = parseRowCells(rows[0]);
    const dataRows = rows.slice(1).map(parseRowCells);

    return (
      <div
        key={`table-${key}`}
        className="overflow-x-auto my-3 rounded-xl border border-border bg-card shadow-sm"
      >
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="bg-muted/70 border-b border-border text-primary font-medium">
              {headers.map((h, hIdx) => (
                <th key={hIdx} className="px-3 py-2 font-semibold whitespace-nowrap">
                  {h.replace(/\*\*/g, "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-card-foreground">
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-muted/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                    {cell.replace(/\*\*/g, "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };


  lines.forEach((line, idx) => {
    const isTableLine = line.trim().startsWith("|") && line.trim().endsWith("|");
    if (isTableLine) {
      inTable = true;
      tableBuffer.push(line);
    } else {
      if (inTable) {
        blocks.push(renderTableBlock(tableBuffer, idx));
        tableBuffer = [];
        inTable = false;
      }
      if (line.trim()) {
        const formattedText = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        blocks.push(
          <div
            key={`line-${idx}`}
            className="my-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />
        );
      }
    }
  });

  if (inTable && tableBuffer.length > 0) {
    blocks.push(renderTableBlock(tableBuffer, lines.length));
  }

  return <div className="space-y-1">{blocks}</div>;
};



import { useLocation } from "react-router-dom";

export const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ mode = "floating" }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Do not render AI Chat Assistant on login screens or if not authenticated
  if (
    location.pathname === "/login" ||
    location.pathname === "/employee-login" ||
    !token
  ) {
    return null;
  }

  const [isOpen, setIsOpen] = useState<boolean>(mode === "standalone");

  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Hello! I am your Space Luggage ERP AI Assistant. Ask me anything about inventory, production batches, raw materials, employees, or orders.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  // State to track open/closed accordions per message ID
  const [openSqlId, setOpenSqlId] = useState<string | null>(null);
  const [openDataId, setOpenDataId] = useState<string | null>(null);
  const [viewModeData, setViewModeData] = useState<Record<string, "table" | "json">>({});
  const [copiedSqlId, setCopiedSqlId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: textToSend })
      });

      const jsonResult = await response.json();

      const assistantMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "assistant",
        text: jsonResult.answer || jsonResult.message || "Query completed.",
        sql: jsonResult.sql || null,
        data: jsonResult.data || null,
        errFlag: jsonResult.errFlag ?? false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "assistant",
        text: `Connection Notice: Could not complete request to backend (${BASE_URL}/ai-chat). ${error?.message || "Please check server status or rephrase query."}`,
        errFlag: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {

      setLoading(false);
    }
  };

  const handleCopySql = (sql: string, msgId: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSqlId(msgId);
    setTimeout(() => setCopiedSqlId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "assistant",
        text: "Chat cleared. What else would you like to query from the ERP database?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  const renderChatContent = () => (
    <div className="flex flex-col h-full bg-card text-card-foreground rounded-2xl overflow-hidden border border-border shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 p-[1px] shadow-sm">
            <div className="w-full h-full bg-card rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-card" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wide flex items-center space-x-1.5">
              <span>ERP AI Assistant</span>
              <span className="text-[10px] bg-primary/10 text-primary font-mono px-2 py-0.5 rounded-full border border-primary/20">
                qwen2.5-coder
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground flex items-center space-x-1">
              <Database className="w-3 h-3 text-muted-foreground" />
              <span>Space Luggage MySQL</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleClearChat}
            title="Clear Chat"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {mode === "floating" && (
            <button
              onClick={() => setIsOpen(false)}
              title="Close Drawer"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-end space-x-2 max-w-[92%]">
              {msg.sender === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary shrink-0 mb-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : msg.errFlag
                    ? "bg-destructive/10 border border-destructive/30 text-destructive rounded-bl-sm"
                    : "bg-muted/70 text-foreground border border-border/80 rounded-bl-sm"
                }`}
              >
                {/* Text Response */}
                <FormattedMarkdown content={msg.text} />

                {/* Executed SQL Accordion (Visible only when SHOW_DEV_TOOLS is true) */}
                {SHOW_DEV_TOOLS && msg.sql && (
                  <div className="mt-3 pt-2 border-t border-border">
                    <button
                      onClick={() => setOpenSqlId(openSqlId === msg.id ? null : msg.id)}
                      className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-mono bg-muted/80 hover:bg-muted text-primary rounded-lg border border-border transition-colors"
                    >
                      <span className="flex items-center space-x-1.5">
                        <Terminal className="w-3.5 h-3.5 text-primary" />
                        <span>View Executed SQL</span>
                      </span>
                      {openSqlId === msg.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {openSqlId === msg.id && (
                      <div className="mt-2 bg-muted rounded-lg p-3 border border-border relative font-mono text-xs text-foreground">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Generated MySQL Query
                          </span>
                          <button
                            onClick={() => handleCopySql(msg.sql!, msg.id)}
                            className="flex items-center space-x-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors bg-background px-2 py-0.5 rounded border border-border"
                          >
                            {copiedSqlId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap break-all text-foreground">
                          {msg.sql}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0 mb-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>

            <span className="text-[10px] text-muted-foreground mt-1 px-1 font-mono">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {/* Animated Loading / Thinking State */}
        {loading && (
          <div className="flex items-end space-x-2">
            <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-muted/80 border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-foreground text-xs flex items-center space-x-3">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
              </div>
              <span className="font-mono text-muted-foreground">
                AI is querying MySQL & generating answer...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Action Chips */}
      <div className="px-4 py-2 bg-muted/40 border-t border-border flex items-center space-x-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] uppercase font-mono text-muted-foreground shrink-0">
          Quick Ask:
        </span>
        {QUICK_SUGGESTIONS.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSend(chip)}
            disabled={loading}
            className="text-xs bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground px-3 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-muted/50 border-t border-border flex items-center space-x-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask AI about production, inventory, or orders..."
          rows={1}
          disabled={loading}
          className="flex-1 bg-background border border-input focus:border-ring focus:ring-1 focus:ring-ring rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground resize-none outline-none transition-all disabled:opacity-50"
        />

        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all shadow-md disabled:opacity-40 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );


  if (mode === "standalone") {
    return <div className="w-full h-[650px]">{renderChatContent()}</div>;
  }

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-2xl shadow-blue-500/40 border border-white/10 transition-all hover:scale-105 active:scale-95 group"
        >
          <Sparkles className="w-5 h-5 text-blue-200 group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-medium tracking-wide">ERP AI Assistant</span>
        </button>
      )}

      {/* Floating Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[440px] h-[640px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-3rem)]">
          {renderChatContent()}
        </div>
      )}
    </>
  );
};
