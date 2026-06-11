import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import NotFound from "@/pages/not-found";
import { Home as HomeIcon, Search, PlusCircle, Heart, User } from "lucide-react";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Browse from "@/pages/Browse";
import ProductDetail from "@/pages/ProductDetail";
import SellerDashboard from "@/pages/seller/Dashboard";
import SellerProducts from "@/pages/seller/Products";
import SellerProductForm from "@/pages/seller/ProductForm";
import Messages from "@/pages/Messages";
import MessageDetail from "@/pages/MessageDetail";
import Profile from "@/pages/Profile";
import ProfileSettings from "@/pages/ProfileSettings";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminProducts from "@/pages/admin/Products";
import AdminReports from "@/pages/admin/Reports";

function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg md:hidden">
      <div className="flex items-stretch h-14">
        <Link href="/" className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${isActive("/") && location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
          <HomeIcon className="w-5 h-5" />
          Home
        </Link>
        <Link href="/browse" className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${isActive("/browse") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
          <Search className="w-5 h-5" />
          Browse
        </Link>
        <Link href="/seller/products/new" className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-secondary rounded-full w-12 h-12 flex items-center justify-center shadow-md -mt-4">
            <PlusCircle className="w-6 h-6 text-white" />
          </div>
        </Link>
        <Link href="/favorites" className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors text-muted-foreground hover:text-foreground`}>
          <Heart className="w-5 h-5" />
          Saved
        </Link>
        {user ? (
          <Link href={`/profile/${user.id}`} className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${isActive("/profile") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <User className="w-5 h-5" />
            Profile
          </Link>
        ) : (
          <Link href="/login" className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${isActive("/login") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <User className="w-5 h-5" />
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/browse" component={Browse} />
          <Route path="/products/:id" component={ProductDetail} />

          <Route path="/seller/dashboard" component={SellerDashboard} />
          <Route path="/seller/products" component={SellerProducts} />
          <Route path="/seller/products/new" component={SellerProductForm} />
          <Route path="/seller/products/:id/edit" component={SellerProductForm} />

          <Route path="/messages" component={Messages} />
          <Route path="/messages/:id" component={MessageDetail} />

          <Route path="/profile/settings" component={ProfileSettings} />
          <Route path="/profile/:id" component={Profile} />

          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/products" component={AdminProducts} />
          <Route path="/admin/reports" component={AdminReports} />

          <Route component={NotFound} />
        </Switch>
      </main>
      <MobileBottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient();

export default App;
