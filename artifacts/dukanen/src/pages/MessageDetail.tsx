import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { 
  useListMessages, 
  getListMessagesQueryKey, 
  useSendMessage,
  useGetMe
} from "@workspace/api-client-react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const conversationId = parseInt(id, 10);
  
  const { data: user } = useGetMe();
  const { data: messagesData, isLoading } = useListMessages(conversationId, {
    query: { enabled: !!conversationId, queryKey: getListMessagesQueryKey(conversationId), refetchInterval: 5000 }
  });
  
  const sendMessage = useSendMessage(conversationId);
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sendMessage.isPending) return;

    // Optimistic update logic could go here
    sendMessage.mutate({ data: { content } }, {
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(conversationId) });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full h-[calc(100vh-4rem)] p-4">
        <Skeleton className="h-14 w-full mb-4" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-16 w-2/3 rounded-xl" />
          <Skeleton className="h-16 w-2/3 rounded-xl ml-auto" />
          <Skeleton className="h-16 w-1/2 rounded-xl" />
        </div>
      </div>
    );
  }

  const messages = messagesData?.messages || [];
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto w-full bg-background border-x">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/messages"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">Conversation</h2>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                <div className={`px-4 py-2 rounded-2xl ${
                  isMe 
                    ? 'bg-primary text-primary-foreground rounded-br-sm' 
                    : 'bg-card border text-card-foreground rounded-bl-sm'
                }`}>
                  <p className="break-words">{msg.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-muted/50"
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!content.trim() || sendMessage.isPending}>
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
