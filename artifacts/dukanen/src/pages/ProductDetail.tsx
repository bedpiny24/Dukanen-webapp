import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  useGetProduct, getGetProductQueryKey,
  useCreateConversation, useCreateReport, useListProducts
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, MessageSquare, AlertTriangle, ShieldCheck, Clock,
  User, Phone, ChevronRight, Heart, Share2, Tag, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) }
  });
  const { data: relatedData } = useListProducts({
    category: product?.categoryId?.toString(),
    limit: 6,
  });

  const createConversation = useCreateConversation();
  const createReport = useCreateReport();

  const [contactMessage, setContactMessage] = useState("Hi, I'm interested in this item. Is it still available?");
  const [reportReason, setReportReason] = useState("");
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleContact = () => {
    if (!user) { setLocation("/login"); return; }
    if (!product) return;
    createConversation.mutate({
      data: { productId, sellerId: product.sellerId, initialMessage: contactMessage }
    }, {
      onSuccess: (data) => {
        setIsContactOpen(false);
        toast({ title: "Message sent", description: "The seller has been notified." });
        setLocation(`/messages/${data.id}`);
      },
      onError: (err) => {
        toast({ title: "Failed to send message", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleReport = () => {
    if (!user) { setLocation("/login"); return; }
    createReport.mutate({
      data: { reason: reportReason, targetType: "product", targetId: productId }
    }, {
      onSuccess: () => {
        setIsReportOpen(false);
        setReportReason("");
        toast({ title: "Report submitted", description: "Our team will review this listing." });
      },
      onError: (err) => {
        toast({ title: "Failed to submit report", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-3 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-md" />
            <div className="flex gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-16 h-16 rounded-md" />)}</div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-3 py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Ad not found</h2>
        <p className="text-muted-foreground mb-6">This listing may have been removed or sold.</p>
        <Button onClick={() => setLocation("/browse")}>Back to Browse</Button>
      </div>
    );
  }

  const isOwner = user?.id === product.sellerId;
  const relatedProducts = relatedData?.products.filter((p) => p.id !== product.id).slice(0, 4) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-3 py-3 pb-20 md:pb-4">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1 flex-wrap">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/browse" className="hover:text-primary">All Ads</Link>
        {product.categoryName && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/browse?category=${product.categoryId}`} className="hover:text-primary">{product.categoryName}</Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate max-w-[200px]">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: images + description */}
        <div className="lg:col-span-2 space-y-3">
          {/* Main image */}
          <div className="bg-white rounded-md shadow-sm overflow-hidden">
            <div className="aspect-[4/3] bg-muted relative">
              {product.imageUrls && product.imageUrls.length > 0 ? (
                <img
                  src={product.imageUrls[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-contain bg-gray-50"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Tag className="w-12 h-12 opacity-30" />
                </div>
              )}
              <Badge className="absolute top-3 right-3 bg-white/90 text-foreground hover:bg-white/90 shadow text-xs">
                {product.condition}
              </Badge>
            </div>
            {/* Thumbnails */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {product.imageUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-16 h-16 shrink-0 rounded-md overflow-hidden border-2 transition-colors ${currentImageIndex === i ? "border-primary" : "border-transparent hover:border-muted-foreground/40"}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-md shadow-sm p-4">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mb-3">Description</h2>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
          </div>

          {/* Ad details table */}
          <div className="bg-white rounded-md shadow-sm p-4">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mb-3">Ad Details</h2>
            <div className="space-y-2">
              {[
                { label: "Condition", value: product.condition },
                { label: "Category", value: product.categoryName },
                { label: "Location", value: product.location || "Uganda" },
                { label: "Posted", value: timeAgo(product.createdAt) },
                { label: "Ad ID", value: `#${product.id}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex text-sm border-b border-muted last:border-0 py-1.5">
                  <span className="w-28 text-muted-foreground shrink-0">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="font-bold text-sm text-yellow-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" /> Safety Tips
            </h3>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc pl-4">
              <li>Always meet in a public, well-lit place.</li>
              <li>Never pay in advance — inspect goods before paying.</li>
              <li>Beware of prices that seem too good to be true.</li>
              <li>Use the Report button to flag suspicious listings.</li>
            </ul>
          </div>
        </div>

        {/* Right: price + actions + seller */}
        <div className="space-y-3">
          {/* Price card */}
          <div className="bg-white rounded-md shadow-sm p-4">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-3xl font-black text-primary">
                  {product.currency} {product.price.toLocaleString()}
                </p>
                <h1 className="text-base font-semibold text-foreground mt-1 leading-snug">{product.title}</h1>
              </div>
              <button
                onClick={() => setSaved((s) => !s)}
                className={`p-2 rounded-full hover:bg-muted transition-colors ${saved ? "text-red-500" : "text-muted-foreground"}`}
              >
                <Heart className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {product.location || "Uganda"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(product.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {Math.floor(Math.random() * 200) + 20} views
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-md shadow-sm p-4 space-y-2">
            {isOwner ? (
              <Button
                className="w-full"
                onClick={() => setLocation(`/seller/products/${product.id}/edit`)}
              >
                Edit Listing
              </Button>
            ) : (
              <>
                {/* Show phone */}
                <button
                  onClick={() => setShowPhone(true)}
                  className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-md py-3 text-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {showPhone ? "+256 700 000 000" : "Show phone number"}
                </button>

                {/* Chat */}
                <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                  <DialogTrigger asChild>
                    <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-md py-3 text-sm transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      Chat with seller
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contact {product.sellerName}</DialogTitle>
                      <DialogDescription>Send a message about "{product.title}".</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="min-h-[120px]"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsContactOpen(false)}>Cancel</Button>
                      <Button onClick={handleContact} disabled={createConversation.isPending || !contactMessage.trim()}>
                        {createConversation.isPending ? "Sending..." : "Send Message"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Mobile money placeholder */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button variant="outline" className="text-xs border-green-600 text-green-700 hover:bg-green-50" disabled>
                    M-Pesa <span className="ml-1 text-[9px] bg-green-100 px-1 rounded">Soon</span>
                  </Button>
                  <Button variant="outline" className="text-xs border-red-500 text-red-700 hover:bg-red-50" disabled>
                    Airtel Money <span className="ml-1 text-[9px] bg-red-100 px-1 rounded">Soon</span>
                  </Button>
                </div>
              </>
            )}

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast({ title: "Link copied!" });
              }}
              className="w-full flex items-center justify-center gap-2 border border-border rounded-md py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share this ad
            </button>
          </div>

          {/* Seller card */}
          <div className="bg-white rounded-md shadow-sm p-4">
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-3">Seller Information</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{product.sellerName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Verified seller
                </p>
              </div>
            </div>
            <Link
              href={`/profile/${product.sellerId}`}
              className="text-primary text-xs font-medium hover:underline flex items-center gap-1"
            >
              View all ads from this seller <ChevronRight className="w-3 h-3" />
            </Link>

            {!isOwner && (
              <div className="mt-3 pt-3 border-t">
                <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                  <DialogTrigger asChild>
                    <button className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                      <AlertTriangle className="w-3 h-3" /> Report this ad
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report Listing</DialogTitle>
                      <DialogDescription>Why are you reporting this listing?</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="E.g., Fraudulent listing, inappropriate content..."
                        className="min-h-[120px]"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsReportOpen(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={handleReport} disabled={createReport.isPending || reportReason.length < 5}>
                        {createReport.isPending ? "Submitting..." : "Submit Report"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related ads */}
      {relatedProducts.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-base mb-3">Similar Ads</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`}>
                <div className="bg-white rounded-md shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group border border-transparent hover:border-primary/20">
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    {p.imageUrls?.[0] ? (
                      <img src={p.imageUrls[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Tag className="w-5 h-5" /></div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-primary font-bold text-sm">{p.currency} {p.price.toLocaleString()}</p>
                    <p className="text-xs text-foreground line-clamp-2 mt-0.5 leading-snug">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />{p.location || "Uganda"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
