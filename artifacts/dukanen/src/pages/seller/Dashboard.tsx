import { useGetSellerDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Package, Eye, MessageSquare, Plus, Activity, Tag, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerDashboard() {
  const { data: dashboard, isLoading } = useGetSellerDashboard();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full mt-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Seller Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your shop and track performance.</p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/seller/products/new">
            <Plus className="w-5 h-5" /> New Listing
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate transition-all border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{dashboard?.activeListings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">out of {dashboard?.totalListings || 0} total</p>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            <Eye className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{dashboard?.totalViews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">across all products</p>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Items Sold</CardTitle>
            <DollarSign className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{dashboard?.soldListings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">completed sales</p>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread Messages</CardTitle>
            <MessageSquare className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{dashboard?.unreadMessages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">awaiting response</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
              <div className="space-y-6">
                {dashboard.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="mt-0.5 bg-muted p-2 rounded-full shrink-0 h-fit">
                      {activity.type === 'message' && <MessageSquare className="w-4 h-4 text-primary" />}
                      {activity.type === 'product' && <Tag className="w-4 h-4 text-accent" />}
                      {activity.type === 'sale' && <DollarSign className="w-4 h-4 text-secondary" />}
                      {activity.type !== 'message' && activity.type !== 'product' && activity.type !== 'sale' && <Clock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No recent activity.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" asChild>
              <Link href="/seller/products">
                <Package className="w-4 h-4" /> Manage Listings
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" asChild>
              <Link href="/messages">
                <MessageSquare className="w-4 h-4" /> View Messages
                {dashboard?.unreadMessages ? (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {dashboard.unreadMessages}
                  </span>
                ) : null}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" asChild>
              <Link href="/profile/settings">
                <Tag className="w-4 h-4" /> Store Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
