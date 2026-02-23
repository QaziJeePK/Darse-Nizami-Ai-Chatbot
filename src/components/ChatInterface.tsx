import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BookOpen, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { sendMessageStream } from '../services/geminiService';
import { Message, ChatHistoryItem } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: 'Assalamu Alaikum! I am your Dars-e-Nizami AI Assistant. How can I help you with your studies today?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, botMessage]);

    try {
      const history: ChatHistoryItem[] = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      const stream = sendMessageStream(input, history);
      let fullContent = '';

      for await (const chunk of stream) {
        if (chunk.text) {
          fullContent += chunk.text;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMessageId ? { ...m, content: fullContent } : m
            )
          );
        }
      }
    } catch (error) {
      console.error('Failed to get response:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId
            ? { ...m, content: 'I apologize, but I encountered an error. Please try again later.' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([
        {
          id: '1',
          role: 'model',
          content: 'Assalamu Alaikum! I am your Dars-e-Nizami AI Assistant. How can I help you with your studies today?',
          timestamp: Date.now(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-2xl border-x border-stone-200">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-primary text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dars-e-Nizami AI</h1>
            <p className="text-xs text-white/70">Expert Scholarly Guidance</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          title="Clear Chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-stone-300">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                message.role === 'user' ? "bg-secondary text-white" : "bg-primary text-white"
              )}>
                {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={cn(
                "p-4 rounded-2xl shadow-sm",
                message.role === 'user' 
                  ? "bg-secondary text-white rounded-tr-none" 
                  : "bg-stone-50 border border-stone-200 rounded-tl-none"
              )}>
                <div className={cn(
                  "markdown-body prose prose-stone max-w-none",
                  message.role === 'user' ? "text-white prose-invert" : "text-stone-800"
                )}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <div className={cn(
                  "text-[10px] mt-2 opacity-50",
                  message.role === 'user' ? "text-right" : "text-left"
                )}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && messages[messages.length - 1].content === '' && (
          <div className="flex gap-4 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-6 bg-stone-50 border-t border-stone-200">
        <form onSubmit={handleSend} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about Sarf, Nahw, Fiqh, or Dars-e-Nizami books..."
            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none min-h-[56px] max-h-32"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-2 bottom-2 p-2 rounded-lg transition-all",
              input.trim() && !isLoading 
                ? "bg-primary text-white hover:bg-primary/90" 
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            )}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-stone-500 uppercase tracking-widest font-medium">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Powered by Gemini 3.1 Pro</span>
          <span className="w-1 h-1 bg-stone-300 rounded-full" />
          <a 
            href="https://darsenizami.net" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            A chat bot by darsenizami.net
          </a>
        </div>
      </footer>
    </div>
  );
}
