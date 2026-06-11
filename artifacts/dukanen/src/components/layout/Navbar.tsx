import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Store, Search, MessageSquare, UserCircle, ChevronDown,
  MapPin, PlusCircle, Heart, Bell, LogOut, Settings, LayoutDashboard, ShieldAlert
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCATIONS = [
  "Uganda", "Kampala", "Entebbe", "Jinja", "Mbale",
  "Mbarara", "Gulu", "Lira", "Arua", "Fort Portal",
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { data: categories } = useListCategories();
  const [searchValue, setSearchValue] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Uganda");
  const [showLocations, setShowLocations] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => { logout(); setLocation("/"); }
    });
  };

  const handleSearch = () => {
    if (searchValue.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm">
      {/* Main bar */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-3 h-14 flex items-center gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <Store className="w-6 h-6 text-white" />
            <span className="font-bold text-xl text-white hidden sm:block">Dukanen</span>
          </Link>

          {/* Location + Search */}
          <div className="flex-1 flex items-stretch mx-2 max-w-2xl">
            {/* Location picker */}
            <div className="relative hidden md:flex">
              <button
                onClick={() => setShowLocations(!showLocations)}
                className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-sm px-3 rounded-l-md border-r border-white/20 whitespace-nowrap h-full"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedLocation}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showLocations && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg border z-50 py-1 min-w-[160px]">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted text-foreground"
                      onClick={() => { setSelectedLocation(loc); setShowLocations(false); }}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search input */}
            <div className="flex flex-1">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="What are you looking for?"
                className="flex-1 text-sm px-3 h-9 bg-white text-foreground placeholder:text-muted-foreground outline-none md:rounded-none rounded-l-md"
              />
              <button
                onClick={handleSearch}
                className="bg-secondary hover:bg-secondary/90 text-white px-4 h-9 text-sm font-semibold rounded-r-md flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:block">Search</span>
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {user ? (
              <>
                <Link href="/messages" className="hidden sm:flex items-center gap-1 text-white/90 hover:text-white text-sm px-2 py-1 rounded">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden lg:block">Messages</span>
                </Link>
                <Link href="/favorites" className="hidden sm:flex items-center gap-1 text-white/90 hover:text-white text-sm px-2 py-1 rounded">
                  <Heart className="w-4 h-4" />
                  <span className="hidden lg:block">Saved</span>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm px-2 py-1 rounded">
                      <UserCircle className="w-5 h-5" />
                      <span className="hidden lg:block max-w-[100px] truncate">{user.name}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-3 py-2 border-b">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => setLocation(`/profile/${user.id}`)}>
                      <UserCircle className="w-4 h-4 mr-2" /> My Profile
                    </DropdownMenuItem>
                    {(user.role === "seller" || user.role === "admin") && (
                      <DropdownMenuItem onClick={() => setLocation("/seller/dashboard")}>
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Seller Dashboard
                      </DropdownMenuItem>
                    )}
                    {user.role === "admin" && (
                      <DropdownMenuItem onClick={() => setLocation("/admin")}>
                        <ShieldAlert className="w-4 h-4 mr-2" /> Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setLocation("/messages")}>
                      <MessageSquare className="w-4 h-4 mr-2" /> Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/profile/settings")}>
                      <Settings className="w-4 h-4 mr-2" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Link href="/login" className="text-white/90 hover:text-white text-sm px-3 py-1.5 rounded hidden sm:block">
                  Log in
                </Link>
                <Link href="/register" className="text-white/90 hover:text-white text-sm px-3 py-1.5 rounded hidden sm:block">
                  Register
                </Link>
              </div>
            )}
            <Button
              asChild
              className="bg-secondary hover:bg-secondary/90 text-white font-semibold text-sm px-3 h-9 shrink-0 ml-1"
            >
              <Link href="/seller/products/new">
                <PlusCircle className="w-4 h-4 mr-1" />
                Post Ad
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            <Link
              href="/browse"
              className="text-xs font-medium text-muted-foreground hover:text-primary px-3 py-2.5 whitespace-nowrap border-b-2 border-transparent hover:border-primary transition-colors shrink-0"
            >
              All Categories
            </Link>
            {categories?.slice(0, 10).map((cat) => (
              <Link
                key={cat.id}
                href={`/browse?category=${cat.id}`}
                className="text-xs font-medium text-muted-foreground hover:text-primary px-3 py-2.5 whitespace-nowrap border-b-2 border-transparent hover:border-primary transition-colors shrink-0"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
