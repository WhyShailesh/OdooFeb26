import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const { reply } = await api<{ reply: string }>('/ai/query', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I could not get a response. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105"
        title="AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-zinc-800/80 px-4 py-3">
            <span className="font-semibold text-white">FleetFlow AI</span>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex h-[360px] flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <p className="text-center text-sm text-zinc-500">Ask about profit, cost, drivers, maintenance, fuel, or trips.</p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-zinc-800 text-zinc-100 border border-white/5'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-2.5 text-sm text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex gap-2 border-t border-white/10 bg-zinc-800/50 p-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about fleet..."
                className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none"
                disabled={loading}
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-xl">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
