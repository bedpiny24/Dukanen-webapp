import { useState, useEffect, useCallback } from "react";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { MapPin, Clock, Search, SlidersHorizontal, LayoutGrid, List, ChevronDown, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const CONDITIONS = ["New", "Used", "Refurbished"] as const;

function formatPrice(price: number, currency: string) {
  return `${currency} ${price.toLocaleString()}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Browse() {
  const [, setLocation] = useLocation();
  const [params] = useState(() => new URLSearchParams(window.location.search));

  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useListCategories();
  const { data: productData, isLoading } = useListProducts({
    search: search || undefined,
    category: category || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    condition: condition || undefined,
    limit: 60,
  });

  const selectedCategory = categories?.find((c) => c.id.toString() === category);

  const sortedProducts = productData?.products
    ? [...productData.products].sort((a, b) => {
        if (sort === "price_asc") return a.price - b.price;
        if (sort === "price_desc") return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    : [];

  const clearFilter = (type: string) => {
    if (type === "search") setSearch("");
    if (type === "category") setCategory("");
    if (type === "condition") setCondition("");
    if (type === "price") { setMinPrice(""); setMaxPrice(""); }
  };

  const activeFilters = [
    search && { label: `"${search}"`, type: "search" },
    selectedCategory && { label: selectedCategory.name, type: "category" },
    condition && { label: condition, type: "condition" },
    (minPrice || maxPrice) && { label: `UGX ${minPrice || "0"} – ${maxPrice || "∞"}`, type: "price" },
  ].filter(Boolean) as { label: string; type: string }[];

  const FiltersPanel = () => (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wide">Search</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Keyword..."
            className="pl-9 bg-white text-sm h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wide">Category</h3>
        <div className="space-y-1">
          <button
            onClick={() => setCategory("")}
            className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors ${!category ? "text-primary font-semibold" : "text-foreground"}`}
          >
            All Categories
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id.toString())}
              className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors flex items-center justify-between ${category === cat.id.toString() ? "text-primary font-semibold bg-accent" : "text-foreground"}`}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-muted-foreground">{cat.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wide">Price (UGX)</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Min"
            type="number"
            className="bg-white text-sm h-9"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            placeholder="Max"
            type="number"
            className="bg-white text-sm h-9"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wide">Condition</h3>
        <div className="space-y-1">
          <button
            onClick={() => setCondition("")}
            className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors ${!condition ? "text-primary font-semibold" : "text-foreground"}`}
          >
            Any condition
          </button>
          {CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => setCondition(c)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors ${condition === c ? "text-primary font-semibold bg-accent" : "text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 py-4 pb-16 md:pb-4">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>›</span>
        {selectedCategory ? (
          <>
            <Link href="/browse" className="hover:text-primary">All Categories</Link>
            <span>›</span>
            <span className="text-foreground font-medium">{selectedCategory.name}</span>
          </>
        ) : (
          <span className="text-foreground font-medium">All Categories</span>
        )}
      </div>

      <div className="flex gap-4">
        {/* Sidebar — desktop */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="bg-white rounded-md shadow-sm p-4 sticky top-[6.5rem]">
            <FiltersPanel />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Sort / View bar */}
          <div className="bg-white rounded-md shadow-sm px-3 py-2 flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{sortedProducts.length}</span> ads
            </span>

            {/* Active filters */}
            {activeFilters.map((f) => (
              <button
                key={f.type}
                onClick={() => clearFilter(f.type)}
                className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full hover:bg-primary/20"
              >
                {f.label} <X className="w-3 h-3" />
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              {/* Mobile filter toggle */}
              <Button
                variant="outline"
                size="sm"
                className="md:hidden text-xs h-8"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> Filters
              </Button>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="text-xs border rounded-md px-2 h-8 bg-white text-foreground outline-none cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              {/* View toggle */}
              <div className="flex border rounded-md overflow-hidden hidden sm:flex">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-2 py-1 ${viewMode === "list" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-2 py-1 ${viewMode === "grid" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filters panel */}
          {showFilters && (
            <div className="bg-white rounded-md shadow-sm p-4 mb-3 md:hidden">
              <FiltersPanel />
            </div>
          )}

          {/* Listings */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="bg-white rounded-md shadow-sm py-16 text-center text-muted-foreground">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No ads found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {sortedProducts.map((product, i) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="bg-white rounded-md shadow-sm flex overflow-hidden cursor-pointer hover:shadow-md transition-shadow group border border-transparent hover:border-primary/20">
                    {/* Image */}
                    <div className="w-32 sm:w-44 shrink-0 bg-muted relative overflow-hidden">
                      {product.imageUrls?.[0] ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 min-h-[90px]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center min-h-[90px] text-muted-foreground">
                          <Tag className="w-6 h-6" />
                        </div>
                      )}
                      {i < 3 && (
                        <span className="absolute top-1.5 left-1.5 bg-secondary text-white text-[9px] font-bold px-1 py-0.5 rounded">TOP</span>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{product.title}</h3>
                        <p className="text-primary font-bold text-base mt-1">{formatPrice(product.price, product.currency)}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 hidden sm:block">{product.description}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{product.location || "Uganda"}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{product.condition}</Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{timeAgo(product.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Grid view
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedProducts.map((product, i) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="bg-white rounded-md shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group border border-transparent hover:border-primary/20">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {product.imageUrls?.[0] ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Tag className="w-6 h-6" />
                        </div>
                      )}
                      {i < 3 && (
                        <span className="absolute top-1.5 left-1.5 bg-secondary text-white text-[9px] font-bold px-1 py-0.5 rounded">TOP</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-primary font-bold text-sm">{formatPrice(product.price, product.currency)}</p>
                      <h3 className="text-xs font-medium text-foreground line-clamp-2 mt-0.5 leading-snug">{product.title}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />{product.location || "Uganda"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(product.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
