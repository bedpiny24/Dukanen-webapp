import { useParams, Link } from "wouter";
import { useGetUser, getGetUserQueryKey, useGetUserProducts } from "@workspace/api-client-react";
import { UserCircle, MapPin, Calendar, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id, 10);

  const { data: profile, isLoading: profileLoading } = useGetUser(userId, {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) }
  });

  const { data: productsData, isLoading: productsLoading } = useGetUserProducts(userId, {
    query: { enabled: !!userId }
  });

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-20 text-muted-foreground">User not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Profile Header */}
      <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-primary/10 to-accent/5">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center text-primary shadow-sm">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserCircle className="w-16 h-16" />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{profile.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.location}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              {profile.role === 'seller' && (
                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/20">Verified Seller</Badge>
              )}
            </div>
          </div>
          
          <div className="bg-background/80 backdrop-blur rounded-xl p-4 text-center min-w-[120px]">
            <div className="text-2xl font-bold text-foreground">{profile.productCount || 0}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Listings</div>
          </div>
        </CardContent>
      </Card>

      {/* User's Products */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-foreground">Active Listings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[300px] w-full rounded-xl" />)
          ) : productsData?.products.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>This user has no active listings.</p>
            </div>
          ) : (
            productsData?.products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group h-full flex flex-col hover-elevate">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {product.imageUrls?.[0] ? (
                      <img src={product.imageUrls[0]} alt={product.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-background text-foreground">{product.condition}</Badge>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
                    <p className="text-primary font-bold text-xl mt-1">{product.currency} {product.price}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
