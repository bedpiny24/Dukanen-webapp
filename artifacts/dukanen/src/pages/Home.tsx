import { useState } from "react";
import { useListFeaturedProducts, useListCategories, useListProducts } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import {
  Search, MapPin, Clock, ChevronRight,
  BookOpen, Shirt, Smartphone, Wheat, Home as HomeIcon,
  Heart, Car, Wrench, Dumbbell, Tag, Sofa
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Books & Education": <BookOpen className="w-7 h-7" />,
  "Clothing & Fashion": <Shirt className="w-7 h-7" />,
  "Electronics": <Smartphone className="w-7 h-7" />,
  "Food & Agriculture": <Wheat className="w-7 h-7" />,
  "Furniture": <Sofa className="w-7 h-7" />,
  "Health & Beauty": <Heart className="w-7 h-7" />,
  "Home & Garden": <HomeIcon className="w-7 h-7" />,
  "Vehicles": <Car className="w-7 h-7" />,
  "Services": <Wrench className="w-7 h-7" />,
  "Sports & Hobbies": <Dumbbell className="w-7 h-7" />,
};

function formatPrice(price: number, currency: string) {
  return `${currency} ${price.toLocaleString()}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: featuredProducts, isLoading: isLoadingFeatured } = useListFeaturedProducts();
  const { data: categories, isLoading: isLoadingCategories } = useListCategories();
  const { data: recentData, isLoading: isLoadingRecent } = useListProducts({ limit: 20 });

  const handleSearch = () => {
    if (search.trim()) setLocation(`/browse?search=${encodeURIComponent(search.trim())}`);
    else setLocation("/browse");
  };

  return (
    <div className="flex-1 w-full pb-16 md:pb-0">
      {/* Compact Search Hero */}
      <section className="bg-primary py-5 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-stretch shadow-lg rounded-md overflow-hidden">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="What are you looking for?"
              className="flex-1 px-4 py-3 text-sm bg-white text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={handleSearch}
              className="bg-secondary hover:bg-secondary/90 text-white px-6 font-semibold text-sm flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3 py-4 space-y-6">
        {/* Categories Grid */}
        <section className="bg-white rounded-md shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-foreground">Popular Categories</h2>
            <Link href="/browse" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {isLoadingCategories
              ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)
              : categories?.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/browse?category=${cat.id}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-md hover:bg-accent transition-colors cursor-pointer group text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    {CATEGORY_ICONS[cat.name] ?? <Tag className="w-7 h-7" />}
                  </div>
                  <span className="text-xs font-medium text-foreground leading-tight line-clamp-2">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{cat.productCount} ads</span>
                </Link>
              ))}
          </div>
        </section>

        {/* Featured / Top Ads */}
        {featuredProducts && featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base flex items-center gap-2">
                <span className="bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">TOP</span>
                Featured Ads
              </h2>
              <Link href="/browse" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {isLoadingFeatured
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-md" />)
                : featuredProducts.slice(0, 5).map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div className="bg-white rounded-md shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group border border-transparent hover:border-primary/30">
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {product.imageUrls?.[0] ? (
                          <img
                            src={product.imageUrls[0]}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                        )}
                        <Badge className="absolute top-1.5 left-1.5 bg-secondary text-white text-[10px] px-1.5 py-0.5 hover:bg-secondary">TOP</Badge>
                      </div>
                      <div className="p-2.5">
                        <p className="text-primary font-bold text-sm">{formatPrice(product.price, product.currency)}</p>
                        <h3 className="text-xs text-foreground line-clamp-2 mt-0.5 leading-snug">{product.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {product.location || "Uganda"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* Recent Ads — Jiji horizontal list style */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">Recent Ads</h2>
            <Link href="/browse" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {isLoadingRecent
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)
              : recentData?.products.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="bg-white rounded-md shadow-sm flex overflow-hidden cursor-pointer hover:shadow-md transition-shadow group border border-transparent hover:border-primary/30">
                    {/* Image */}
                    <div className="w-28 sm:w-36 shrink-0 bg-muted relative overflow-hidden">
                      {product.imageUrls?.[0] ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground min-h-[80px]">
                          <Tag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-h-[80px]">
                      <div>
                        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{product.title}</h3>
                        <p className="text-primary font-bold text-base mt-1">{formatPrice(product.price, product.currency)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {product.location || "Uganda"}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(product.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        {/* Safety Tips */}
        <section className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="font-bold text-sm text-yellow-800 mb-2">Safety Tips</h3>
          <ul className="text-xs text-yellow-700 space-y-1 list-disc pl-4">
            <li>Always meet in a public place when buying or selling.</li>
            <li>Never send money in advance — inspect before you pay.</li>
            <li>Be wary of deals that seem too good to be true.</li>
            <li>Report suspicious listings using the Report button.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
