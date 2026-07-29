import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Code2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare
} from "lucide-react";

// TypeScript Interfaces for API and Chat State
export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  sql?: string | null;
  data?: Record<string, any>[] | null;
  errFlag?: boolean;
  timestamp: string;
}

interface ApiResponse {
  errFlag: boolean;
  message: string;
  answer: string | null;
  sql: string | null;
  data: Record<string, any>[];
}

import { BASE_URL } from "@/hooks/baseUrls";

const BACKEND_URL = `${BASE_URL}/ai-chat`;
const SHOW_DEV_TOOLS = false; // Set to false so normal users do not see SQL / Table inspect accordions


const SUGGESTED_PROMPTS: string[] = [
  "What's our current inventory?",
  "Which orders are delayed?",
  "Show me today's production output."
];


// Lightweight Markdown Renderer Component for Executive Tables & Formatted Text
const FormattedMarkdown: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;

  const renderTableBlock = (rowsRaw: string[], key: number) => {
    // Filter out table markdown dividers like |---|---|
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

export const AIChatDrawer: React.FC = () => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (
    location.pathname === "/login" ||
    location.pathname === "/employee-login" ||
    !token
  ) {
    return null;
  }

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [promptInput, setPromptInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "bot",
      text: "Meet Your AI-Powered Manufacturing ERP.\n\nThe AI Assistant analyzes your ERP data and delivers instant. What was once hidden inside reports is now just a conversation away.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);



  // State to track expanded SQL accordion per message
  const [expandedSqlId, setExpandedSqlId] = useState<string | null>(null);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || promptInput).trim();
    if (!textToSend || loading) return;

    // Append User Message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setPromptInput("");
    setLoading(true);

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: textToSend })
      });

      const resJson: ApiResponse = await response.json();

      if (resJson.errFlag) {
        // Error payload handling
        const botErrorMsg: ChatMessage = {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: resJson.message || "An error occurred while processing your request.",
          sql: resJson.sql,
          errFlag: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, botErrorMsg]);
      } else {
        // Success payload handling
        const botSuccessMsg: ChatMessage = {
          id: `bot-succ-${Date.now()}`,
          sender: "bot",
          text: resJson.answer || resJson.message || "Query completed successfully.",
          sql: resJson.sql,
          data: resJson.data,
          errFlag: false,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, botSuccessMsg]);
      }
    } catch (networkErr: any) {
      const botNetworkErrMsg: ChatMessage = {
        id: `bot-net-err-${Date.now()}`,
        sender: "bot",
        text: `Connection Notice: Could not complete request to backend (${BACKEND_URL}). ${networkErr?.message || "Please check server status or rephrase query."}`,
        errFlag: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, botNetworkErrMsg]);
    } finally {

      setLoading(false);
    }
  };

  const toggleSqlAccordion = (msgId: string) => {
    setExpandedSqlId((prev) => (prev === msgId ? null : msgId));
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-2xl border border-primary/20 transition-all transform hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-5 h-5 text-primary-foreground animate-pulse" />
          <span className="text-sm font-semibold tracking-wide">AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-lg h-[650px] max-h-[calc(100vh-3rem)] flex flex-col bg-card text-card-foreground rounded-2xl border border-border shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-muted/60 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                  <span>AI Database Chat</span>
                  <span className="text-[10px] bg-primary/10 text-primary font-mono px-2 py-0.5 rounded-full border border-primary/20">
                    qwen2.5-coder
                  </span>
                </h3>
                <p className="text-[11px] text-muted-foreground">Meet Your AI-Powered Manufacturing ERP.</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div className="flex items-end space-x-2 max-w-[92%]">
                  {msg.sender === "bot" && (
                    <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary shrink-0 mb-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : msg.errFlag
                        ? "bg-destructive/10 border border-destructive/30 text-destructive rounded-bl-sm"
                        : "bg-muted/70 text-foreground border border-border/80 rounded-bl-sm"
                    }`}
                  >
                    {/* Error Banner inside message if errFlag is true */}
                    {msg.errFlag && (
                      <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-destructive/20 text-destructive font-semibold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Execution Notice</span>
                      </div>
                    )}

                    <FormattedMarkdown content={msg.text} />

                    {/* SQL Accordion (Only visible when SHOW_DEV_TOOLS is true) */}
                    {SHOW_DEV_TOOLS && msg.sql && (
                      <div className="mt-3 pt-2 border-t border-border">
                        <button
                          onClick={() => toggleSqlAccordion(msg.id)}
                          className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-mono bg-muted/80 hover:bg-muted text-primary rounded-lg border border-border transition-colors"
                        >
                          <span className="flex items-center space-x-1.5">
                            <Code2 className="w-3.5 h-3.5 text-primary" />
                            <span>View Executed SQL</span>
                          </span>
                          {expandedSqlId === msg.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {expandedSqlId === msg.id && (
                          <div className="mt-2 bg-muted rounded-lg p-3 border border-border font-mono text-xs text-foreground">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                              Executed Query
                            </div>
                            <pre className="overflow-x-auto whitespace-pre-wrap break-all">
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

            {/* Loading Spinner Indicator */}
            {loading && (
              <div className="flex items-end space-x-2">
                <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted/80 border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm text-foreground text-xs flex items-center space-x-2.5">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="font-mono text-muted-foreground">
                    Generating report & querying database...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="px-4 py-2 bg-muted/40 border-t border-border flex items-center space-x-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] uppercase font-mono text-muted-foreground shrink-0">
              Suggestions:
            </span>
            {SUGGESTED_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(promptText)}
                disabled={loading}
                className="text-xs bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground px-3 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-muted/50 border-t border-border flex items-center space-x-2">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a question about database..."
              disabled={loading}
              className="flex-1 bg-background border border-input focus:border-ring focus:ring-1 focus:ring-ring rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-all disabled:opacity-50"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!promptInput.trim() || loading}
              className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all shadow-md disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );

};
