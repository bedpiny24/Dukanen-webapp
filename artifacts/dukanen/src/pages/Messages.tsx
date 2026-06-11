import { useListConversations } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { MessageSquare, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Messages() {
  const { data: conversations, isLoading } = useListConversations();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">Messages</h1>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : conversations?.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No conversations yet</h3>
            <p className="text-muted-foreground mt-1">When you contact a seller or a buyer contacts you, messages will appear here.</p>
          </div>
        ) : (
          conversations?.map((conv) => {
            const isUnread = conv.unreadCount && conv.unreadCount > 0;
            const otherParty = user.id === conv.buyerId ? conv.sellerName : conv.buyerName;
            const otherPartyRole = user.id === conv.buyerId ? "Seller" : "Buyer";

            return (
              <Link key={conv.id} href={`/messages/${conv.id}`}>
                <Card className={`hover-elevate cursor-pointer transition-colors ${isUnread ? 'bg-primary/5 border-primary/20' : ''}`}>
                  <CardContent className="p-4 sm:p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {conv.productImageUrl ? (
                        <img src={conv.productImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <MessageSquare className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{conv.productTitle || "Product Inquiry"}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                          {conv.lastMessageAt ? (
                            <>
                              <Clock className="w-3 h-3" />
                              {new Date(conv.lastMessageAt).toLocaleDateString()}
                            </>
                          ) : null}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">{otherParty}</span>
                        <Badge variant="outline" className="text-[10px] py-0 h-4">{otherPartyRole}</Badge>
                      </div>
                      <p className={`text-sm truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>

                    {isUnread && (
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">
                        {conv.unreadCount}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
